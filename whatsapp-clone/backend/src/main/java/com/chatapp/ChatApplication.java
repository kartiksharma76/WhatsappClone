package com.chatapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the WhatsApp Clone Chat Application.
 *
 * Features:
 * - Real-time messaging via WebSocket/STOMP
 * - JWT-based authentication
 * - Group and one-to-one chats
 * - File/image sharing
 * - Message delivery tracking
 * - User presence (online/offline/typing)
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class ChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChatApplication.class, args);
    }
}
