package com.chatapp.repository;

import com.chatapp.entity.Chat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {

    // Find private chat between two users
    @Query("SELECT c FROM Chat c JOIN c.participants p1 JOIN c.participants p2 " +
           "WHERE c.chatType = 'PRIVATE' AND p1.id = :userId1 AND p2.id = :userId2")
    Optional<Chat> findPrivateChatBetweenUsers(@Param("userId1") Long userId1,
                                                @Param("userId2") Long userId2);

    // Get all chats for a user (ordered by last message)
    @Query("SELECT c FROM Chat c JOIN c.participants p " +
           "WHERE p.id = :userId AND c.isActive = true " +
           "ORDER BY c.updatedAt DESC")
    Page<Chat> findUserChats(@Param("userId") Long userId, Pageable pageable);

    // Search chats by group name or participant name
    @Query("SELECT DISTINCT c FROM Chat c JOIN c.participants p " +
           "WHERE p.id = :userId AND c.isActive = true " +
           "AND (LOWER(c.groupName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Chat> searchUserChats(@Param("userId") Long userId, @Param("query") String query);

    @Query("SELECT c FROM Chat c WHERE c.chatType = 'GROUP' AND " +
           "(LOWER(c.groupName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Chat> searchPublicGroups(@Param("query") String query);
    
    Optional<Chat> findByInviteToken(String inviteToken);

    // Check if user is in chat
    @Query("SELECT COUNT(c) > 0 FROM Chat c JOIN c.participants p " +
           "WHERE c.id = :chatId AND p.id = :userId")
    boolean isUserInChat(@Param("chatId") Long chatId, @Param("userId") Long userId);
}
