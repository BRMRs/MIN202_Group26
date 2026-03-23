package com.group26.heritage.module_b.dto;

import lombok.Data;

import java.util.List;

/** Resource creation/update request DTO — Summary B-PBI 1 */
@Data
public class ResourceCreateRequest {
    private String title;
    private String description;
    private Long categoryId;
    private String place;
    private String copyrightDeclaration;
    private String externalLink;
    private List<Long> tagIds;
}
