package com.group26.heritage.module_e.dto;

import java.util.List;

/**
 * Deactivation readiness details for a category.
 */
public record CategoryDeactivationCheckResponse(
    Long categoryId,
    String categoryName,
    long resourceCount,
    boolean canDeactivateDirectly,
    List<CategoryResourceMigrationItem> resources,
    List<CategoryMigrationTarget> targetCategories
) {
}
