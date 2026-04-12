package com.group26.heritage.module_d.dto;

import com.group26.heritage.common.dto.UserSummaryDto;
import com.group26.heritage.entity.enums.ResourceStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Public resource detail — Module D discover API.
 */
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
        LocalDateTime updatedAt,
        ResourceStatus status,
        UserSummaryDto contributor,
        List<MediaDetailDto> media,
        Integer commentCount,
        Integer likeCount
) {
}
