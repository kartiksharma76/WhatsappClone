package com.chatapp.controller;

import com.chatapp.dto.request.ChatRequest;
import com.chatapp.dto.response.ApiResponse;
import com.chatapp.dto.response.MessageInfoResponse;
import com.chatapp.dto.response.MessageResponse;
import com.chatapp.entity.User;
import com.chatapp.repository.UserRepository;
import com.chatapp.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
@Tag(name = "Messages", description = "Message sending and management")
public class MessageController {

    private final MessageService messageService;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Send a text message")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @Valid @RequestBody ChatRequest.SendMessage request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        MessageResponse message = messageService.sendMessage(request, userId);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping(value = "/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Send a file/image/voice message")
    public ResponseEntity<ApiResponse<MessageResponse>> sendFile(
            @RequestParam Long chatId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        MessageResponse message = messageService.sendFileMessage(chatId, file, userId);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @GetMapping("/chat/{chatId}")
    @Operation(summary = "Get paginated messages for a chat")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getChatMessages(
            @PathVariable Long chatId,
            @PageableDefault(size = 30) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getChatMessages(chatId, userId, pageable)));
    }

    @GetMapping("/chat/{chatId}/media")
    @Operation(summary = "Get paginated media messages for a chat")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getMediaMessages(
            @PathVariable Long chatId,
            @PageableDefault(size = 30) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getMediaMessages(chatId, userId, pageable)));
    }

    @GetMapping("/chat/{chatId}/search")
    @Operation(summary = "Search messages within a chat")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> searchMessages(
            @PathVariable Long chatId,
            @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.searchMessages(chatId, q, userId, pageable)));
    }

    @PutMapping("/edit")
    @Operation(summary = "Edit a sent message")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @Valid @RequestBody ChatRequest.EditMessage request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(messageService.editMessage(request, userId)));
    }

    @DeleteMapping("/{messageId}")
    @Operation(summary = "Delete a message")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable Long messageId,
            @RequestParam(defaultValue = "false") boolean deleteForEveryone,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        messageService.deleteMessage(messageId, userId, deleteForEveryone);
        return ResponseEntity.ok(ApiResponse.success("Message deleted", null));
    }

    @PostMapping("/react")
    @Operation(summary = "React to a message with an emoji")
    public ResponseEntity<ApiResponse<MessageResponse>> reactToMessage(
            @Valid @RequestBody ChatRequest.ReactToMessage request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(messageService.reactToMessage(request, userId)));
    }

    @DeleteMapping("/{messageId}/react")
    @Operation(summary = "Remove reaction from a message")
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        messageService.removeReaction(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Reaction removed", null));
    }

    @PostMapping("/chat/{chatId}/seen")
    @Operation(summary = "Mark all messages in chat as seen")
    public ResponseEntity<ApiResponse<Void>> markSeen(
            @PathVariable Long chatId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        messageService.markAsSeen(chatId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
    @PostMapping("/{messageId}/star")
    @Operation(summary = "Star a message")
    public ResponseEntity<ApiResponse<Void>> starMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        messageService.starMessage(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Message starred", null));
    }

    @DeleteMapping("/{messageId}/star")
    @Operation(summary = "Unstar a message")
    public ResponseEntity<ApiResponse<Void>> unstarMessage(
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        messageService.unstarMessage(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Message unstarred", null));
    }

    @GetMapping("/starred")
    @Operation(summary = "Get all starred messages for user")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getStarredMessages(
            @PageableDefault(size = 30) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.success(
                messageService.getStarredMessages(userId, pageable)));
    }

    @PostMapping("/forward")
    @Operation(summary = "Forward a message to multiple chats")
    public ResponseEntity<ApiResponse<Void>> forwardMessage(
            @RequestParam Long messageId,
            @RequestParam java.util.List<Long> chatIds,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        messageService.forwardMessage(messageId, chatIds, userId);
        return ResponseEntity.ok(ApiResponse.success("Message forwarded", null));
    }

    @GetMapping(value = "/chat/{chatId}/export", produces = MediaType.TEXT_PLAIN_VALUE)
    @Operation(summary = "Export chat messages to txt format")
    public ResponseEntity<String> exportChat(
            @PathVariable Long chatId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        String exportedText = messageService.exportChat(chatId, userId);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"chat_export_" + chatId + ".txt\"")
                .body(exportedText);
    }
    @GetMapping("/{id}/info")
    @Operation(summary = "Get read receipt info for a message")
    public ResponseEntity<ApiResponse<List<MessageInfoResponse>>> getMessageInfo(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getCurrentUserId(userDetails);
        List<MessageInfoResponse> info = messageService.getMessageInfo(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Message info retrieved", info));
    }

    @PostMapping("/broadcast")
    @Operation(summary = "Broadcast a message to multiple users")
    public ResponseEntity<ApiResponse<Void>> broadcastMessage(
            @Valid @RequestBody ChatRequest.SendMessage request,
            @RequestParam java.util.List<Long> userIds,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long senderId = getCurrentUserId(userDetails);
        messageService.broadcastMessage(request, userIds, senderId);
        return ResponseEntity.ok(ApiResponse.success("Message broadcasted", null));
    }

    private Long getCurrentUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
    }
}
