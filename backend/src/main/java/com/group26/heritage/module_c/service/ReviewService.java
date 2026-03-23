package com.group26.heritage.module_c.service;

import org.springframework.stereotype.Service;

/**
 * Review Service — Module C
 * TODO: Inject ResourceRepository, ReviewFeedbackRepository, UserRepository
 * TODO: getPendingResources(Pageable pageable) → Page<Resource>
 * TODO: approveResource(Long resourceId, Long reviewerId, String feedbackText) — status → APPROVED
 * TODO: rejectResource(Long resourceId, Long reviewerId, String feedbackText) — status → REJECTED (feedback mandatory)
 * TODO: saveFeedback(Long resourceId, Long reviewerId, String feedbackText, String status) → ReviewFeedback
 * TODO: getReviewHistory(Long resourceId) → List<ReviewFeedback>
 * TODO: archiveResource(Long resourceId, Long adminId, String archiveReason) — status → ARCHIVED
 */
@Service
public class ReviewService {
    // TODO: implement review workflow logic
}
