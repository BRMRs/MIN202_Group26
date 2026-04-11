package com.group26.heritage.module_e.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Batch migration payload used before deactivating a category.
 */
public record CategoryMigrationRequest(
    @NotNull(message = "Migration groups must not be null")
    List<@Valid CategoryMigrationGroup> migrations
) {
}
