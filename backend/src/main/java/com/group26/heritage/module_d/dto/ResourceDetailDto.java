package com.group26.heritage.module_d.dto;

import com.group26.heritage.common.dto.UserSummaryDto;
import com.group26.heritage.entity.enums.ResourceStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
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
    public static class MediaDto {
        private Long id;
        private String mediaType;
        private String fileUrl;
        private String fileName;
    }
}
