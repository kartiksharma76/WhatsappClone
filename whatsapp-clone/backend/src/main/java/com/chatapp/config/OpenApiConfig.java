package com.chatapp.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger / OpenAPI 3 configuration.
 * Access docs at: http://localhost:8080/api/swagger-ui.html
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI openAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("WhatsApp Clone API")
                        .description("""
                                Production-level real-time chat application API.
                                
                                **Features:**
                                - JWT authentication (access + refresh tokens)
                                - WebSocket/STOMP real-time messaging
                                - One-to-one and group chats
                                - File/image/voice sharing
                                - Message reactions, replies, delivery tracking
                                - User presence and typing indicators
                                
                                **WebSocket endpoint:** `ws://localhost:8080/api/ws`  
                                Connect with `Authorization: Bearer <token>` in STOMP headers.
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("ChatApp Team")
                                .email("dev@chatapp.com"))
                        .license(new License().name("MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort + "/api")
                                .description("Local Development Server"),
                        new Server()
                                .url("https://api.chatapp.com")
                                .description("Production Server")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT token in the format: Bearer <token>")));
    }
}
