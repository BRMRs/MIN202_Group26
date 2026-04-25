package com.group26.heritage.module_a.dto;

import com.group26.heritage.entity.enums.ApplicationStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ContributorApplicationListResponse {
    private Long id;
    private Long userId;
    private String username;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
}