package com.group26.heritage.module_e.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record WorkflowSummary(
        List<WorkflowStageItem> stages,
        @JsonProperty("bottleneck_stage")
        String bottleneckStage,
        @JsonProperty("bottleneck_label")
        String bottleneckLabel,
        @JsonProperty("bottleneck_count")
        long bottleneckCount
) {
}
