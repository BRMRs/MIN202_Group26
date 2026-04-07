package com.group26.heritage.module_c.dto;

import lombok.Data;

/** Review decision request DTO — Summary C-PBI 2, C-PBI 3 */
@Data
public class ReviewDecisionRequest {
    private String decision;
    private String feedbackText;
}
