package com.chatapp.controller;

import com.chatapp.dto.response.ApiResponse;
import com.chatapp.dto.response.StatusResponse;
import com.chatapp.entity.User;
import com.chatapp.service.StatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/status")
@RequiredArgsConstructor
@Tag(name = "Status", description = "Status management APIs")
public class StatusController {

    private final StatusService statusService;
    private final com.chatapp.repository.UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Create a new status")
    public ResponseEntity<ApiResponse<StatusResponse>> createStatus(
            @RequestParam(value = "text", required = false) String text,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        System.out.println(">>> createStatus called! text=" + text + ", file=" + (file != null ? file.getOriginalFilename() + " (size: " + file.getSize() + ")" : "null"));
        try {
            Long userId = getCurrentUserId(userDetails);
            StatusResponse response = statusService.createStatus(text, file, userId);
            return ResponseEntity.ok(ApiResponse.success("Status created successfully", response));
        } catch (Exception e) {
            System.err.println(">>> Error in createStatus: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping
    @Operation(summary = "Get active statuses")
    public ResponseEntity<ApiResponse<List<StatusResponse>>> getActiveStatuses(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getCurrentUserId(userDetails);
        List<StatusResponse> statuses = statusService.getActiveStatuses(userId);
        return ResponseEntity.ok(ApiResponse.success("Active statuses fetched", statuses));
    }

    @PostMapping("/{statusId}/view")
    @Operation(summary = "Mark status as viewed")
    public ResponseEntity<ApiResponse<Void>> markStatusAsViewed(
            @PathVariable Long statusId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getCurrentUserId(userDetails);
        statusService.markStatusAsViewed(statusId, userId);
        return ResponseEntity.ok(ApiResponse.success("Status marked as viewed", null));
    }

    @DeleteMapping("/{statusId}")
    @Operation(summary = "Delete a status")
    public ResponseEntity<ApiResponse<Void>> deleteStatus(
            @PathVariable Long statusId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getCurrentUserId(userDetails);
        statusService.deleteStatus(statusId, userId);
        return ResponseEntity.ok(ApiResponse.success("Status deleted successfully", null));
    }

    private Long getCurrentUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
    }
}
