package com.group26.heritage.module_e.dto;

import com.group26.heritage.entity.enums.ResourceStatus;

import java.time.LocalDateTime;
import java.util.List;

public record AdminResourceResponse(
    Long id,
    String title,
    String contributorName,
    Long categoryId,
    String categoryName,
    String categoryStatus,
    ResourceStatus status,
    LocalDateTime updatedAt,
    List<String> tags
) {
}
