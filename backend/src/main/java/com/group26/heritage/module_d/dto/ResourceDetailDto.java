package com.group26.heritage.module_d.dto;

import com.group26.heritage.common.dto.UserSummaryDto;
import com.group26.heritage.entity.enums.ResourceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceDetailDto {
    private Long id;
    private String title;
    private String description;
    private Long categoryId;
    private String categoryName;
    private UserSummaryDto contributor;
    private ResourceStatus status;
    private String place;
    private String copyrightDeclaration;
    private String externalLink;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer commentCount;
    private Integer likeCount;
    private List<MediaDto> media;
    private List<String> tags;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaDto {
        private Long id;
        private String mediaType;
        private String fileUrl;
        private String fileName;
    }
}
