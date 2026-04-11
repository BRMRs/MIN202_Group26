package com.group26.heritage.module_e.dto;

public record WorkflowStageItem(
        String key,
        String label,
        long count,
        double ratio,
        boolean bottleneck
) {
}
