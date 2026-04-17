package com.group26.heritage.module_e.dto;

public record ContributorDashboardItem(
        Long contributorId,
        String contributorName,
        long count,
        double ratio
) {
}
