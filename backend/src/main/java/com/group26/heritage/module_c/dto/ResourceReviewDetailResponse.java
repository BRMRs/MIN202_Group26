package com.group26.heritage.module_c.dto;

import com.group26.heritage.entity.enums.MediaType;
import com.group26.heritage.entity.enums.ResourceStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Full resource detail for the reviewer — C-PBI 1 (detail view).
 * Null/blank fields are replaced with "Not provided" to satisfy Task:
 * "Add 'Not provided' placeholder logic for empty fields".
 */
@Data
public class ResourceReviewDetailResponse {

    private Long id;
    private String title;
    private String description;
    private ResourceStatus status;

    // Category
    private Long categoryId;
    private String categoryName;
    private String requestedCategoryName;
    private String categoryRequestReason;

    // Contributor
    private Long contributorId;
    private String contributorName;

    // Metadata
    private String place;
    private String copyrightDeclaration;
    private String externalLink;
    private String archiveReason;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Counters
    private int commentCount;
    private int likeCount;

    // Media files (Task: media file full-size preview mode)
    private List<MediaFileDto> mediaFiles;

    // Latest review feedback
    private ReviewFeedbackResponse latestFeedback;

    @Data
    public static class MediaFileDto {
        private Long id;
        private MediaType mediaType;
        private String fileUrl;
        private String fileName;
        private String mimeType;
        private Long fileSize;
        private int sortOrder;
    }

    /** Replaces null/blank with "Not provided" — used when assembling the response. */
    public static String orNotProvided(String value) {
        return (value != null && !value.isBlank()) ? value : "Not provided";
    }
}
