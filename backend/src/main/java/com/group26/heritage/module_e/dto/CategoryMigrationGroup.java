package com.group26.heritage.module_e.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Resource group moved to the same target category during category deactivation.
 */
public record CategoryMigrationGroup(
    @NotEmpty(message = "Resource ids must not be empty")
    List<@NotNull(message = "Resource id must not be null") Long> resourceIds,

    @NotNull(message = "Target category id must not be null")
    Long targetCategoryId
) {
}
