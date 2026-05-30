package com.chatapp.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MessageInfoResponse {
    private Long userId;
    private String userName;
    private String userAvatar;
    private LocalDateTime deliveredAt;
    private LocalDateTime seenAt;
}
