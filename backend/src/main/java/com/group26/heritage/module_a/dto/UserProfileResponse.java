package com.group26.heritage.module_a.dto;

import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String avatarUrl;
    private String bio;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Application status fields
    private ApplicationStatus applicationStatus;
    private LocalDateTime applicationReviewedAt;
    private String applicationRejectReason;

    public static UserProfileResponse fromUser(User user, ApplicationStatus appStatus, LocalDateTime reviewedAt, String rejectReason) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setBio(user.getBio());
        response.setEmailVerified(user.getEmailVerified());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        response.setApplicationStatus(appStatus);
        response.setApplicationReviewedAt(reviewedAt);
        response.setApplicationRejectReason(rejectReason);
        return response;
    }
}
