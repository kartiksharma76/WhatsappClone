package com.chatapp.config;

import com.chatapp.entity.User;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiStartupConfig implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public static final String AI_EMAIL = "meta.ai@chatapp.com";

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(AI_EMAIL)) {
            User aiUser = User.builder()
                    .fullName("Meta AI")
                    .email(AI_EMAIL)
                    .phone("0000000000")
                    .password(passwordEncoder.encode("metaai_secure_password_placeholder"))
                    .about("I'm Meta AI, your smart assistant. Ask me anything!")
                    .profilePicture("https://api.dicebear.com/7.x/bottts/svg?seed=metaai")
                    .status(User.UserStatus.ONLINE)
                    .isOnline(true)
                    .role(User.Role.USER)
                    .isActive(true)
                    .emailVerified(true)
                    .lastSeen(LocalDateTime.now())
                    .build();
            userRepository.save(aiUser);
            log.info("Meta AI user seeded successfully in the database.");
        }
    }
}
