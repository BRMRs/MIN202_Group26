package com.group26.heritage.module_c.dto;

import com.group26.heritage.entity.enums.ResourceStatus;
import lombok.Data;

import java.time.LocalDateTime;

/** Summary item used in the reviewer's resource list — PBI 3.1 + PBI 3.4 */
@Data
public class ResourceReviewSummaryDto {
    private Long id;
    private String title;
    private String contributorName;
    private String categoryName;
    private ResourceStatus status;
    private String place;
    private String coverUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // PBI 3.4 — Audit Trail: show resubmission indicator in the review queue
    private long rejectionCount;
    private boolean resubmission;   // true when PENDING_REVIEW and has prior rejections

    /** Returns "Not provided" for any null string field when building the response. */
    public static String orNotProvided(String value) {
        return (value != null && !value.isBlank()) ? value : "Not provided";
    }
}
