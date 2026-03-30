package com.group26.heritage.module_e.dto;

import com.group26.heritage.entity.enums.CategoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Category create and update request payload.
 */
public record CategoryRequest(
    @NotBlank(message = "Category name must not be empty")
    @Size(max = 100, message = "Category name must not exceed 100 characters")
    String name,

    @Size(max = 1000, message = "Category description must not exceed 1000 characters")
    String description,

    @NotNull(message = "Category status must not be null")
    CategoryStatus status
) {
}
