package com.group26.heritage.module_c.controller;

import com.group26.heritage.common.dto.ApiResponse;
import com.group26.heritage.common.dto.PageResult;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_c.dto.ResourceReviewDetailResponse;
import com.group26.heritage.module_c.dto.ResourceReviewSummaryDto;
import com.group26.heritage.module_c.dto.ReviewDecisionRequest;
import com.group26.heritage.module_c.dto.ReviewFeedbackResponse;
import com.group26.heritage.module_c.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

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

    @GetMapping("/{resourceId}")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> getDetail(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal User user) {

        Long requesterId = (user != null) ? user.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getResourceDetail(resourceId, requesterId)));
    }

    @GetMapping("/public/{resourceId}")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> getPublicDetail(
            @PathVariable Long resourceId) {

        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getPublicResourceDetail(resourceId)));
    }

    @PostMapping("/{resourceId}/approve")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> approve(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) ReviewDecisionRequest request) {

        String feedback = (request != null) ? request.getFeedbackText() : null;
        return ResponseEntity.ok(ApiResponse.success("Resource approved.",
                reviewService.approveResource(resourceId, user.getId(), feedback)));
    }

    @PostMapping("/{resourceId}/reject")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> reject(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal User user,
            @RequestBody ReviewDecisionRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Resource rejected.",
                reviewService.rejectResource(resourceId, user.getId(), request.getFeedbackText())));
    }

    @PostMapping("/{resourceId}/unpublish")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> unpublish(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal User user,
            @RequestBody ReviewDecisionRequest request) {

        if (request == null || request.getFeedbackText() == null || request.getFeedbackText().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Unpublish reason is mandatory."));
        }

        return ResponseEntity.ok(ApiResponse.success("Resource unpublished.",
                reviewService.unpublishResource(resourceId, user.getId(), request.getFeedbackText())));
    }

    @PostMapping("/{resourceId}/republish")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> republish(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) ReviewDecisionRequest request) {

        String feedback = (request != null) ? request.getFeedbackText() : null;
        return ResponseEntity.ok(ApiResponse.success("Resource republished.",
                reviewService.republishResource(resourceId, user.getId(), feedback)));
    }

    @PostMapping("/{resourceId}/archive")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> archive(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal User user,
            @RequestBody ReviewDecisionRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Resource archived.",
                reviewService.archiveResource(resourceId, user.getId(), request.getFeedbackText())));
    }

    @GetMapping("/{resourceId}/feedback")
    public ResponseEntity<ApiResponse<List<ReviewFeedbackResponse>>> getFeedbackHistory(
            @PathVariable Long resourceId) {

        return ResponseEntity.ok(ApiResponse.success(reviewService.getReviewHistory(resourceId)));
    }

    @PostMapping("/{resourceId}/resubmit")
    public ResponseEntity<ApiResponse<ResourceReviewDetailResponse>> resubmit(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(ApiResponse.success(
                "Resource resubmitted for review.",
                reviewService.resubmitResource(resourceId, user.getId())));
    }
}
