package com.chatapp.websocket;

import com.chatapp.dto.response.MessageResponse;
import com.chatapp.entity.User;
import com.chatapp.repository.UserRepository;
import com.chatapp.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;

/**
 * Handles real-time WebSocket messages via STOMP protocol.
 *
 * Client subscribes to:
 *   /topic/chat/{chatId}     - chat messages
 *   /topic/typing/{chatId}   - typing events
 *   /topic/presence/{userId} - online/offline events
 *   /user/queue/errors       - private error messages
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final UserRepository userRepository;

    /**
     * Handle typing indicator from client.
     * Client sends to: /app/typing
     */
    @MessageMapping("/typing")
    public void handleTyping(@Payload WebSocketEvents.TypingEvent event, Principal principal) {
        log.debug("Typing event from {} in chat {}", principal.getName(), event.getChatId());
        // Broadcast typing event to all chat members
        messagingTemplate.convertAndSend(
            "/topic/typing/" + event.getChatId(),
            event
        );
    }

    /**
     * Handle user coming online.
     * Client sends to: /app/presence
     */
    @Transactional
    @MessageMapping("/presence")
    public void handlePresence(@Payload WebSocketEvents.PresenceEvent event, Principal principal) {
        log.debug("Presence update: {} is {}", principal.getName(), event.getStatus());
        
        userRepository.findByEmail(principal.getName()).ifPresent(user -> {
            User.UserStatus status = "ONLINE".equals(event.getStatus()) ? User.UserStatus.ONLINE : User.UserStatus.OFFLINE;
            LocalDateTime now = LocalDateTime.now();
            userRepository.updateUserStatus(user.getId(), status, now);
            event.setLastSeen(now);
        });

        // Broadcast to all (clients filter by their contacts)
        messagingTemplate.convertAndSend("/topic/presence", event);
    }

    /**
     * Acknowledge message delivery.
     * Client sends to: /app/delivered
     */
    @MessageMapping("/delivered")
    public void handleDelivered(@Payload WebSocketEvents.DeliveryEvent event, Principal principal) {
        // Update DB and notify sender
        messageService.markAsDelivered(event.getMessageId(), event.getUserId());
        messagingTemplate.convertAndSend(
            "/topic/delivery/" + event.getChatId(),
            event
        );
    }

    /**
     * Acknowledge message seen.
     * Client sends to: /app/seen
     */
    @MessageMapping("/seen")
    public void handleSeen(@Payload WebSocketEvents.DeliveryEvent event, Principal principal) {
        messageService.markAsSeen(event.getChatId(), event.getUserId());
        event.setStatus("SEEN");
        event.setTimestamp(LocalDateTime.now());
        messagingTemplate.convertAndSend(
            "/topic/delivery/" + event.getChatId(),
            event
        );
    }
}
