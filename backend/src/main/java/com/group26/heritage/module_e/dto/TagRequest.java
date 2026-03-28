package com.group26.heritage.module_e.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Tag create and update request payload.
 */
public record TagRequest(
    @NotBlank(message = "Tag name must not be empty")
    @Size(max = 50, message = "Tag name must not exceed 50 characters")
    String name,

    @Size(max = 1000, message = "Tag description must not exceed 1000 characters")
    String description
) {
}
