package com.chatapp.repository;

import com.chatapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    // Search users by name or phone (for adding to chats)
    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.id != :currentUserId " +
           "AND u.email != 'meta.ai@chatapp.com' " +
           "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR u.phone LIKE CONCAT('%', :query, '%'))")
    Page<User> searchUsers(@Param("query") String query,
                           @Param("currentUserId") Long currentUserId,
                           Pageable pageable);

    // Find online users
    @Query("SELECT u FROM User u WHERE u.status = 'ONLINE' AND u.isActive = true")
    List<User> findOnlineUsers();

    // Update user status
    @Modifying
    @Query("UPDATE User u SET u.status = :status, u.lastSeen = :lastSeen WHERE u.id = :userId")
    void updateUserStatus(@Param("userId") Long userId,
                          @Param("status") User.UserStatus status,
                          @Param("lastSeen") LocalDateTime lastSeen);

    // Check if user is blocked
    @Query("SELECT COUNT(u) > 0 FROM User u JOIN u.blockedUsers bu WHERE u.id = :blockerId AND bu.id = :blockedId")
    boolean isUserBlocked(@Param("blockerId") Long blockerId, @Param("blockedId") Long blockedId);

    // Check if a message is starred by a user
    @Query("SELECT COUNT(u) > 0 FROM User u JOIN u.starredMessages sm WHERE u.id = :userId AND sm.id = :messageId")
    boolean hasStarredMessage(@Param("userId") Long userId, @Param("messageId") Long messageId);
}
