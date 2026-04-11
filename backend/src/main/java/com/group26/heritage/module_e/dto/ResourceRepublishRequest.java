package com.group26.heritage.module_e.dto;

import jakarta.validation.constraints.NotNull;

public record ResourceRepublishRequest(
    @NotNull(message = "categoryId is required")
    Long categoryId
) {
}
