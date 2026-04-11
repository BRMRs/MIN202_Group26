package com.group26.heritage.module_e.dto;

import com.group26.heritage.entity.enums.ResourceStatus;

/**
 * Resource item that must be reassigned before category deactivation.
 */
public record CategoryResourceMigrationItem(
    Long id,
    String title,
    ResourceStatus status,
    Long categoryId,
    String categoryName
) {
}
