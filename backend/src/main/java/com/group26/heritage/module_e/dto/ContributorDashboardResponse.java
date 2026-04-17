package com.group26.heritage.module_e.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;

public record ContributorDashboardResponse(
        long total,
        List<ContributorDashboardItem> items,
        @JsonProperty("generated_at")
        LocalDateTime generatedAt
) {
}

