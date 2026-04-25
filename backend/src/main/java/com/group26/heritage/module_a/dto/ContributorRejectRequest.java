package com.group26.heritage.module_a.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContributorRejectRequest {
    @NotBlank(message = "Reject reason is required")
    @Size(max = 1000, message = "Reject reason must not exceed 1000 characters")
    private String reason;
}
