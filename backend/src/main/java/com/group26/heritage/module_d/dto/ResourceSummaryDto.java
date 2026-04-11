package com.group26.heritage.module_d.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ResourceSummaryDto(
        Long id,
        String title,
        String description,
        String place,
        String fileUrl,
        String externalLink,
        String categoryName,
        List<TagOptionDto> tags,
        Long likeCount,
        Long commentCount,
        LocalDateTime createdAt
) {
}
