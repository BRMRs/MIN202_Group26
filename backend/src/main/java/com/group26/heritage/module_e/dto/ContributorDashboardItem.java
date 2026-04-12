package com.group26.heritage.module_e.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ContributorDashboardItem(
        @JsonProperty("contributor_id")
        Long contributorId,
        @JsonProperty("contributor_name")
        String contributorName,
        long count,
        double ratio
) {
}

