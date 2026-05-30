package com.chatapp.service;

import com.chatapp.dto.request.AuthRequest;
import com.chatapp.dto.response.AuthResponse;
import com.chatapp.entity.User;
import com.chatapp.exception.BadRequestException;
import com.chatapp.repository.UserRepository;
import com.chatapp.security.JwtUtil;
import com.chatapp.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthServiceImpl covering registration, login, and edge cases.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserDetailsService userDetailsService;

    @InjectMocks private AuthServiceImpl authService;

    private AuthRequest.Register registerRequest;
    private AuthRequest.Login loginRequest;
    private User mockUser;
    private UserDetails mockUserDetails;

    @BeforeEach
    void setUp() {
        registerRequest = new AuthRequest.Register();
        registerRequest.setFullName("John Doe");
        registerRequest.setEmail("john@example.com");
        registerRequest.setPhone("+1234567890");
        registerRequest.setPassword("password123");

        loginRequest = new AuthRequest.Login();
        loginRequest.setEmail("john@example.com");
        loginRequest.setPassword("password123");

        mockUser = User.builder()
                .id(1L)
                .fullName("John Doe")
                .email("john@example.com")
                .phone("+1234567890")
                .password("encoded_password")
                .role(User.Role.USER)
                .status(User.UserStatus.OFFLINE)
                .build();

        mockUserDetails = org.springframework.security.core.userdetails.User.builder()
                .username("john@example.com")
                .password("encoded_password")
                .authorities("ROLE_USER")
                .build();
    }

    // ─── Registration Tests ─────────────────────────────────────────────────

    @Test
    @DisplayName("Should register a new user successfully")
    void register_success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(userDetailsService.loadUserByUsername(anyString())).thenReturn(mockUserDetails);
        when(jwtUtil.generateToken(any())).thenReturn("access_token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh_token");
        when(jwtUtil.getExpirationTime()).thenReturn(86400000L);

        AuthResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("access_token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh_token");
        assertThat(response.getUser().getEmail()).isEqualTo("john@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw BadRequestException when email is already taken")
    void register_emailAlreadyExists_throwsBadRequest() {
        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Email already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw BadRequestException when phone is already taken")
    void register_phoneAlreadyExists_throwsBadRequest() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByPhone("+1234567890")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Phone number already registered");
    }

    // ─── Login Tests ────────────────────────────────────────────────────────

    @Test
    @DisplayName("Should login successfully and return tokens")
    void login_success() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null);
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(mockUser));
        when(userDetailsService.loadUserByUsername("john@example.com")).thenReturn(mockUserDetails);
        when(jwtUtil.generateToken(any())).thenReturn("access_token");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh_token");
        when(jwtUtil.getExpirationTime()).thenReturn(86400000L);

        AuthResponse response = authService.login(loginRequest);

        assertThat(response.getAccessToken()).isEqualTo("access_token");
        assertThat(response.getUser().getEmail()).isEqualTo("john@example.com");
        verify(userRepository).updateUserStatus(eq(1L), eq(User.UserStatus.ONLINE), isNull());
    }

    // ─── Logout Tests ───────────────────────────────────────────────────────

    @Test
    @DisplayName("Should update status to OFFLINE on logout")
    void logout_setsStatusOffline() {
        authService.logout(1L);
        verify(userRepository).updateUserStatus(eq(1L), eq(User.UserStatus.OFFLINE), any());
    }

    // ─── Change Password Tests ───────────────────────────────────────────────

    @Test
    @DisplayName("Should throw BadRequestException when current password is wrong")
    void changePassword_wrongCurrentPassword_throwsBadRequest() {
        AuthRequest.ChangePassword req = new AuthRequest.ChangePassword();
        req.setCurrentPassword("wrong_password");
        req.setNewPassword("newpassword123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrong_password", "encoded_password")).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword(1L, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Current password is incorrect");
    }
}
