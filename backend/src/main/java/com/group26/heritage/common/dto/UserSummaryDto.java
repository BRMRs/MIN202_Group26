package com.group26.heritage.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight user info DTO — used in comments, resource cards, review feedback.
 * Avoids exposing sensitive User fields (password, verificationToken, etc.)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    private Long id;
    private String username;
    private String avatarUrl;
}
