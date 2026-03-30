package com.group26.heritage.module_d.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ResourceDetailDto(
        Long id,
        String title,
        String description,
        String place,
        String fileUrl,
        String externalLink,
        String copyrightDeclaration,
        String categoryName,
        List<TagOptionDto> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
