package com.chatapp.service;

import com.chatapp.dto.request.ChatRequest;
import com.chatapp.dto.response.MessageResponse;
import com.chatapp.entity.*;
import com.chatapp.exception.UnauthorizedException;
import com.chatapp.repository.*;
import com.chatapp.service.impl.MessageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock private MessageRepository messageRepository;
    @Mock private ChatRepository chatRepository;
    @Mock private UserRepository userRepository;
    @Mock private MessageReactionRepository reactionRepository;
    @Mock private MessageReceiptRepository receiptRepository;
    @Mock private UserChatRepository userChatRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private SimpMessagingTemplate messagingTemplate;

    @InjectMocks private MessageServiceImpl messageService;

    private User sender;
    private User recipient;
    private Chat chat;
    private Message message;

    @BeforeEach
    void setUp() {
        sender = User.builder().id(1L).fullName("Alice").email("alice@test.com").build();
        recipient = User.builder().id(2L).fullName("Bob").email("bob@test.com").build();

        chat = Chat.builder()
                .id(10L)
                .chatType(Chat.ChatType.PRIVATE)
                .participants(new HashSet<>(Set.of(sender, recipient)))
                .build();

        message = Message.builder()
                .id(100L)
                .chat(chat)
                .sender(sender)
                .content("Hello!")
                .messageType(Message.MessageType.TEXT)
                .status(Message.MessageStatus.SENT)
                .build();
    }

    @Test
    @DisplayName("Should send a text message and broadcast via WebSocket")
    void sendMessage_success() {
        ChatRequest.SendMessage request = new ChatRequest.SendMessage();
        request.setChatId(10L);
        request.setContent("Hello!");
        request.setMessageType("TEXT");

        when(chatRepository.findById(10L)).thenReturn(Optional.of(chat));
        when(chatRepository.isUserInChat(10L, 1L)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sender));
        when(messageRepository.save(any(Message.class))).thenReturn(message);
        when(reactionRepository.countReactionsByEmoji(anyLong())).thenReturn(List.of());

        MessageResponse response = messageService.sendMessage(request, 1L);

        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEqualTo("Hello!");
        assertThat(response.getSender().getId()).isEqualTo(1L);
        verify(messagingTemplate).convertAndSend(eq("/topic/chat/10"), any(MessageResponse.class));
        verify(userChatRepository).incrementUnreadCount(10L, 1L);
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when user not in chat")
    void sendMessage_userNotInChat_throwsUnauthorized() {
        ChatRequest.SendMessage request = new ChatRequest.SendMessage();
        request.setChatId(10L);
        request.setContent("Hello!");

        when(chatRepository.findById(10L)).thenReturn(Optional.of(chat));
        when(chatRepository.isUserInChat(10L, 99L)).thenReturn(false);

        assertThatThrownBy(() -> messageService.sendMessage(request, 99L))
                .isInstanceOf(UnauthorizedException.class);

        verify(messageRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when deleting another user's message for everyone")
    void deleteMessage_notOwner_throwsUnauthorized() {
        when(messageRepository.findById(100L)).thenReturn(Optional.of(message));

        // user 2 tries to delete user 1's message for everyone
        assertThatThrownBy(() -> messageService.deleteMessage(100L, 2L, true))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("only delete your own messages for everyone");
    }

    @Test
    @DisplayName("Should soft-delete message and notify chat")
    void deleteMessage_owner_success() {
        when(messageRepository.findById(100L)).thenReturn(Optional.of(message));
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        messageService.deleteMessage(100L, 1L, true);

        assertThat(message.isDeleted()).isTrue();
        verify(messagingTemplate).convertAndSend(eq("/topic/chat/10"), any(Object.class));
    }

    @Test
    @DisplayName("Should add user to deletedForUsers when deleting for me")
    void deleteMessage_forMe_success() {
        when(messageRepository.findById(100L)).thenReturn(Optional.of(message));
        when(userRepository.findById(2L)).thenReturn(Optional.of(recipient));
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        messageService.deleteMessage(100L, 2L, false);

        assertThat(message.getDeletedForUsers()).contains(recipient);
        assertThat(message.isDeleted()).isFalse();
    }

    @Test
    @DisplayName("Should mark all messages as seen and reset unread count")
    void markAsSeen_resetsUnreadCount() {
        messageService.markAsSeen(10L, 2L);

        verify(receiptRepository).markAllAsSeenInChat(eq(10L), eq(2L), any(java.time.LocalDateTime.class));
        verify(userChatRepository).resetUnreadCount(2L, 10L);
        verify(messagingTemplate).convertAndSend(eq("/topic/delivery/10"), any(Object.class));
    }
}
