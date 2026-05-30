package com.chatapp.service.impl;

import com.chatapp.dto.response.StatusResponse;
import com.chatapp.dto.response.UserResponse;
import com.chatapp.entity.Status;
import com.chatapp.entity.User;
import com.chatapp.exception.ResourceNotFoundException;
import com.chatapp.exception.UnauthorizedException;
import com.chatapp.repository.StatusRepository;
import com.chatapp.repository.UserRepository;
import com.chatapp.service.FileStorageService;
import com.chatapp.service.StatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StatusServiceImpl implements StatusService {

    private final StatusRepository statusRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public StatusResponse createStatus(String text, MultipartFile file, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Status status = new Status();
        status.setUser(user);
        status.setExpiresAt(LocalDateTime.now().plusHours(24));

        if (file != null && !file.isEmpty()) {
            String fileUrl = fileStorageService.storeFile(file);
            status.setMediaUrl(fileUrl);
            String contentType = file.getContentType();
            if (contentType != null && contentType.startsWith("video")) {
                status.setType(Status.StatusType.VIDEO);
            } else {
                status.setType(Status.StatusType.IMAGE);
            }
        } else {
            status.setType(Status.StatusType.TEXT);
        }

        if (text != null && !text.isEmpty()) {
            status.setText(text);
        }

        status = statusRepository.save(status);
        StatusResponse response = mapToResponse(status, userId);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("action", "CREATE");
            payload.put("status", response);
            payload.put("statusId", status.getId());
            payload.put("userId", userId);
            messagingTemplate.convertAndSend("/topic/status", payload);
        } catch (Exception e) {
            // Log but don't fail the request
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StatusResponse> getActiveStatuses(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<Status> statuses = statusRepository.findActiveStatusesForUser(userId, now);
        return statuses.stream()
                .map(s -> mapToResponse(s, userId))
                .collect(Collectors.toList());
    }

    @Override
    public void markStatusAsViewed(Long statusId, Long userId) {
        Status status = statusRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("Status", statusId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!status.getUser().getId().equals(userId)) {
            if (status.getViewedBy().add(user)) {
                statusRepository.save(status);

                try {
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("action", "VIEW");
                    payload.put("statusId", statusId);
                    payload.put("userId", status.getUser().getId());
                    payload.put("viewer", UserResponse.builder()
                            .id(user.getId())
                            .fullName(user.getFullName())
                            .profilePicture(user.getProfilePicture())
                            .build());
                    messagingTemplate.convertAndSend("/topic/status", payload);
                } catch (Exception e) {
                    // Log error but continue
                }
            }
        }
    }

    @Override
    public void deleteStatus(Long statusId, Long userId) {
        Status status = statusRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("Status", statusId));

        if (!status.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You can only delete your own status");
        }

        if (status.getMediaUrl() != null) {
            fileStorageService.deleteFile(status.getMediaUrl());
        }

        statusRepository.delete(status);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("action", "DELETE");
            payload.put("statusId", statusId);
            payload.put("userId", userId);
            messagingTemplate.convertAndSend("/topic/status", payload);
        } catch (Exception e) {
            // Log but continue
        }
    }

    @Scheduled(cron = "0 0 * * * *") // Run every hour
    public void deleteExpiredStatuses() {
        LocalDateTime now = LocalDateTime.now();
        List<Status> expired = statusRepository.findExpiredStatuses(now);
        for (Status status : expired) {
            if (status.getMediaUrl() != null) {
                try {
                    fileStorageService.deleteFile(status.getMediaUrl());
                } catch (Exception e) {
                    // Log error but continue deleting
                }
            }
            statusRepository.delete(status);

            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("action", "DELETE");
                payload.put("statusId", status.getId());
                payload.put("userId", status.getUser().getId());
                messagingTemplate.convertAndSend("/topic/status", payload);
            } catch (Exception e) {
                // Log but continue
            }
        }
    }

    private StatusResponse mapToResponse(Status status, Long currentUserId) {
        boolean isOwner = status.getUser().getId().equals(currentUserId);
        
        List<UserResponse> viewedBy = null;
        if (isOwner) {
            viewedBy = status.getViewedBy().stream()
                    .map(u -> UserResponse.builder()
                            .id(u.getId())
                            .fullName(u.getFullName())
                            .profilePicture(u.getProfilePicture())
                            .build())
                    .collect(Collectors.toList());
        }

        boolean viewed = status.getViewedBy().stream()
                .anyMatch(u -> u.getId().equals(currentUserId));

        return StatusResponse.builder()
                .id(status.getId())
                .user(UserResponse.builder()
                        .id(status.getUser().getId())
                        .fullName(status.getUser().getFullName())
                        .profilePicture(status.getUser().getProfilePicture())
                        .build())
                .mediaUrl(status.getMediaUrl())
                .text(status.getText())
                .type(status.getType())
                .createdAt(status.getCreatedAt())
                .expiresAt(status.getExpiresAt())
                .viewed(viewed)
                .viewedBy(viewedBy)
                .build();
    }
}
