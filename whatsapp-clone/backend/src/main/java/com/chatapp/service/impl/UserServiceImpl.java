package com.chatapp.service.impl;

import com.chatapp.dto.response.UserResponse;
import com.chatapp.entity.User;
import com.chatapp.exception.BadRequestException;
import com.chatapp.exception.ResourceNotFoundException;
import com.chatapp.repository.UserRepository;
import com.chatapp.service.FileStorageService;
import com.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        return mapToResponse(getUser(userId));
    }

    @Override
    public UserResponse updateProfile(Long userId, String fullName, String about) {
        User user = getUser(userId);
        if (fullName != null && !fullName.isBlank()) user.setFullName(fullName);
        if (about != null) user.setAbout(about);
        return mapToResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateProfilePicture(Long userId, MultipartFile picture) {
        User user = getUser(userId);
        String pictureUrl = fileStorageService.storeFile(picture);
        user.setProfilePicture(pictureUrl);
        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(String query, Long currentUserId, Pageable pageable) {
        return userRepository.searchUsers(query, currentUserId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        return mapToResponse(getUser(userId));
    }

    @Override
    public void blockUser(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new BadRequestException("Cannot block yourself");
        }
        User blocker = getUser(blockerId);
        User blocked = getUser(blockedId);
        blocker.getBlockedUsers().add(blocked);
        userRepository.save(blocker);
    }

    @Override
    public void unblockUser(Long blockerId, Long blockedId) {
        User blocker = getUser(blockerId);
        User blocked = getUser(blockedId);
        blocker.getBlockedUsers().remove(blocked);
        userRepository.save(blocker);
    }

    @Override
    public void deleteAccount(Long userId) {
        User user = getUser(userId);
        user.setActive(false);
        userRepository.save(user);
        log.info("Account deactivated for user: {}", userId);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    @Override
    public UserResponse toggleReadReceipts(Long userId, boolean enabled) {
        User user = getUser(userId);
        user.setReadReceiptsEnabled(enabled);
        user = userRepository.save(user);
        log.info("User {} toggled read receipts to {}", userId, enabled);
        return mapToResponse(user);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .about(user.getAbout())
                .profilePicture(user.getProfilePicture())
                .status(user.getStatus())
                .lastSeen(user.getLastSeen())
                .readReceiptsEnabled(user.isReadReceiptsEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
