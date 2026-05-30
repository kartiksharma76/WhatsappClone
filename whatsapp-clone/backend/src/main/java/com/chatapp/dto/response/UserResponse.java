package com.chatapp.dto.response;

import com.chatapp.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String about;
    private String profilePicture;
    private User.UserStatus status;
    private LocalDateTime lastSeen;
    private boolean readReceiptsEnabled;
    private LocalDateTime createdAt;
}
