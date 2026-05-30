package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Chat entity representing a conversation (one-to-one or group).
 */
@Entity
@Table(name = "chats", indexes = {
    @Index(name = "idx_chat_type", columnList = "chatType")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatType chatType;

    // Group chat fields
    private String groupName;
    @Column(name = "group_description", length = 500)
    private String groupDescription;
    private String groupIcon;

    @Column(name = "invite_token", unique = true)
    private String inviteToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    // Chat participants
    @ManyToMany
    @JoinTable(
        name = "chat_participants",
        joinColumns = @JoinColumn(name = "chat_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> participants = new HashSet<>();

    // Group admins
    @ManyToMany
    @JoinTable(
        name = "chat_admins",
        joinColumns = @JoinColumn(name = "chat_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> admins = new HashSet<>();

    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt DESC")
    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_message_id")
    private Message lastMessage;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;

    // Disappearing Messages Timer in hours (e.g., 24, 168, 2160). 0 or null means off.
    @Column(name = "disappearing_timer", columnDefinition = "integer default 0")
    private Integer disappearingTimer = 0;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum ChatType {
        PRIVATE, GROUP
    }
}
