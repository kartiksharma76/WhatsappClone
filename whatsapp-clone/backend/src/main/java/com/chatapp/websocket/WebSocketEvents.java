package com.chatapp.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * WebSocket event payloads for real-time communication.
 */
public class WebSocketEvents {

    // Typing indicator event
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TypingEvent {
        private Long chatId;
        private Long userId;
        private String userName;
        private boolean typing;
    }

    // User presence event
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PresenceEvent {
        private Long userId;
        private String status; // ONLINE, OFFLINE, AWAY
        private LocalDateTime lastSeen;
    }

    // Message delivery status event
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DeliveryEvent {
        private Long messageId;
        private Long chatId;
        private Long userId;
        private String status; // DELIVERED, SEEN
        private LocalDateTime timestamp;
    }

    // Generic notification event
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class NotificationEvent {
        private String type;
        private String title;
        private String body;
        private Long referenceId;
        private LocalDateTime timestamp;
    }
}
