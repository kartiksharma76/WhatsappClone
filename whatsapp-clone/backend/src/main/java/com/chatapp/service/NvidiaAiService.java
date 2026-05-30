package com.chatapp.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class NvidiaAiService {

    @Value("${nvidia.api-key}")
    private String apiKey;

    @Value("${nvidia.model}")
    private String model;

    private static final String API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
    private final RestTemplate restTemplate = new RestTemplate();

    public String generateResponse(List<ChatMessage> chatHistory) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            // Build request body
            List<Map<String, String>> messages = new ArrayList<>();
            // System instruction
            String currentDateTime = java.time.ZonedDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy HH:mm:ss z"));
            messages.add(Map.of(
                "role", "system",
                "content", "You are Meta AI, a helpful, friendly, and smart AI assistant integrated into a WhatsApp clone. Keep your answers formatting clean, helpful, and user-friendly. Use emojis appropriately. The current date and time is: " + currentDateTime + "."
            ));

            for (ChatMessage msg : chatHistory) {
                messages.add(Map.of(
                    "role", msg.getRole(),
                    "content", msg.getContent()
                ));
            }

            Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", messages,
                "max_tokens", 1024,
                "temperature", 0.7
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(API_URL, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List choices = (List) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map choice = (Map) choices.get(0);
                    Map message = (Map) choice.get("message");
                    if (message != null) {
                        return (String) message.get("content");
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to generate response from NVIDIA NIM API", e);
        }
        return "I'm sorry, I encountered an error while processing your request. Please try again later.";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessage {
        private String role; // "user" or "assistant"
        private String content;
    }
}
