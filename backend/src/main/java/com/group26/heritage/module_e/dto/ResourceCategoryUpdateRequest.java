package com.group26.heritage.module_e.dto;

import jakarta.validation.constraints.NotNull;

public record ResourceCategoryUpdateRequest(
    @NotNull(message = "categoryId is required")
    Long categoryId
) {
}
