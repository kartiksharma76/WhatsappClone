package com.chatapp.dto.request;

import lombok.Data;

@Data
public class CallSignalRequest {
    private Long callerId;
    private Long targetUserId;
    private String type; // "OFFER", "ANSWER", "ICE_CANDIDATE", "END_CALL"
    private Object payload; // SDP string or ICE candidate object
    private boolean isVideo;
    private String callerName;
    private String callerAvatar;
}
