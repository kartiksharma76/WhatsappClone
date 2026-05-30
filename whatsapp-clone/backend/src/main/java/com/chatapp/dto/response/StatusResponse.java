package com.chatapp.dto.response;

import com.chatapp.entity.Status;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class StatusResponse {
    private Long id;
    private UserResponse user;
    private String mediaUrl;
    private String text;
    private Status.StatusType type;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean viewed;
    private List<UserResponse> viewedBy; // For the owner to see who viewed
}
