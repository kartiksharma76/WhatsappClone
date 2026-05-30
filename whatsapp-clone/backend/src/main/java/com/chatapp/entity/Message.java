package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Message entity with delivery tracking, reactions, and reply support.
 */
@Entity
@Table(name = "messages", indexes = {
    @Index(name = "idx_message_chat", columnList = "chat_id"),
    @Index(name = "idx_message_sender", columnList = "sender_id"),
    @Index(name = "idx_message_created", columnList = "createdAt")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    // For file/image/voice messages
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String fileMimeType;
    private Integer mediaDuration; // For voice/video in seconds
    private String thumbnailUrl;

    // Link Preview
    private String linkPreviewTitle;
    @Column(columnDefinition = "TEXT")
    private String linkPreviewDesc;
    private String linkPreviewImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MessageStatus status = MessageStatus.SENT;

    // Reply to another message
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private Message replyTo;

    // Message reactions
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MessageReaction> reactions = new ArrayList<>();

    // Message status per recipient (for group chats)
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MessageReceipt> receipts = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    private LocalDateTime deletedAt;

    @ManyToMany
    @JoinTable(name = "message_deleted_for",
            joinColumns = @JoinColumn(name = "message_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    @Builder.Default
    private java.util.Set<User> deletedForUsers = new java.util.HashSet<>();

    @Column(nullable = false)
    @Builder.Default
    private boolean isEdited = false;

    private LocalDateTime editedAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum MessageType {
        TEXT, IMAGE, VIDEO, AUDIO, VOICE, FILE, EMOJI, SYSTEM, LOCATION, CONTACT, POLL, PAYMENT, EVENT
    }

    public enum MessageStatus {
        SENDING, SENT, DELIVERED, SEEN, FAILED
    }
}
