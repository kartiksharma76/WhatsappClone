package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * User entity representing a registered user in the chat application.
 * Supports profile management, online status, and blocked user tracking.
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_phone", columnList = "phone"),
    @Index(name = "idx_user_email", columnList = "email")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(unique = true, nullable = false, length = 20)
    private String phone;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 500)
    private String about;

    @Column(length = 500)
    private String profilePicture;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.OFFLINE;

    private LocalDateTime lastSeen;

    @Column(nullable = false)
    @Builder.Default
    private boolean isOnline = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean readReceiptsEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.USER;

    // Blocked users (many-to-many self-reference)
    @ManyToMany
    @JoinTable(
        name = "user_blocks",
        joinColumns = @JoinColumn(name = "blocker_id"),
        inverseJoinColumns = @JoinColumn(name = "blocked_id")
    )
    @Builder.Default
    private Set<User> blockedUsers = new HashSet<>();

    // Starred messages
    @ManyToMany
    @JoinTable(
        name = "user_starred_messages",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "message_id")
    )
    @Builder.Default
    private Set<Message> starredMessages = new HashSet<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum UserStatus {
        ONLINE, OFFLINE, AWAY
    }

    public enum Role {
        USER, ADMIN
    }
}
