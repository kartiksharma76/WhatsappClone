package com.chatapp.repository;

import com.chatapp.entity.UserChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserChatRepository extends JpaRepository<UserChat, Long> {

    Optional<UserChat> findByUserIdAndChatId(Long userId, Long chatId);

    List<UserChat> findByUserIdAndIsPinnedTrue(Long userId);

    List<UserChat> findByUserIdAndIsArchivedTrue(Long userId);

    @Modifying
    @Query("UPDATE UserChat uc SET uc.unreadCount = uc.unreadCount + 1 " +
           "WHERE uc.chat.id = :chatId AND uc.user.id != :senderId")
    void incrementUnreadCount(@Param("chatId") Long chatId, @Param("senderId") Long senderId);

    @Modifying
    @Query("UPDATE UserChat uc SET uc.unreadCount = 0 WHERE uc.user.id = :userId AND uc.chat.id = :chatId")
    void resetUnreadCount(@Param("userId") Long userId, @Param("chatId") Long chatId);
}
