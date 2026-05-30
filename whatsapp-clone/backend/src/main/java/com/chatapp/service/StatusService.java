package com.chatapp.service;

import com.chatapp.dto.response.StatusResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface StatusService {
    StatusResponse createStatus(String text, MultipartFile file, Long userId);
    List<StatusResponse> getActiveStatuses(Long userId);
    void markStatusAsViewed(Long statusId, Long userId);
    void deleteStatus(Long statusId, Long userId);
}
