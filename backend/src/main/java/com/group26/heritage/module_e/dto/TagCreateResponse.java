package com.group26.heritage.module_e.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Tag create response payload.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TagCreateResponse(
    String status,
    Long tagId,
    TagResponse tag
) {
}
