package com.group26.heritage.module_e.dto;

public record CategoryDashboardItem(
        Long categoryId,
        String categoryName,
        String categoryStatus,
        long count,
        double ratio
) {
}
