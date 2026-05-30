package com.chatapp.service;

import com.chatapp.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Handles file uploads and retrieval for shared media.
 * Files are stored locally; in production, replace with S3/GCS.
 */
@Service
@Slf4j
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "video/mp4", "audio/mpeg", "audio/wav", "audio/ogg",
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private static final long MAX_SIZE = 50 * 1024 * 1024; // 50MB

    /**
     * Store a file and return the accessible URL path.
     */
    public String storeFile(MultipartFile file) {
        validateFile(file);

        try {
            // Create upload directory structure
            String subDir = getSubDirectory(file.getContentType());
            Path uploadPath = Paths.get(uploadDir, subDir);
            Files.createDirectories(uploadPath);

            // Generate unique filename
            String extension = FilenameUtils.getExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID() + "." + extension;
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            log.info("File stored: {}/{}", subDir, fileName);

            return "/files/" + subDir + "/" + fileName;
        } catch (IOException e) {
            log.error("Failed to store file: {}", e.getMessage());
            throw new RuntimeException("Failed to store file: " + e.getMessage());
        }
    }

    /**
     * Load file as a Spring Resource for streaming.
     */
    public Resource loadFile(String filePath) {
        try {
            Path path = Paths.get(uploadDir).resolve(filePath).normalize();
            Resource resource = new UrlResource(path.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new BadRequestException("File not found: " + filePath);
            }
        } catch (MalformedURLException e) {
            throw new BadRequestException("Invalid file path: " + filePath);
        }
    }

    /**
     * Delete a file from storage.
     */
    public void deleteFile(String fileUrl) {
        try {
            String relativePath = fileUrl.replace("/files/", "");
            Path path = Paths.get(uploadDir, relativePath);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", fileUrl);
        }
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new BadRequestException("File size exceeds 50MB limit");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("File type not allowed: " + file.getContentType());
        }
    }

    private String getSubDirectory(String contentType) {
        if (contentType == null) return "files";
        if (contentType.startsWith("image/")) return "images";
        if (contentType.startsWith("video/")) return "videos";
        if (contentType.startsWith("audio/")) return "audio";
        return "documents";
    }
}
