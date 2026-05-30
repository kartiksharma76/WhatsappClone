package com.chatapp.dto.response;

import com.chatapp.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MessageResponse {
    private Long id;
    private Long chatId;
    private UserSummary sender;
    private String content;
    private Message.MessageType messageType;
    private Message.MessageStatus status;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String fileMimeType;
    private Integer mediaDuration;
    private String thumbnailUrl;
    private String linkPreviewTitle;
    private String linkPreviewDesc;
    private String linkPreviewImage;
    private MessageResponse replyTo;
    private Map<String, Long> reactions; // emoji -> count
    private boolean isStarred;
    private boolean isDeleted;
    private boolean isEdited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String fullName;
        private String profilePicture;
    }
}
