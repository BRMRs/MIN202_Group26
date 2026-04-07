package com.group26.heritage.common.repository;

import com.group26.heritage.entity.ReviewFeedback;
import com.group26.heritage.entity.enums.ReviewDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ReviewFeedback Repository — used by Module C.
 * IMPORTANT: This is the ONLY ReviewFeedbackRepository in the project.
 */
@Repository
public interface ReviewFeedbackRepository extends JpaRepository<ReviewFeedback, Long> {
    List<ReviewFeedback> findByResourceIdOrderByReviewedAtDesc(Long resourceId);
    Optional<ReviewFeedback> findTopByResourceIdOrderByReviewedAtDesc(Long resourceId);

    // PBI 3.4 — Audit Trail: count how many times a resource has been rejected
    long countByResourceIdAndDecision(Long resourceId, ReviewDecision decision);
}
