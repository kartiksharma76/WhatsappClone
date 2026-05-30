package com.chatapp.controller;

import com.chatapp.dto.response.ApiResponse;
import com.chatapp.dto.response.UserResponse;
import com.chatapp.entity.User;
import com.chatapp.repository.UserRepository;
import com.chatapp.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and management APIs")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(userService.getCurrentUser(userId)));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String about,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(userService.updateProfile(userId, fullName, about)));
    }

    @PutMapping(value = "/me/picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Update profile picture")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfilePicture(
            @RequestParam("picture") MultipartFile picture,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(userService.updateProfilePicture(userId, picture)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search users by name or phone")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> searchUsers(
            @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(userService.searchUsers(q, userId, pageable)));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get a user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(userId)));
    }

    @PostMapping("/block/{targetId}")
    @Operation(summary = "Block a user")
    public ResponseEntity<ApiResponse<Void>> blockUser(
            @PathVariable Long targetId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        userService.blockUser(userId, targetId);
        return ResponseEntity.ok(ApiResponse.success("User blocked", null));
    }

    @DeleteMapping("/block/{targetId}")
    @Operation(summary = "Unblock a user")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            @PathVariable Long targetId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        userService.unblockUser(userId, targetId);
        return ResponseEntity.ok(ApiResponse.success("User unblocked", null));
    }

    @DeleteMapping("/me")
    @Operation(summary = "Delete (deactivate) current account")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        userService.deleteAccount(userId);
        return ResponseEntity.ok(ApiResponse.success("Account deleted", null));
    }

    @PutMapping("/me/settings/read-receipts")
    @Operation(summary = "Toggle read receipts")
    public ResponseEntity<ApiResponse<UserResponse>> toggleReadReceipts(
            @RequestParam boolean enabled,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(userService.toggleReadReceipts(userId, enabled)));
    }

    private Long getCurrentUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
    }
}
