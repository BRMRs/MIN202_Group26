package com.group26.heritage.module_b.dto;

import lombok.Data;

import java.util.List;

/** Resource update request DTO — Summary B-PBI 1, B-PBI 5 */
@Data
public class ResourceUpdateRequest {
    private String title;
    private String description;
    private Long categoryId;
    private String place;
    private String copyrightDeclaration;
    private String externalLink;
    private List<Long> tagIds;
}
