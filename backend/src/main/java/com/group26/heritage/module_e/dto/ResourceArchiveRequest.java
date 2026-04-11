package com.group26.heritage.module_e.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResourceArchiveRequest(
    @NotBlank(message = "archive reason is required")
    @Size(max = 2000, message = "archive reason must be at most 2000 characters")
    String reason
) {
}
