package com.group26.heritage.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lightweight resource DTO for list views and search results.
 * Used by Module D (browse/search) and Module C (reviewer list).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceSummaryDto {
    private Long id;
    private String title;
    private String status;
    private String categoryName;
    private String contributorName;
    private LocalDateTime createdAt;
}
