package com.group26.heritage.module_c.controller;

import com.group26.heritage.common.dto.ApiResponse;
import com.group26.heritage.common.dto.PageResult;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_c.dto.ResourceReviewDetailResponse;
import com.group26.heritage.module_c.dto.ResourceReviewSummaryDto;
import com.group26.heritage.module_c.dto.ReviewDecisionRequest;
import com.group26.heritage.module_c.dto.ReviewFeedbackResponse;
import com.group26.heritage.module_c.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Review Controller — Module C, PBI 3.1 + PBI 3.2 + PBI 3.4
 *
 * PBI 3.1 Tasks: list, detail, approve, reject, feedback history, archive
 * PBI 3.2 Tasks: unpublish, republish, access control, optimized update
 * PBI 3.4 Tasks: resubmit (REJECTED→PENDING_REVIEW), audit trail via rejectionCount in list
 *
 * Auth note: reviewer/admin ID via X-User-Id header (temporary until Module A JWT).
 */
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // ---------------------------------------------------------------
    // PBI 3.1 — List resources with filtering + chronological sorting
    // GET /api/reviews?status=PENDING_REVIEW&categoryId=3&page=0&size=10&sort=desc
    // ---------------------------------------------------------------
    @GetMapping
    public ResponseEntity<ApiResponse<PageResult<ResourceReviewSummaryDto>>> listResources(
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "10")  int size,
            @RequestParam(defaultValue = "desc") String sort) {

        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getResourceList(status, categoryId, page, size, sort)));
    }

    // ---------------------------------------------------------------
    // PBI 3.1 + PBI 3.2 — Resource detail
    // PBI 3.2 Task: "Restrict rejected items to contributor-only access"
    // GET /api/reviews/{resourceId}
    // Header (optional): X-User-Id — used to enforce REJECTED access control
    // ---------------------------------------------------------------
    @GetMapping("/{resourceId}")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> getDetail(
            @PathVariable Long resourceId,
            @RequestHeader(value = "X-User-Id", required = false) Long requesterId) {

        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getResourceDetail(resourceId, requesterId)));
    }

    // ---------------------------------------------------------------
    // PBI 3.2 — Approve: PENDING_REVIEW → APPROVED
    // POST /api/reviews/{resourceId}/approve
    // ---------------------------------------------------------------
    @PostMapping("/{resourceId}/approve")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> approve(
            @PathVariable Long resourceId,
            @RequestHeader("X-User-Id") Long reviewerId,
            @RequestBody(required = false) ReviewDecisionRequest request) {

        String feedback = (request != null) ? request.getFeedbackText() : null;
        return ResponseEntity.ok(ApiResponse.success("Resource approved.",
                reviewService.approveResource(resourceId, reviewerId, feedback)));
    }

    // ---------------------------------------------------------------
    // PBI 3.2 — Reject: PENDING_REVIEW → REJECTED (feedback mandatory)
    // POST /api/reviews/{resourceId}/reject
    // ---------------------------------------------------------------
    @PostMapping("/{resourceId}/reject")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> reject(
            @PathVariable Long resourceId,
            @RequestHeader("X-User-Id") Long reviewerId,
            @RequestBody ReviewDecisionRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Resource rejected.",
                reviewService.rejectResource(resourceId, reviewerId, request.getFeedbackText())));
    }

    // ---------------------------------------------------------------
    // PBI 3.2 — Unpublish: APPROVED → UNPUBLISHED
    // POST /api/reviews/{resourceId}/unpublish
    // ---------------------------------------------------------------
    @PostMapping("/{resourceId}/unpublish")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> unpublish(
            @PathVariable Long resourceId,
            @RequestHeader("X-User-Id") Long adminId) {

        return ResponseEntity.ok(ApiResponse.success("Resource unpublished.",
                reviewService.unpublishResource(resourceId, adminId)));
    }

    // ---------------------------------------------------------------
    // PBI 3.2 — Republish: UNPUBLISHED → APPROVED
    // POST /api/reviews/{resourceId}/republish
    // ---------------------------------------------------------------
    @PostMapping("/{resourceId}/republish")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> republish(
            @PathVariable Long resourceId,
            @RequestHeader("X-User-Id") Long adminId) {

        return ResponseEntity.ok(ApiResponse.success("Resource republished.",
                reviewService.republishResource(resourceId, adminId)));
    }

    // ---------------------------------------------------------------
    // PBI 3.1 — Archive: APPROVED/UNPUBLISHED → ARCHIVED
    // POST /api/reviews/{resourceId}/archive
    // ---------------------------------------------------------------
    @PostMapping("/{resourceId}/archive")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> archive(
            @PathVariable Long resourceId,
            @RequestHeader("X-User-Id") Long adminId,
            @RequestBody ReviewDecisionRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Resource archived.",
                reviewService.archiveResource(resourceId, adminId, request.getFeedbackText())));
    }

    // ---------------------------------------------------------------
    // PBI 3.1 — Review feedback history
    // GET /api/reviews/{resourceId}/feedback
    // ---------------------------------------------------------------
    @GetMapping("/{resourceId}/feedback")
    public ResponseEntity<ApiResponse<List<ReviewFeedbackResponse>>> getFeedbackHistory(
            @PathVariable Long resourceId) {

        return ResponseEntity.ok(ApiResponse.success(reviewService.getReviewHistory(resourceId)));
    }

    // ---------------------------------------------------------------
    // PBI 3.4 — Contributor Resubmission
    // POST /api/reviews/{resourceId}/resubmit
    // Header: X-User-Id = contributor's user ID
    // Transitions: REJECTED → PENDING_REVIEW
    // The review queue (GET /api/reviews?status=PENDING_REVIEW) automatically includes it.
    // ---------------------------------------------------------------
    @PostMapping("/{resourceId}/resubmit")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> resubmit(
            @PathVariable Long resourceId,
            @RequestHeader("X-User-Id") Long contributorId) {

        return ResponseEntity.ok(ApiResponse.success(
                "Resource resubmitted for review.",
                reviewService.resubmitResource(resourceId, contributorId)));
    }
}
