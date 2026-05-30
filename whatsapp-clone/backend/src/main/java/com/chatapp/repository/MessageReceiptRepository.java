package com.chatapp.repository;

import com.chatapp.entity.MessageReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReceiptRepository extends JpaRepository<MessageReceipt, Long> {

    Optional<MessageReceipt> findByMessageIdAndUserId(Long messageId, Long userId);

    List<MessageReceipt> findByMessageId(Long messageId);

    @Modifying
    @Query("UPDATE MessageReceipt r SET r.status = 'SEEN', r.seenAt = :seenAt " +
           "WHERE r.message.chat.id = :chatId AND r.user.id = :userId AND r.status != 'SEEN'")
    void markAllAsSeenInChat(@Param("chatId") Long chatId,
                              @Param("userId") Long userId,
                              @Param("seenAt") LocalDateTime seenAt);
}
