package com.group26.heritage.module_a.dto;

import lombok.Data;

/** Profile update request DTO — Summary A-PBI 1.4 (50-char bio limit) */
@Data
public class ProfileUpdateRequest {
    private String username;
    private String bio;
    private String avatarUrl;
}
