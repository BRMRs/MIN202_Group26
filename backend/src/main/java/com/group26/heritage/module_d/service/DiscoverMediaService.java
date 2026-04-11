package com.group26.heritage.module_d.service;

import com.group26.heritage.common.exception.ResourceNotFoundException;
import com.group26.heritage.common.repository.ResourceMediaRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.ResourceMedia;
import com.group26.heritage.entity.enums.ResourceStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves stored files for the discover UI at GET /api/discover/media/{id}
 * without opening GET /uploads/** (which stays authenticated-only).
 */
@Service
public class DiscoverMediaService {

    private static final String UPLOAD_URL_PREFIX = "/uploads/";

    private final ResourceMediaRepository mediaRepository;
    private final ResourceRepository resourceRepository;
    private final Path uploadRoot;

    public DiscoverMediaService(
            ResourceMediaRepository mediaRepository,
            ResourceRepository resourceRepository,
            @Value("${app.upload-dir}") String uploadDir
    ) {
        this.mediaRepository = mediaRepository;
        this.resourceRepository = resourceRepository;
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public ResponseEntity<org.springframework.core.io.Resource> servePublicMedia(Long mediaId) {
        ResourceMedia media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Media not found: " + mediaId));
        Resource resource = resourceRepository.findById(media.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
        ResourceStatus st = resource.getStatus();
        if (st != ResourceStatus.APPROVED) {
            throw new ResourceNotFoundException("Media not available");
        }

        Path file = resolveStoredPath(media.getFileUrl());
        if (file == null || !Files.isReadable(file)) {
            throw new ResourceNotFoundException("File missing");
        }

        try {
            org.springframework.core.io.Resource body = new UrlResource(file.toUri());
            String mime = media.getMimeType();
            MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
            if (mime != null && !mime.isBlank()) {
                try {
                    contentType = MediaType.parseMediaType(mime);
                } catch (Exception ignored) {
                    // keep octet-stream
                }
            }

            String fileName = media.getFileName();
            String cd = "inline";
            if (fileName != null && !fileName.isBlank()) {
                cd = "inline; filename=\"" + sanitizeFilenameForHeader(fileName) + "\"";
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, cd)
                    .contentType(contentType)
                    .contentLength(Files.size(file))
                    .body(body);
        } catch (Exception e) {
            throw new ResourceNotFoundException("Could not read file");
        }
    }

    private static String sanitizeFilenameForHeader(String name) {
        return name.replace("\"", "").replace("\r", "").replace("\n", "");
    }

    private Path resolveStoredPath(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith(UPLOAD_URL_PREFIX)) {
            return null;
        }
        String relative = fileUrl.substring(UPLOAD_URL_PREFIX.length());
        if (relative.isEmpty() || relative.contains("..")) {
            return null;
        }
        Path resolved = uploadRoot.resolve(relative).normalize();
        if (!resolved.startsWith(uploadRoot)) {
            return null;
        }
        return resolved;
    }
}
