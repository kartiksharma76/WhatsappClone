package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Per-user chat settings: pinned, archived, muted, unread count.
 */
@Entity
@Table(name = "user_chats",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "chat_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserChat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @Column(nullable = false)
    @Builder.Default
    private boolean isPinned = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean isArchived = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean isMuted = false;

    @Column(nullable = false)
    @Builder.Default
    private int unreadCount = 0;
}
