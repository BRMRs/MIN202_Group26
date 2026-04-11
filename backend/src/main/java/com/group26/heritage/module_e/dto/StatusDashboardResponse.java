package com.group26.heritage.module_e.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;

public record StatusDashboardResponse(
        long total,
        List<StatusDashboardItem> items,
        WorkflowSummary workflow,
        @JsonProperty("generated_at")
        LocalDateTime generatedAt
) {
}
