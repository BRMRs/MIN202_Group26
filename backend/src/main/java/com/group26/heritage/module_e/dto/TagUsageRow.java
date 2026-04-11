package com.group26.heritage.module_e.dto;

import java.time.LocalDateTime;

/**
 * Projection row for tag usage statistics in admin tag management.
 */
public interface TagUsageRow {
    Long getId();

    String getName();

    Boolean getIsDeleted();

    LocalDateTime getCreatedAt();

    Long getApprovedResourceCount();
}
