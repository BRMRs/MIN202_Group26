package com.group26.heritage.module_e.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;

public record TagDashboardResponse(
        long totalApprovedTaggedResources,
        List<TagDashboardItem> items,
        @JsonProperty("generated_at")
        LocalDateTime generatedAt
) {
}
