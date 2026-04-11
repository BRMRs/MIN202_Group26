package com.group26.heritage.module_e.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.group26.heritage.entity.enums.CategoryStatus;

import java.time.LocalDateTime;

/**
 * Category response payload.
 */
public record CategoryResponse(
    Long id,
    String name,
    String description,
    CategoryStatus status,
    @JsonProperty("created_at") LocalDateTime createdAt,
    @JsonProperty("is_default") boolean defaultFlag
) {
}
