package com.chatapp.service;

import com.chatapp.dto.request.ChatRequest;
import com.chatapp.dto.response.MessageInfoResponse;
import com.chatapp.dto.response.MessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface MessageService {
    MessageResponse sendMessage(ChatRequest.SendMessage request, Long senderId);
    MessageResponse sendFileMessage(Long chatId, MultipartFile file, Long senderId);
    Page<MessageResponse> getChatMessages(Long chatId, Long userId, Pageable pageable);
    Page<MessageResponse> getMediaMessages(Long chatId, Long userId, Pageable pageable);
    Page<MessageResponse> searchMessages(Long chatId, String query, Long userId, Pageable pageable);
    MessageResponse editMessage(ChatRequest.EditMessage request, Long userId);
    void deleteMessage(Long messageId, Long userId, boolean deleteForEveryone);
    MessageResponse reactToMessage(ChatRequest.ReactToMessage request, Long userId);
    void removeReaction(Long messageId, Long userId);
    void markAsDelivered(Long messageId, Long userId);
    void markAsSeen(Long chatId, Long userId);
    
    void starMessage(Long messageId, Long userId);
    void unstarMessage(Long messageId, Long userId);
    Page<MessageResponse> getStarredMessages(Long userId, Pageable pageable);
    void forwardMessage(Long messageId, List<Long> chatIds, Long userId);
    void broadcastMessage(ChatRequest.SendMessage request, List<Long> targetUserIds, Long senderId);
    String exportChat(Long chatId, Long userId);
    // Message info
    List<MessageInfoResponse> getMessageInfo(Long messageId, Long userId);
}
