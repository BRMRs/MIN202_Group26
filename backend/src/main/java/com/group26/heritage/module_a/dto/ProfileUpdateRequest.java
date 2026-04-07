package com.group26.heritage.module_a.dto;

import lombok.Data;

// all fields are optional — only non-null values will be applied
@Data
public class ProfileUpdateRequest {
    private String username;
    private String bio;       // max 50 chars, enforced in UserService
    private String avatarUrl;
}
