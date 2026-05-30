package com.chatapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

public class ChatRequest {

    @Data
    public static class CreatePrivateChat {
        @NotNull(message = "Recipient user ID is required")
        private Long recipientId;
    }

    @Data
    public static class CreateGroupChat {
        @NotBlank(message = "Group name is required")
        @Size(min = 2, max = 100, message = "Group name must be 2-100 characters")
        private String groupName;

        @Size(max = 500)
        private String groupDescription;

        @NotNull(message = "Participants list is required")
        @Size(min = 1, message = "At least 1 participant required")
        private List<Long> participantIds;
    }

    @Data
    public static class UpdateGroup {
        @Size(max = 100)
        private String groupName;

        @Size(max = 500)
        private String groupDescription;
    }

    @Data
    public static class AddParticipants {
        @NotNull
        private List<Long> userIds;
    }

    @Data
    public static class SendMessage {
        @NotNull(message = "Chat ID is required")
        private Long chatId;

        private String content;

        private String messageType = "TEXT";

        private Long replyToMessageId;
    }

    @Data
    public static class ReactToMessage {
        @NotNull
        private Long messageId;

        @NotBlank
        @Size(max = 10)
        private String emoji;
    }

    @Data
    public static class EditMessage {
        @NotNull
        private Long messageId;

        @NotBlank
        private String content;
    }
}
