package com.chatapp.controller;

import com.chatapp.dto.request.ChatRequest;
import com.chatapp.dto.response.ApiResponse;
import com.chatapp.dto.response.ChatResponse;
import com.chatapp.entity.User;
import com.chatapp.repository.UserRepository;
import com.chatapp.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/chats")
@RequiredArgsConstructor
@Tag(name = "Chats", description = "Chat management APIs")
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    @PostMapping("/private")
    @Operation(summary = "Create or get a private chat with another user")
    public ResponseEntity<ApiResponse<ChatResponse>> createPrivateChat(
            @Valid @RequestBody ChatRequest.CreatePrivateChat request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        ChatResponse chat = chatService.createPrivateChat(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(chat));
    }

    @PostMapping("/group")
    @Operation(summary = "Create a new group chat")
    public ResponseEntity<ApiResponse<ChatResponse>> createGroupChat(
            @Valid @RequestBody ChatRequest.CreateGroupChat request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        ChatResponse chat = chatService.createGroupChat(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(chat));
    }

    @GetMapping
    @Operation(summary = "Get all chats for current user")
    public ResponseEntity<ApiResponse<Page<ChatResponse>>> getUserChats(
            @PageableDefault(size = 20, sort = "updatedAt") Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(chatService.getUserChats(userId, pageable)));
    }

    @GetMapping("/{chatId}")
    @Operation(summary = "Get a specific chat by ID")
    public ResponseEntity<ApiResponse<ChatResponse>> getChat(
            @PathVariable Long chatId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(chatService.getChatById(chatId, userId)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search chats by name or participant")
    public ResponseEntity<ApiResponse<List<ChatResponse>>> searchChats(
            @RequestParam String q,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(chatService.searchChats(userId, q)));
    }

    @PutMapping("/{chatId}/group")
    @Operation(summary = "Update group chat info (admin only)")
    public ResponseEntity<ApiResponse<ChatResponse>> updateGroup(
            @PathVariable Long chatId,
            @Valid @RequestBody ChatRequest.UpdateGroup request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(chatService.updateGroup(chatId, request, userId)));
    }

    @PutMapping(value = "/{chatId}/group/icon", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Update group icon (admin only)")
    public ResponseEntity<ApiResponse<ChatResponse>> updateGroupIcon(
            @PathVariable Long chatId,
            @RequestParam("icon") MultipartFile icon,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(chatService.updateGroupIcon(chatId, icon, userId)));
    }

    @PostMapping("/{chatId}/participants")
    @Operation(summary = "Add participants to group (admin only)")
    public ResponseEntity<ApiResponse<Void>> addParticipants(
            @PathVariable Long chatId,
            @Valid @RequestBody ChatRequest.AddParticipants request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        chatService.addParticipants(chatId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Participants added", null));
    }

    @DeleteMapping("/{chatId}/participants/{participantId}")
    @Operation(summary = "Remove a participant from group (admin only)")
    public ResponseEntity<ApiResponse<Void>> removeParticipant(
            @PathVariable Long chatId,
            @PathVariable Long participantId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        chatService.removeParticipant(chatId, participantId, userId);
        return ResponseEntity.ok(ApiResponse.success("Participant removed", null));
    }

    @PostMapping("/{chatId}/admins/{targetUserId}")
    @Operation(summary = "Make a user an admin in group")
    public ResponseEntity<ApiResponse<Void>> makeAdmin(
            @PathVariable Long chatId,
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        chatService.makeAdmin(chatId, targetUserId, userId);
        return ResponseEntity.ok(ApiResponse.success("User made admin", null));
    }

    @DeleteMapping("/{chatId}/admins/{targetUserId}")
    @Operation(summary = "Remove admin rights from user")
    public ResponseEntity<ApiResponse<Void>> removeAdmin(
            @PathVariable Long chatId,
            @PathVariable Long targetUserId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        chatService.removeAdmin(chatId, targetUserId, userId);
        return ResponseEntity.ok(ApiResponse.success("Admin rights removed", null));
    }

    @PostMapping("/{chatId}/leave")
    @Operation(summary = "Leave a group chat")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable Long chatId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        chatService.leaveGroup(chatId, userId);
        return ResponseEntity.ok(ApiResponse.success("Left the group", null));
    }

    @DeleteMapping("/{chatId}")
    @Operation(summary = "Delete chat for current user")
    public ResponseEntity<ApiResponse<Void>> deleteChat(
            @PathVariable Long chatId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        chatService.deleteChat(chatId, userId);
        return ResponseEntity.ok(ApiResponse.success("Chat deleted", null));
    }

    @DeleteMapping("/{chatId}/clear")
    @Operation(summary = "Clear chat messages for current user")
    public ResponseEntity<ApiResponse<Void>> clearChat(
            @PathVariable Long chatId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        chatService.clearChat(chatId, userId);
        return ResponseEntity.ok(ApiResponse.success("Chat cleared", null));
    }

    @PutMapping("/{chatId}/pin")
    @Operation(summary = "Pin or unpin a chat")
    public ResponseEntity<ApiResponse<Void>> pinChat(
            @PathVariable Long chatId,
            @RequestParam boolean pinned,
            @AuthenticationPrincipal UserDetails userDetails) {
        chatService.pinChat(chatId, getCurrentUserId(userDetails), pinned);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{chatId}/archive")
    @Operation(summary = "Archive or unarchive a chat")
    public ResponseEntity<ApiResponse<Void>> archiveChat(
            @PathVariable Long chatId,
            @RequestParam boolean archived,
            @AuthenticationPrincipal UserDetails userDetails) {
        chatService.archiveChat(chatId, getCurrentUserId(userDetails), archived);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{chatId}/mute")
    @Operation(summary = "Mute or unmute a chat")
    public ResponseEntity<ApiResponse<Void>> muteChat(
            @PathVariable Long chatId,
            @RequestParam boolean muted,
            @AuthenticationPrincipal UserDetails userDetails) {
        chatService.muteChat(chatId, getCurrentUserId(userDetails), muted);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{chatId}/disappearing-timer")
    @Operation(summary = "Set disappearing messages timer (in hours)")
    public ResponseEntity<ApiResponse<Void>> setDisappearingTimer(
            @PathVariable Long chatId,
            @RequestParam Integer timerHours,
            @AuthenticationPrincipal UserDetails userDetails) {
        chatService.setDisappearingTimer(chatId, getCurrentUserId(userDetails), timerHours);
        return ResponseEntity.ok(ApiResponse.success("Timer updated", null));
    }

    @PostMapping("/{chatId}/invite-token")
    @Operation(summary = "Generate invite token for group chat")
    public ResponseEntity<ApiResponse<String>> generateInviteToken(
            @PathVariable Long chatId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long adminId = getCurrentUserId(userDetails);
        String token = chatService.generateInviteToken(chatId, adminId);
        return ResponseEntity.ok(ApiResponse.success("Invite token generated", token));
    }

    @PostMapping("/join/{token}")
    @Operation(summary = "Join group chat with invite token")
    public ResponseEntity<ApiResponse<ChatResponse>> joinWithInviteToken(
            @PathVariable String token,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        ChatResponse chat = chatService.joinWithInviteToken(token, userId);
        return ResponseEntity.ok(ApiResponse.success("Joined group successfully", chat));
    }

    @PostMapping("/ai")
    @Operation(summary = "Get or create private chat with Meta AI")
    public ResponseEntity<ApiResponse<ChatResponse>> getOrCreateAiChat(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        ChatResponse chat = chatService.getOrCreateAiChat(userId);
        return ResponseEntity.ok(ApiResponse.success("Opened Meta AI chat successfully", chat));
    }

    private Long getCurrentUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
    }
}
