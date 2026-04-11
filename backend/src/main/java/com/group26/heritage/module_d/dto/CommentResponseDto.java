package com.group26.heritage.module_d.dto;

import com.group26.heritage.common.dto.UserSummaryDto;

/** Single comment row for GET /api/comments/resource/{id} */
public record CommentResponseDto(Long id, String content, String createdAt, UserSummaryDto user) {
}
