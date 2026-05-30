package com.chatapp.service.impl;

import com.chatapp.dto.request.ChatRequest;
import com.chatapp.dto.response.ChatResponse;
import com.chatapp.dto.response.MessageResponse;
import com.chatapp.dto.response.UserResponse;
import com.chatapp.entity.*;
import com.chatapp.exception.BadRequestException;
import com.chatapp.exception.ResourceNotFoundException;
import com.chatapp.exception.UnauthorizedException;
import com.chatapp.repository.*;
import com.chatapp.service.ChatService;
import com.chatapp.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChatServiceImpl implements ChatService {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final UserChatRepository userChatRepository;
    private final MessageRepository messageRepository;
    private final FileStorageService fileStorageService;

    @Override
    public ChatResponse createPrivateChat(ChatRequest.CreatePrivateChat request, Long userId) {
        if (userId.equals(request.getRecipientId())) {
            throw new BadRequestException("Cannot create chat with yourself");
        }

        // Check if private chat already exists
        Optional<Chat> existing = chatRepository.findPrivateChatBetweenUsers(userId, request.getRecipientId());
        if (existing.isPresent()) {
            return mapToResponse(existing.get(), userId);
        }

        User currentUser = getUser(userId);
        User recipient = getUser(request.getRecipientId());

        // Check if blocked
        if (userRepository.isUserBlocked(request.getRecipientId(), userId)) {
            throw new BadRequestException("You are blocked by this user");
        }

        Chat chat = Chat.builder()
                .chatType(Chat.ChatType.PRIVATE)
                .createdBy(currentUser)
                .participants(new HashSet<>(Set.of(currentUser, recipient)))
                .build();

        chat = chatRepository.save(chat);
        createUserChatRecords(chat, Set.of(currentUser, recipient));

        log.info("Private chat created between users {} and {}", userId, request.getRecipientId());
        return mapToResponse(chat, userId);
    }

    @Override
    public ChatResponse createGroupChat(ChatRequest.CreateGroupChat request, Long userId) {
        User creator = getUser(userId);

        Set<User> participants = new HashSet<>();
        participants.add(creator);
        request.getParticipantIds().forEach(id -> participants.add(getUser(id)));

        Chat chat = Chat.builder()
                .chatType(Chat.ChatType.GROUP)
                .groupName(request.getGroupName())
                .groupDescription(request.getGroupDescription())
                .createdBy(creator)
                .participants(participants)
                .admins(new HashSet<>(Set.of(creator)))
                .build();

        chat = chatRepository.save(chat);
        createUserChatRecords(chat, participants);

        log.info("Group chat '{}' created by user {}", request.getGroupName(), userId);
        return mapToResponse(chat, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public ChatResponse getChatById(Long chatId, Long userId) {
        if (!chatRepository.isUserInChat(chatId, userId)) {
            throw new UnauthorizedException("You are not a member of this chat");
        }
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", chatId));
        return mapToResponse(chat, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatResponse> getUserChats(Long userId, Pageable pageable) {
        return chatRepository.findUserChats(userId, pageable)
                .map(chat -> mapToResponse(chat, userId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatResponse> searchChats(Long userId, String query) {
        return chatRepository.searchUserChats(userId, query).stream()
                .map(chat -> mapToResponse(chat, userId))
                .collect(Collectors.toList());
    }

    @Override
    public ChatResponse updateGroup(Long chatId, ChatRequest.UpdateGroup request, Long userId) {
        Chat chat = getGroupChatAndValidateAdmin(chatId, userId);

        if (request.getGroupName() != null) chat.setGroupName(request.getGroupName());
        if (request.getGroupDescription() != null) chat.setGroupDescription(request.getGroupDescription());

        chat = chatRepository.save(chat);
        return mapToResponse(chat, userId);
    }

    @Override
    public ChatResponse updateGroupIcon(Long chatId, MultipartFile icon, Long userId) {
        Chat chat = getGroupChatAndValidateAdmin(chatId, userId);
        String iconUrl = fileStorageService.storeFile(icon);
        chat.setGroupIcon(iconUrl);
        chat = chatRepository.save(chat);
        return mapToResponse(chat, userId);
    }

    @Override
    public void addParticipants(Long chatId, ChatRequest.AddParticipants request, Long adminId) {
        Chat chat = getGroupChatAndValidateAdmin(chatId, adminId);

        request.getUserIds().forEach(userId -> {
            User user = getUser(userId);
            chat.getParticipants().add(user);
            UserChat uc = UserChat.builder().user(user).chat(chat).build();
            userChatRepository.save(uc);
        });

        chatRepository.save(chat);
    }

    @Override
    public void removeParticipant(Long chatId, Long participantId, Long adminId) {
        Chat chat = getGroupChatAndValidateAdmin(chatId, adminId);
        User participant = getUser(participantId);
        chat.getParticipants().remove(participant);
        chat.getAdmins().remove(participant);
        chatRepository.save(chat);
        userChatRepository.findByUserIdAndChatId(participantId, chatId)
                .ifPresent(userChatRepository::delete);
    }

    @Override
    public void makeAdmin(Long chatId, Long userId, Long adminId) {
        Chat chat = getGroupChatAndValidateAdmin(chatId, adminId);
        User user = getUser(userId);
        if (!chat.getParticipants().contains(user)) {
            throw new BadRequestException("User is not a participant of this group");
        }
        chat.getAdmins().add(user);
        chatRepository.save(chat);
    }

    @Override
    public void removeAdmin(Long chatId, Long userId, Long adminId) {
        Chat chat = getGroupChatAndValidateAdmin(chatId, adminId);
        if (chat.getCreatedBy().getId().equals(userId)) {
            throw new BadRequestException("Cannot remove group creator from admins");
        }
        User user = getUser(userId);
        chat.getAdmins().remove(user);
        chatRepository.save(chat);
    }

    @Override
    public void leaveGroup(Long chatId, Long userId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", chatId));
        if (chat.getChatType() != Chat.ChatType.GROUP) {
            throw new BadRequestException("Cannot leave a private chat");
        }
        User user = getUser(userId);
        chat.getParticipants().remove(user);
        chat.getAdmins().remove(user);
        chatRepository.save(chat);
        userChatRepository.findByUserIdAndChatId(userId, chatId)
                .ifPresent(userChatRepository::delete);
    }

    @Override
    public void deleteChat(Long chatId, Long userId) {
        if (!chatRepository.isUserInChat(chatId, userId)) {
            throw new UnauthorizedException("You are not a member of this chat");
        }
        userChatRepository.findByUserIdAndChatId(userId, chatId)
                .ifPresent(userChatRepository::delete);
    }

    @Override
    @Transactional
    public void clearChat(Long chatId, Long userId) {
        if (!chatRepository.isUserInChat(chatId, userId)) {
            throw new UnauthorizedException("You are not a member of this chat");
        }
        messageRepository.clearChatForUser(chatId, userId);
    }

    @Override
    public void pinChat(Long chatId, Long userId, boolean pin) {
        UserChat userChat = getUserChat(chatId, userId);
        userChat.setPinned(pin);
        userChatRepository.save(userChat);
    }

    @Override
    public void archiveChat(Long chatId, Long userId, boolean archive) {
        UserChat userChat = getUserChat(chatId, userId);
        userChat.setArchived(archive);
        userChatRepository.save(userChat);
    }

    @Override
    public void muteChat(Long chatId, Long userId, boolean mute) {
        UserChat userChat = getUserChat(chatId, userId);
        userChat.setMuted(mute);
        userChatRepository.save(userChat);
    }

    @Override
    public void setDisappearingTimer(Long chatId, Long userId, Integer timerHours) {
        if (!chatRepository.isUserInChat(chatId, userId)) {
            throw new UnauthorizedException("You are not a member of this chat");
        }
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", chatId));
        chat.setDisappearingTimer(timerHours);
        chatRepository.save(chat);
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    private Chat getGroupChatAndValidateAdmin(Long chatId, Long adminId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", chatId));
        if (chat.getChatType() != Chat.ChatType.GROUP) {
            throw new BadRequestException("This action is only for group chats");
        }
        boolean isAdmin = chat.getAdmins().stream().anyMatch(a -> a.getId().equals(adminId));
        if (!isAdmin) {
            throw new UnauthorizedException("Only group admins can perform this action");
        }
        return chat;
    }

    private UserChat getUserChat(Long chatId, Long userId) {
        return userChatRepository.findByUserIdAndChatId(userId, chatId)
                .orElseThrow(() -> new ResourceNotFoundException("User chat settings not found"));
    }

    private void createUserChatRecords(Chat chat, Set<User> participants) {
        participants.forEach(user -> {
            UserChat userChat = UserChat.builder().user(user).chat(chat).build();
            userChatRepository.save(userChat);
        });
    }

    private ChatResponse mapToResponse(Chat chat, Long currentUserId) {
        UserChat userChat = userChatRepository
                .findByUserIdAndChatId(currentUserId, chat.getId())
                .orElse(UserChat.builder().build());

        // For private chats, get the other user's info
        String name = chat.getGroupName();
        String icon = chat.getGroupIcon();
        String about = chat.getGroupDescription();
        String status = null;
        java.time.LocalDateTime lastSeen = null;
        boolean isBlockedByMe = false;

        if (chat.getChatType() == Chat.ChatType.PRIVATE) {
            User otherUser = chat.getParticipants().stream()
                    .filter(p -> !p.getId().equals(currentUserId))
                    .findFirst().orElse(null);
            if (otherUser != null) {
                name = otherUser.getFullName();
                icon = otherUser.getProfilePicture();
                about = otherUser.getAbout();
                status = otherUser.getStatus().name();
                lastSeen = otherUser.getLastSeen();
                isBlockedByMe = userRepository.isUserBlocked(currentUserId, otherUser.getId());
            }
        }

        return ChatResponse.builder()
                .id(chat.getId())
                .chatType(chat.getChatType())
                .name(name)
                .icon(icon)
                .about(about)
                .status(status)
                .lastSeen(lastSeen)
                .isBlockedByMe(isBlockedByMe)
                .lastMessage(chat.getLastMessage() != null ? mapMessage(chat.getLastMessage()) : null)
                .unreadCount(userChat.getUnreadCount())
                .isPinned(userChat.isPinned())
                .isArchived(userChat.isArchived())
                .isMuted(userChat.isMuted())
                .disappearingTimer(chat.getDisappearingTimer())
                .participants(chat.getParticipants().stream().map(this::mapUser).collect(Collectors.toList()))
                .admins(chat.getAdmins().stream().map(this::mapUser).collect(Collectors.toList()))
                .createdAt(chat.getCreatedAt())
                .build();
    }

    private UserResponse mapUser(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .about(user.getAbout())
                .profilePicture(user.getProfilePicture())
                .status(user.getStatus())
                .lastSeen(user.getLastSeen())
                .build();
    }

    private MessageResponse mapMessage(Message msg) {
        return MessageResponse.builder()
                .id(msg.getId())
                .chatId(msg.getChat().getId())
                .content(msg.isDeleted() ? null : msg.getContent())
                .messageType(msg.getMessageType())
                .status(msg.getStatus())
                .isDeleted(msg.isDeleted())
                .sender(MessageResponse.UserSummary.builder()
                        .id(msg.getSender().getId())
                        .fullName(msg.getSender().getFullName())
                        .profilePicture(msg.getSender().getProfilePicture())
                        .build())
                .createdAt(msg.getCreatedAt())
                .build();
    }
    @Override
    public String generateInviteToken(Long chatId, Long adminId) {
        Chat chat = getGroupChatAndValidateAdmin(chatId, adminId);
        String token = UUID.randomUUID().toString();
        chat.setInviteToken(token);
        chatRepository.save(chat);
        return token;
    }

    @Override
    public ChatResponse joinWithInviteToken(String token, Long userId) {
        Chat chat = chatRepository.findByInviteToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found with invite token: " + token));
        
        User user = userRepository.findById(userId).orElseThrow();
        
        if (chat.getParticipants().contains(user)) {
            throw new BadRequestException("User is already in the chat");
        }

        chat.getParticipants().add(user);
        chatRepository.save(chat);

        UserChat userChat = UserChat.builder()
                .user(user)
                .chat(chat)
                .build();
        userChatRepository.save(userChat);

        return mapToResponse(chat, userId);
    }

    @Override
    public ChatResponse getOrCreateAiChat(Long userId) {
        User aiUser = userRepository.findByEmail(com.chatapp.config.AiStartupConfig.AI_EMAIL)
                .orElseThrow(() -> new ResourceNotFoundException("Meta AI user not found"));

        Optional<Chat> existing = chatRepository.findPrivateChatBetweenUsers(userId, aiUser.getId());
        if (existing.isPresent()) {
            return mapToResponse(existing.get(), userId);
        }

        User currentUser = getUser(userId);

        Chat chat = Chat.builder()
                .chatType(Chat.ChatType.PRIVATE)
                .createdBy(currentUser)
                .participants(new HashSet<>(Set.of(currentUser, aiUser)))
                .build();

        chat = chatRepository.save(chat);
        createUserChatRecords(chat, Set.of(currentUser, aiUser));

        log.info("Private chat created between user {} and Meta AI", userId);
        return mapToResponse(chat, userId);
    }
}
