package com.group26.heritage.module_e.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.group26.heritage.entity.enums.CategoryStatus;

import java.time.LocalDateTime;

/**
 * 分类接口响应参数。
 */
public record CategoryResponse(
    Long id,
    String name,
    String description,
    CategoryStatus status,
    @JsonProperty("created_at") LocalDateTime createdAt
) {
}
