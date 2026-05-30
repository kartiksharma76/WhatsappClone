package com.chatapp.service;

import com.chatapp.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    UserResponse getCurrentUser(Long userId);
    UserResponse updateProfile(Long userId, String fullName, String about);
    UserResponse updateProfilePicture(Long userId, MultipartFile picture);
    Page<UserResponse> searchUsers(String query, Long currentUserId, Pageable pageable);
    UserResponse getUserById(Long userId);
    void blockUser(Long blockerId, Long blockedId);
    void unblockUser(Long blockerId, Long blockedId);
    UserResponse toggleReadReceipts(Long userId, boolean enabled);
    void deleteAccount(Long userId);
}
