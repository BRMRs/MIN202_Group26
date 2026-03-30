package com.group26.heritage.module_e.dto;

import com.group26.heritage.entity.enums.ResourceStatus;

import java.time.LocalDateTime;
import java.util.List;

public record AdminResourceResponse(
    Long id,
    String title,
    String description,
    Long contributorId,
    Long categoryId,
    String categoryName,
    String categoryStatus,
    ResourceStatus status,
    String archiveReason,
    String place,
    String externalLink,
    String copyrightDeclaration,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<String> tags,
    List<AdminResourceMediaResponse> media
) {
}
