package com.group26.heritage.common.repository;

import com.group26.heritage.entity.ReviewFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ReviewFeedback Repository — used by Module C.
 * IMPORTANT: This is the ONLY ReviewFeedbackRepository in the project.
 */
@Repository
public interface ReviewFeedbackRepository extends JpaRepository<ReviewFeedback, Long> {
    // TODO: List<ReviewFeedback> findByResourceId(Long resourceId);
    // TODO: Optional<ReviewFeedback> findTopByResourceIdOrderByReviewedAtDesc(Long resourceId);
}
