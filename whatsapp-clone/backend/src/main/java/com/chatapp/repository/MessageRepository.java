package com.chatapp.repository;

import com.chatapp.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Get paginated messages for a chat
    @Query("SELECT m FROM Message m WHERE m.chat.id = :chatId AND m.isDeleted = false " +
           "AND :userId NOT IN (SELECT u.id FROM Message m2 JOIN m2.deletedForUsers u WHERE m2 = m) " +
           "ORDER BY m.createdAt DESC")
    Page<Message> findChatMessages(@Param("chatId") Long chatId, @Param("userId") Long userId, Pageable pageable);

    // Search messages in a chat
    @Query("SELECT m FROM Message m WHERE m.chat.id = :chatId AND m.isDeleted = false " +
           "AND :userId NOT IN (SELECT u.id FROM Message m2 JOIN m2.deletedForUsers u WHERE m2 = m) " +
           "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY m.createdAt DESC")
    Page<Message> searchMessages(@Param("chatId") Long chatId,
                                  @Param("query") String query,
                                  @Param("userId") Long userId,
                                  Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.chat.id = :chatId AND m.isDeleted = false " +
           "AND :userId NOT IN (SELECT u.id FROM Message m2 JOIN m2.deletedForUsers u WHERE m2 = m) " +
           "AND m.messageType IN ('IMAGE', 'VIDEO', 'FILE', 'AUDIO') " +
           "ORDER BY m.createdAt DESC")
    Page<Message> findMediaMessages(@Param("chatId") Long chatId, @Param("userId") Long userId, Pageable pageable);

    // Count unread messages for user in chat
    @Query("SELECT COUNT(m) FROM Message m " +
           "WHERE m.chat.id = :chatId AND m.sender.id != :userId AND m.isDeleted = false " +
           "AND m.id NOT IN (SELECT r.message.id FROM MessageReceipt r WHERE r.user.id = :userId AND r.status = 'SEEN')")
    long countUnreadMessages(@Param("chatId") Long chatId, @Param("userId") Long userId);

    // Mark all messages in chat as delivered
    @Modifying
    @Query("UPDATE Message m SET m.status = 'DELIVERED' " +
           "WHERE m.chat.id = :chatId AND m.sender.id != :userId AND m.status = 'SENT'")
    void markMessagesAsDelivered(@Param("chatId") Long chatId, @Param("userId") Long userId);

    @Modifying
    @Query(value = "INSERT IGNORE INTO message_deleted_for (message_id, user_id) SELECT id, :userId FROM messages WHERE chat_id = :chatId", nativeQuery = true)
    void clearChatForUser(@Param("chatId") Long chatId, @Param("userId") Long userId);

    // Get all messages for export
    @Query("SELECT m FROM Message m WHERE m.chat.id = :chatId " +
           "ORDER BY m.createdAt ASC")
    List<Message> findAllByChatId(@Param("chatId") Long chatId);

    // Find last message of a chat
    @Query("SELECT m FROM Message m WHERE m.chat.id = :chatId AND m.isDeleted = false " +
           "ORDER BY m.createdAt DESC LIMIT 1")
    java.util.Optional<Message> findLastMessage(@Param("chatId") Long chatId);
}
