package com.group26.heritage.module_c.dto;

import com.group26.heritage.entity.enums.ReviewDecision;
import com.group26.heritage.entity.enums.ResourceStatus;
import lombok.Data;

import java.time.LocalDateTime;

/** Review feedback response DTO — Summary C-PBI 3 */
@Data
public class ReviewFeedbackResponse {
    private Long id;
    private String reviewerName;
    private ReviewDecision decision;
    private ResourceStatus previousStatus;
    private String feedbackText;
    private LocalDateTime reviewedAt;
}
