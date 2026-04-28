package com.group26.heritage.module_e.dto;

import lombok.Data;

import java.util.List;

/** Tag merge request DTO - Summary E-PBI 2 */
@Data
public class TagMergeRequest {
    private List<Long> sourceTagIds;
    private Long targetTagId;
}
