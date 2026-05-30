package com.chatapp.service;

import com.chatapp.dto.request.ChatRequest;
import com.chatapp.dto.response.ChatResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ChatService {
    ChatResponse createPrivateChat(ChatRequest.CreatePrivateChat request, Long userId);
    ChatResponse createGroupChat(ChatRequest.CreateGroupChat request, Long userId);
    ChatResponse getChatById(Long chatId, Long userId);
    Page<ChatResponse> getUserChats(Long userId, Pageable pageable);
    List<ChatResponse> searchChats(Long userId, String query);
    ChatResponse updateGroup(Long chatId, ChatRequest.UpdateGroup request, Long userId);
    ChatResponse updateGroupIcon(Long chatId, MultipartFile icon, Long userId);
    void addParticipants(Long chatId, ChatRequest.AddParticipants request, Long adminId);
    void removeParticipant(Long chatId, Long participantId, Long adminId);
    void makeAdmin(Long chatId, Long userId, Long adminId);
    void removeAdmin(Long chatId, Long userId, Long adminId);
    void leaveGroup(Long chatId, Long userId);
    void deleteChat(Long chatId, Long userId);
    void clearChat(Long chatId, Long userId);
    void pinChat(Long chatId, Long userId, boolean pin);
    void archiveChat(Long chatId, Long userId, boolean archive);
    void muteChat(Long chatId, Long userId, boolean mute);
    void setDisappearingTimer(Long chatId, Long userId, Integer timerHours);
    String generateInviteToken(Long chatId, Long adminId);
    ChatResponse joinWithInviteToken(String token, Long userId);
    ChatResponse getOrCreateAiChat(Long userId);
}
