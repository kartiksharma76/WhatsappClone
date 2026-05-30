package com.chatapp.dto.response;

import com.chatapp.entity.Chat;
import com.chatapp.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChatResponse {
    private Long id;
    private Chat.ChatType chatType;
    private String name;          // group name or other user's name
    private String icon;          // group icon or other user's avatar
    private String about;         // group desc or other user's about
    private String status;        // other user's online status (private chat only)
    private LocalDateTime lastSeen;
    private boolean isBlockedByMe;
    private MessageResponse lastMessage;
    private int unreadCount;
    private boolean isPinned;
    private boolean isArchived;
    private boolean isMuted;
    private Integer disappearingTimer;
    private List<UserResponse> participants;
    private List<UserResponse> admins;
    private LocalDateTime createdAt;
}
