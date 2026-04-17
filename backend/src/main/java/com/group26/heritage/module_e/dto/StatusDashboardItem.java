package com.group26.heritage.module_e.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record StatusDashboardItem(
        String key,
        String label,
        long count,
        double ratio,
        @JsonProperty("workflow_stage")
        boolean workflowStage,
        boolean bottleneck
) {
}
