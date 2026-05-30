package com.chatapp.controller;

import com.chatapp.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;

/**
 * Serves static uploaded files (images, audio, video, documents).
 * In production, replace with CDN or object storage (S3/GCS).
 */
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Tag(name = "Files", description = "File serving endpoints")
public class FileController {

    private final FileStorageService fileStorageService;

    @GetMapping("/{type}/{filename:.+}")
    @Operation(summary = "Serve an uploaded file")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String type,
            @PathVariable String filename,
            HttpServletRequest request) {

        Resource resource = fileStorageService.loadFile(type + "/" + filename);

        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            contentType = "application/octet-stream";
        }

        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
