package com.group26.heritage.module_e.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * Tag response payload.
 */
public record TagResponse(
    Long id,
    String name,
    String description,
    @JsonProperty("is_deleted") Boolean isDeleted,
    @JsonProperty("created_at") LocalDateTime createdAt
) {
}
