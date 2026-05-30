package com.chatapp.service;

import com.chatapp.dto.request.AuthRequest;
import com.chatapp.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(AuthRequest.Register request);
    AuthResponse login(AuthRequest.Login request);
    AuthResponse refreshToken(String refreshToken);
    void changePassword(Long userId, AuthRequest.ChangePassword request);
    void logout(Long userId);
}
