package com.group26.heritage.module_c.dto;

import lombok.Data;

import java.time.LocalDateTime;

/** Review feedback response DTO — Summary C-PBI 3 */
@Data
public class ReviewFeedbackResponse {
    private Long id;
    private String reviewerName;
    private String status;
    private String feedbackText;
    private LocalDateTime reviewedAt;
}
