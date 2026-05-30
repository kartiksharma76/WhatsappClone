package com.chatapp.service;

import com.chatapp.entity.Chat;
import com.chatapp.entity.Message;
import com.chatapp.repository.ChatRepository;
import com.chatapp.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisappearingMessageService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    // Run every hour
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupDisappearingMessages() {
        log.info("Running scheduled cleanup for disappearing messages...");
        List<Chat> chatsWithTimer = chatRepository.findAll().stream()
                .filter(chat -> chat.getDisappearingTimer() != null && chat.getDisappearingTimer() > 0)
                .toList();

        for (Chat chat : chatsWithTimer) {
            LocalDateTime threshold = LocalDateTime.now().minusHours(chat.getDisappearingTimer());
            
            // Delete messages older than the threshold
            List<Message> expiredMessages = messageRepository.findAllByChatId(chat.getId()).stream()
                    .filter(msg -> !msg.isDeleted() && msg.getCreatedAt().isBefore(threshold))
                    .toList();

            for (Message msg : expiredMessages) {
                // Soft delete
                msg.setDeleted(true);
                msg.setDeletedAt(LocalDateTime.now());
                msg.setContent(null);
                msg.setFileUrl(null);
                msg.setFileName(null);
                msg.setFileSize(null);
                msg.setFileMimeType(null);
                msg.setThumbnailUrl(null);
                msg.setMediaDuration(null);
                msg.setLinkPreviewTitle(null);
                msg.setLinkPreviewDesc(null);
                msg.setLinkPreviewImage(null);
                
                messageRepository.save(msg);
                log.debug("Disappeared message ID {}", msg.getId());
            }
        }
        log.info("Cleanup for disappearing messages complete.");
    }
}
