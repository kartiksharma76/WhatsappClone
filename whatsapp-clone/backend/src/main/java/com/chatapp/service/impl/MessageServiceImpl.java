package com.chatapp.service.impl;

import com.chatapp.dto.request.ChatRequest;
import com.chatapp.dto.response.MessageInfoResponse;
import com.chatapp.dto.response.MessageResponse;
import com.chatapp.entity.*;
import com.chatapp.exception.BadRequestException;
import com.chatapp.exception.ResourceNotFoundException;
import com.chatapp.exception.UnauthorizedException;
import com.chatapp.repository.*;
import com.chatapp.service.FileStorageService;
import com.chatapp.service.MessageService;
import com.chatapp.service.LinkPreviewService;
import com.chatapp.service.NvidiaAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core messaging service with real-time WebSocket broadcasting.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final MessageReactionRepository reactionRepository;
    private final MessageReceiptRepository receiptRepository;
    private final UserChatRepository userChatRepository;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final NvidiaAiService nvidiaAiService;
    private final LinkPreviewService linkPreviewService;
    private final TransactionTemplate transactionTemplate;

    @Override
    public MessageResponse sendMessage(ChatRequest.SendMessage request, Long senderId) {
        Chat chat = getChatAndValidateAccess(request.getChatId(), senderId);
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", senderId));

        User otherUser = null;
        if (chat.getChatType() == Chat.ChatType.PRIVATE) {
            otherUser = chat.getParticipants().stream()
                    .filter(p -> !p.getId().equals(senderId))
                    .findFirst().orElse(null);
            
            if (otherUser != null) {
                Long recipientId = otherUser.getId();
                if (userRepository.isUserBlocked(recipientId, senderId)) {
                    throw new BadRequestException("You have been blocked by this user");
                }
                if (userRepository.isUserBlocked(senderId, recipientId)) {
                    throw new BadRequestException("You have blocked this user. Unblock to send messages.");
                }
            }
        }

        Message message = Message.builder()
                .chat(chat)
                .sender(sender)
                .content(request.getContent())
                .messageType(Message.MessageType.valueOf(
                        request.getMessageType() != null ? request.getMessageType() : "TEXT"))
                .status(Message.MessageStatus.SENT)
                .build();

        if (request.getReplyToMessageId() != null) {
            Message replyTo = messageRepository.findById(request.getReplyToMessageId())
                    .orElseThrow(() -> new ResourceNotFoundException("Message", request.getReplyToMessageId()));
            message.setReplyTo(replyTo);
        }

        if (message.getMessageType() == Message.MessageType.TEXT) {
            String url = linkPreviewService.extractUrl(message.getContent());
            if (url != null) {
                LinkPreviewService.LinkPreview preview = linkPreviewService.generatePreview(url);
                if (preview != null) {
                    message.setLinkPreviewTitle(preview.title());
                    message.setLinkPreviewDesc(preview.description());
                    message.setLinkPreviewImage(preview.imageUrl());
                }
            }
        }

        message = messageRepository.save(message);

        // Update last message and timestamps
        chat.setLastMessage(message);
        chatRepository.save(chat);

        // Increment unread counts for other participants
        userChatRepository.incrementUnreadCount(chat.getId(), senderId);

        // Create delivery receipts for all participants
        createReceipts(message, chat, senderId);

        MessageResponse response = mapToResponse(message, senderId);

        // Broadcast via WebSocket to the specific chat room
        messagingTemplate.convertAndSend("/topic/chat/" + chat.getId(), response);

        // Also broadcast to each participant's global topic for sidebar updates
        chat.getParticipants().forEach(participant -> {
            messagingTemplate.convertAndSend("/topic/user/" + participant.getId() + "/messages", response);
        });

        log.debug("Message sent in chat {}", chat.getId());

        if (otherUser != null && com.chatapp.config.AiStartupConfig.AI_EMAIL.equals(otherUser.getEmail())) {
            processAiResponse(chat, senderId, otherUser);
        }

        return response;
    }

    @Override
    public MessageResponse sendFileMessage(Long chatId, MultipartFile file, Long senderId) {
        Chat chat = getChatAndValidateAccess(chatId, senderId);
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", senderId));

        if (chat.getChatType() == Chat.ChatType.PRIVATE) {
            Long recipientId = chat.getParticipants().stream()
                    .filter(p -> !p.getId().equals(senderId))
                    .map(User::getId)
                    .findFirst().orElse(null);
            
            if (recipientId != null) {
                if (userRepository.isUserBlocked(recipientId, senderId)) {
                    throw new BadRequestException("You have been blocked by this user");
                }
                if (userRepository.isUserBlocked(senderId, recipientId)) {
                    throw new BadRequestException("You have blocked this user. Unblock to send messages.");
                }
            }
        }

        String fileUrl = fileStorageService.storeFile(file);
        Message.MessageType messageType = determineMessageType(file.getContentType());

        Message message = Message.builder()
                .chat(chat)
                .sender(sender)
                .messageType(messageType)
                .fileUrl(fileUrl)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .fileMimeType(file.getContentType())
                .status(Message.MessageStatus.SENT)
                .build();

        message = messageRepository.save(message);
        chat.setLastMessage(message);
        chatRepository.save(chat);
        userChatRepository.incrementUnreadCount(chat.getId(), senderId);
        createReceipts(message, chat, senderId);

        MessageResponse response = mapToResponse(message, senderId);
        
        // Broadcast via WebSocket to the specific chat room
        messagingTemplate.convertAndSend("/topic/chat/" + chat.getId(), response);

        // Also broadcast to each participant's global topic for sidebar updates
        chat.getParticipants().forEach(participant -> {
            messagingTemplate.convertAndSend("/topic/user/" + participant.getId() + "/messages", response);
        });

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> getChatMessages(Long chatId, Long userId, Pageable pageable) {
        getChatAndValidateAccess(chatId, userId);
        return messageRepository.findChatMessages(chatId, userId, pageable)
                .map(m -> mapToResponse(m, userId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> getMediaMessages(Long chatId, Long userId, Pageable pageable) {
        getChatAndValidateAccess(chatId, userId);
        return messageRepository.findMediaMessages(chatId, userId, pageable)
                .map(m -> mapToResponse(m, userId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> searchMessages(Long chatId, String query, Long userId, Pageable pageable) {
        getChatAndValidateAccess(chatId, userId);
        return messageRepository.searchMessages(chatId, query, userId, pageable)
                .map(m -> mapToResponse(m, userId));
    }

    @Override
    public MessageResponse editMessage(ChatRequest.EditMessage request, Long userId) {
        Message message = messageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new ResourceNotFoundException("Message", request.getMessageId()));

        if (!message.getSender().getId().equals(userId)) {
            throw new UnauthorizedException("You can only edit your own messages");
        }
        if (message.isDeleted()) {
            throw new BadRequestException("Cannot edit deleted message");
        }

        message.setContent(request.getContent());
        message.setEdited(true);
        message.setEditedAt(LocalDateTime.now());
        message = messageRepository.save(message);

        MessageResponse response = mapToResponse(message, userId);
        messagingTemplate.convertAndSend("/topic/chat/" + message.getChat().getId(), response);

        return response;
    }

    @Override
    public void deleteMessage(Long messageId, Long userId, boolean deleteForEveryone) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", messageId));

        if (deleteForEveryone) {
            if (!message.getSender().getId().equals(userId)) {
                throw new UnauthorizedException("You can only delete your own messages for everyone");
            }
            message.setDeleted(true);
            message.setDeletedAt(LocalDateTime.now());
            message.setContent(null);
            message.setFileUrl(null);
            message.setFileName(null);
            message.setFileSize(null);
            message.setFileMimeType(null);
            message.setThumbnailUrl(null);
            message.setMediaDuration(null);
            messageRepository.save(message);

            // Notify chat members
            messagingTemplate.convertAndSend(
                "/topic/chat/" + message.getChat().getId(),
                Map.of("type", "MESSAGE_DELETED", "messageId", messageId)
            );
        } else {
            // Delete for me
            User user = userRepository.findById(userId).orElseThrow();
            message.getDeletedForUsers().add(user);
            messageRepository.save(message);
        }
    }

    @Override
    public MessageResponse reactToMessage(ChatRequest.ReactToMessage request, Long userId) {
        Message message = messageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new ResourceNotFoundException("Message", request.getMessageId()));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Remove existing reaction if any
        reactionRepository.findByMessageIdAndUserId(request.getMessageId(), userId)
                .ifPresent(reactionRepository::delete);

        // Add new reaction
        MessageReaction reaction = MessageReaction.builder()
                .message(message)
                .user(user)
                .emoji(request.getEmoji())
                .build();
        reactionRepository.save(reaction);

        MessageResponse response = mapToResponse(message, userId);
        messagingTemplate.convertAndSend("/topic/chat/" + message.getChat().getId(),
                Map.of("type", "REACTION", "messageId", message.getId(),
                       "emoji", request.getEmoji(), "userId", userId));
        return response;
    }

    @Override
    public void removeReaction(Long messageId, Long userId) {
        reactionRepository.deleteByMessageIdAndUserId(messageId, userId);
    }

    @Override
    public void markAsDelivered(Long messageId, Long userId) {
        messageRepository.findById(messageId).ifPresent(message -> {
            receiptRepository.findByMessageIdAndUserId(messageId, userId).ifPresent(receipt -> {
                receipt.setStatus(Message.MessageStatus.DELIVERED);
                receipt.setDeliveredAt(LocalDateTime.now());
                receiptRepository.save(receipt);
            });
        });
    }

    @Override
    public void markAsSeen(Long chatId, Long userId) {
        userChatRepository.resetUnreadCount(userId, chatId);

        User user = userRepository.findById(userId).orElseThrow();
        if (user.isReadReceiptsEnabled()) {
            receiptRepository.markAllAsSeenInChat(chatId, userId, LocalDateTime.now());

            // Notify sender(s) that messages were seen
            messagingTemplate.convertAndSend(
                "/topic/delivery/" + chatId,
                Map.of("type", "SEEN", "chatId", chatId, "userId", userId,
                       "timestamp", LocalDateTime.now().toString())
            );
        }
    }

    @Override
    public void starMessage(Long messageId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", messageId));
        
        // Ensure user is in the chat
        getChatAndValidateAccess(message.getChat().getId(), userId);
        
        user.getStarredMessages().add(message);
        userRepository.save(user);
    }

    @Override
    public void unstarMessage(Long messageId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", messageId));
        
        user.getStarredMessages().remove(message);
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> getStarredMessages(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        
        // In a real app we'd write a custom repository query with pagination.
        // For simplicity, we fetch all, sort by createdAt desc, and manual paginate.
        List<MessageResponse> allStarred = user.getStarredMessages().stream()
                .filter(m -> !m.isDeleted())
                .sorted(Comparator.comparing(Message::getCreatedAt).reversed())
                .map(m -> mapToResponse(m, userId))
                .collect(Collectors.toList());
                
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allStarred.size());
        
        if (start > allStarred.size()) {
            return new org.springframework.data.domain.PageImpl<>(Collections.emptyList(), pageable, allStarred.size());
        }
        
        return new org.springframework.data.domain.PageImpl<>(allStarred.subList(start, end), pageable, allStarred.size());
    }

    @Override
    public void forwardMessage(Long messageId, List<Long> chatIds, Long userId) {
        Message originalMessage = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", messageId));
        
        if (originalMessage.isDeleted()) {
            throw new BadRequestException("Cannot forward a deleted message");
        }

        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        for (Long chatId : chatIds) {
            Chat chat = getChatAndValidateAccess(chatId, userId);
            
            // Check block status for private chats
            if (chat.getChatType() == Chat.ChatType.PRIVATE) {
                Long recipientId = chat.getParticipants().stream()
                        .filter(p -> !p.getId().equals(userId))
                        .map(User::getId)
                        .findFirst().orElse(null);
                if (recipientId != null && userRepository.isUserBlocked(recipientId, userId)) {
                    continue; // Skip if blocked
                }
            }

            Message forwarded = Message.builder()
                    .chat(chat)
                    .sender(sender)
                    .content(originalMessage.getContent())
                    .messageType(originalMessage.getMessageType())
                    .fileUrl(originalMessage.getFileUrl())
                    .fileName(originalMessage.getFileName())
                    .fileSize(originalMessage.getFileSize())
                    .fileMimeType(originalMessage.getFileMimeType())
                    .mediaDuration(originalMessage.getMediaDuration())
                    .thumbnailUrl(originalMessage.getThumbnailUrl())
                    .status(Message.MessageStatus.SENT)
                    .build();

            forwarded = messageRepository.save(forwarded);
            
            chat.setLastMessage(forwarded);
            chatRepository.save(chat);
            userChatRepository.incrementUnreadCount(chat.getId(), userId);
            createReceipts(forwarded, chat, userId);
            
            MessageResponse response = mapToResponse(forwarded, userId);
            messagingTemplate.convertAndSend("/topic/chat/" + chat.getId(), response);
            
            for (User participant : chat.getParticipants()) {
                messagingTemplate.convertAndSend("/topic/user/" + participant.getId() + "/messages", response);
            }
        }
    }

    @Override
    @Transactional
    public void broadcastMessage(ChatRequest.SendMessage request, List<Long> targetUserIds, Long senderId) {
        User sender = userRepository.findById(senderId).orElseThrow();
        for (Long targetUserId : targetUserIds) {
            if (targetUserId.equals(senderId)) continue;
            User target = userRepository.findById(targetUserId).orElse(null);
            if (target == null) continue;

            // Find or create private chat
            Chat chat = chatRepository.findPrivateChatBetweenUsers(senderId, targetUserId)
                    .orElseGet(() -> {
                        Chat newChat = Chat.builder()
                                .chatType(Chat.ChatType.PRIVATE)
                                .createdBy(sender)
                                .participants(new java.util.HashSet<>(java.util.Arrays.asList(sender, target)))
                                .build();
                        newChat = chatRepository.save(newChat);
                        userChatRepository.save(UserChat.builder().user(sender).chat(newChat).build());
                        userChatRepository.save(UserChat.builder().user(target).chat(newChat).build());
                        return newChat;
                    });

            ChatRequest.SendMessage sendRequest = new ChatRequest.SendMessage();
            sendRequest.setChatId(chat.getId());
            sendRequest.setContent(request.getContent());
            sendMessage(sendRequest, senderId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String exportChat(Long chatId, Long userId) {
        Chat chat = getChatAndValidateAccess(chatId, userId);
        List<Message> messages = messageRepository.findAllByChatId(chatId);

        StringBuilder sb = new StringBuilder();
        sb.append("Chat Export: ").append(chat.getChatType() == Chat.ChatType.GROUP ? chat.getGroupName() : "Private Chat").append("\n");
        sb.append("Exported on: ").append(LocalDateTime.now()).append("\n\n");

        for (Message m : messages) {
            // Check if message is deleted for this user
            boolean deletedForMe = m.getDeletedForUsers().stream().anyMatch(u -> u.getId().equals(userId));
            if (deletedForMe) continue;

            String time = m.getCreatedAt().toString().substring(0, 16).replace("T", " ");
            String senderName = m.getSender().getFullName();
            String content = m.isDeleted() ? "<This message was deleted>" :
                             (m.getMessageType() == Message.MessageType.TEXT ? m.getContent() : "<" + m.getMessageType() + " Attachment>");

            sb.append("[").append(time).append("] ").append(senderName).append(": ").append(content).append("\n");
        }
        return sb.toString();
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private Chat getChatAndValidateAccess(Long chatId, Long userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", chatId));
        if (!chatRepository.isUserInChat(chatId, userId)) {
            throw new UnauthorizedException("You are not a member of this chat");
        }
        return chat;
    }

    private void createReceipts(Message message, Chat chat, Long senderId) {
        chat.getParticipants().stream()
                .filter(p -> !p.getId().equals(senderId))
                .forEach(participant -> {
                    MessageReceipt receipt = MessageReceipt.builder()
                            .message(message)
                            .user(participant)
                            .status(Message.MessageStatus.SENT)
                            .build();
                    receiptRepository.save(receipt);
                });
    }

    private Message.MessageType determineMessageType(String contentType) {
        if (contentType == null) return Message.MessageType.FILE;
        if (contentType.startsWith("image/")) return Message.MessageType.IMAGE;
        if (contentType.startsWith("video/")) return Message.MessageType.VIDEO;
        if (contentType.startsWith("audio/")) return Message.MessageType.AUDIO;
        return Message.MessageType.FILE;
    }

    private MessageResponse mapToResponse(Message message, Long currentUserId) {
        // Get reaction counts
        Map<String, Long> reactionCounts = new HashMap<>();
        reactionRepository.countReactionsByEmoji(message.getId()).forEach(row -> {
            reactionCounts.put((String) row[0], (Long) row[1]);
        });

        boolean isStarred = false;
        if (currentUserId != null) {
            isStarred = userRepository.hasStarredMessage(currentUserId, message.getId());
        }

        return MessageResponse.builder()
                .id(message.getId())
                .chatId(message.getChat().getId())
                .sender(MessageResponse.UserSummary.builder()
                        .id(message.getSender().getId())
                        .fullName(message.getSender().getFullName())
                        .profilePicture(message.getSender().getProfilePicture())
                        .build())
                .content(message.isDeleted() ? null : message.getContent())
                .messageType(message.getMessageType())
                .status(message.getStatus())
                .fileUrl(message.getFileUrl())
                .fileName(message.getFileName())
                .fileSize(message.getFileSize())
                .fileMimeType(message.getFileMimeType())
                .mediaDuration(message.getMediaDuration())
                .thumbnailUrl(message.getThumbnailUrl())
                .linkPreviewTitle(message.getLinkPreviewTitle())
                .linkPreviewDesc(message.getLinkPreviewDesc())
                .linkPreviewImage(message.getLinkPreviewImage())
                .replyTo(message.getReplyTo() != null ? mapToResponse(message.getReplyTo(), currentUserId) : null)
                .reactions(reactionCounts)
                .isStarred(isStarred)
                .isDeleted(message.isDeleted())
                .isEdited(message.isEdited())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .build();
    }
    @Override
    public List<MessageInfoResponse> getMessageInfo(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", messageId));

        if (!message.getSender().getId().equals(userId)) {
            throw new UnauthorizedException("Only the sender can view message info");
        }

        return message.getReceipts().stream()
                .map(d -> MessageInfoResponse.builder()
                        .userId(d.getUser().getId())
                        .userName(d.getUser().getFullName())
                        .userAvatar(d.getUser().getProfilePicture())
                        .deliveredAt(d.getDeliveredAt())
                        .seenAt(d.getSeenAt())
                        .build())
                .collect(Collectors.toList());
    }

    private void processAiResponse(Chat chat, Long userSenderId, User aiUser) {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                // 1. Send "Typing" indicator from Meta AI
                messagingTemplate.convertAndSend(
                    "/topic/typing/" + chat.getId(),
                    Map.of("chatId", chat.getId(), "userId", aiUser.getId(), "userName", aiUser.getFullName(), "typing", true)
                );

                // Simulate slight thinking delay
                Thread.sleep(1000);

                // 2. Fetch context (last 15 messages) in a transaction
                List<NvidiaAiService.ChatMessage> chatHistory = transactionTemplate.execute(status -> {
                    List<Message> messageEntities = messageRepository.findAllByChatId(chat.getId());
                    messageEntities.sort(Comparator.comparing(Message::getCreatedAt));
                    int contextSize = Math.min(15, messageEntities.size());
                    List<Message> contextMessages = messageEntities.subList(messageEntities.size() - contextSize, messageEntities.size());

                    List<NvidiaAiService.ChatMessage> history = new ArrayList<>();
                    for (Message m : contextMessages) {
                        if (m.isDeleted() || m.getContent() == null) continue;
                        String role = m.getSender().getId().equals(aiUser.getId()) ? "assistant" : "user";
                        history.add(NvidiaAiService.ChatMessage.builder()
                                .role(role)
                                .content(m.getContent())
                                .build());
                    }
                    return history;
                });

                // 3. Request completion (outside transaction to avoid holding DB connections open during network calls)
                String aiText = nvidiaAiService.generateResponse(chatHistory);

                // 4. Save message and update chat in a transaction
                MessageResponse response = transactionTemplate.execute(status -> {
                    // Re-fetch entities within the transaction scope
                    Chat txChat = chatRepository.findById(chat.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("Chat", chat.getId()));
                    User txAiUser = userRepository.findById(aiUser.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("User", aiUser.getId()));

                    Message aiMessage = Message.builder()
                            .chat(txChat)
                            .sender(txAiUser)
                            .content(aiText)
                            .messageType(Message.MessageType.TEXT)
                            .status(Message.MessageStatus.SENT)
                            .build();

                    aiMessage = messageRepository.save(aiMessage);

                    // 5. Update Chat
                    txChat.setLastMessage(aiMessage);
                    chatRepository.save(txChat);

                    // Increment unread count for user in user_chats
                    userChatRepository.incrementUnreadCount(txChat.getId(), txAiUser.getId());
                    createReceipts(aiMessage, txChat, txAiUser.getId());

                    return mapToResponse(aiMessage, userSenderId);
                });

                // 6. Stop Typing
                messagingTemplate.convertAndSend(
                    "/topic/typing/" + chat.getId(),
                    Map.of("chatId", chat.getId(), "userId", aiUser.getId(), "userName", aiUser.getFullName(), "typing", false)
                );

                // 7. Broadcast
                messagingTemplate.convertAndSend("/topic/chat/" + chat.getId(), response);
                messagingTemplate.convertAndSend("/topic/user/" + userSenderId + "/messages", response);

            } catch (Exception e) {
                log.error("Error processing AI response", e);
                try {
                    messagingTemplate.convertAndSend(
                        "/topic/typing/" + chat.getId(),
                        Map.of("chatId", chat.getId(), "userId", aiUser.getId(), "userName", aiUser.getFullName(), "typing", false)
                    );
                } catch (Exception ignored) {}
            }
        });
    }
}
