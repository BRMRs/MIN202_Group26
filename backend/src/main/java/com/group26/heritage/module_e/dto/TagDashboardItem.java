package com.group26.heritage.module_e.dto;

public record TagDashboardItem(
        Long tagId,
        String tagName,
        long approvedResourceCount,
        double ratio
) {
}
