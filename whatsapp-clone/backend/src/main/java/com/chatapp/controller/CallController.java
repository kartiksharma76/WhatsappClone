package com.chatapp.controller;

import com.chatapp.dto.request.CallSignalRequest;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class CallController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/call/signal")
    public void handleCallSignal(@Payload CallSignalRequest request) {
        // Broadcast the WebRTC signal to the specific user's signaling topic
        messagingTemplate.convertAndSend("/topic/call/" + request.getTargetUserId(), request);
    }
}
