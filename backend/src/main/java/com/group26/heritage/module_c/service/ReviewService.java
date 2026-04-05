package com.group26.heritage.module_c.service;

import com.group26.heritage.common.dto.PageResult;
import com.group26.heritage.common.exception.ResourceNotFoundException;
import com.group26.heritage.common.exception.UnauthorizedException;
import com.group26.heritage.common.repository.CategoryRepository;
import com.group26.heritage.common.repository.ResourceMediaRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.common.repository.ReviewFeedbackRepository;
import com.group26.heritage.common.repository.UserRepository;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.ResourceMedia;
import com.group26.heritage.entity.ReviewFeedback;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.MediaType;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.entity.enums.ReviewDecision;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_c.dto.ResourceReviewDetailResponse;
import com.group26.heritage.module_c.dto.ResourceReviewSummaryDto;
import com.group26.heritage.module_c.dto.ReviewFeedbackResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired private ResourceRepository resourceRepository;
    @Autowired private ReviewFeedbackRepository reviewFeedbackRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ResourceMediaRepository resourceMediaRepository;

    // ---------------------------------------------------------------
    // PBI 3.1 — Task: "API integration for fetching filtered resource lists"
    //           Task: "Implement chronological sorting and dynamic filtering logic"
    // ---------------------------------------------------------------

    public PageResult<ResourceReviewSummaryDto> getResourceList(
            ResourceStatus status,
            Long categoryId,
            int page,
            int size,
            String sortDirection) {

        Sort sort = Sort.by(
                "desc".equalsIgnoreCase(sortDirection) ? Sort.Direction.DESC : Sort.Direction.ASC,
                "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Resource> resultPage;
        if (status != null && categoryId != null) {
            resultPage = resourceRepository.findByStatusAndCategoryId(status, categoryId, pageable);
        } else if (status != null) {
            resultPage = resourceRepository.findByStatus(status, pageable);
        } else if (categoryId != null) {
            resultPage = resourceRepository.findByCategoryId(categoryId, pageable);
        } else {
            resultPage = resourceRepository.findByStatus(ResourceStatus.PENDING_REVIEW, pageable);
        }

        List<ResourceReviewSummaryDto> dtos = resultPage.getContent().stream()
                .map(this::toSummaryDto)
                .collect(Collectors.toList());

        return new PageResult<>(dtos, page, size,
                resultPage.getTotalElements(), resultPage.getTotalPages());
    }

    // ---------------------------------------------------------------
    // PBI 3.1 — Task: "Develop detailed view page with metadata and copyright display"
    // PBI 3.2 — Task: "Restrict rejected items to contributor-only access"
    // ---------------------------------------------------------------

    public ResourceReviewDetailResponse getResourceDetail(Long resourceId, Long requesterId) {
        Resource resource = findResourceOrThrow(resourceId);

        // REJECTED resources are only visible to their contributor or an admin
        if (resource.getStatus() == ResourceStatus.REJECTED && requesterId != null) {
            User requester = userRepository.findById(requesterId).orElse(null);
            boolean isAdmin       = requester != null && requester.getRole() == UserRole.ADMIN;
            boolean isContributor = resource.getContributorId().equals(requesterId);
            if (!isAdmin && !isContributor) {
                throw new UnauthorizedException(
                        "Rejected resources are only accessible by their contributor or an admin.");
            }
        }

        return toDetailResponse(resource);
    }

    // ---------------------------------------------------------------
    // PBI 3.1 — Approve a resource
        // PBI 3.2 — Task: "Implement Approve/Reject state transition logic in database"
    // Optimized: uses direct UPDATE query (no full entity load+save cycle).
    // ---------------------------------------------------------------

    @Transactional
    public ResourceReviewDetailResponse approveResource(Long resourceId, Long reviewerId, String feedbackText) {
        User reviewer = findAdminOrThrow(reviewerId);
        Resource resource = findResourceOrThrow(resourceId);

        if (resource.getStatus() != ResourceStatus.PENDING_REVIEW) {
            throw new IllegalArgumentException(
                    "Only PENDING_REVIEW resources can be approved. Current: " + resource.getStatus());
        }

        ResourceStatus previous = resource.getStatus();
        resourceRepository.updateStatus(resourceId, ResourceStatus.APPROVED, LocalDateTime.now());
        resourceRepository.flush();

        saveReviewFeedback(resourceId, reviewer.getId(), ReviewDecision.APPROVED, previous, feedbackText);
        return toDetailResponse(findResourceOrThrow(resourceId));
    }

    // PBI 3.2 — Reject (feedback mandatory)
    @Transactional
    public ResourceReviewDetailResponse rejectResource(Long resourceId, Long reviewerId, String feedbackText) {
        if (feedbackText == null || feedbackText.isBlank()) {
            throw new IllegalArgumentException("Feedback text is mandatory when rejecting a resource.");
        }

        if (feedbackText.trim().split("\\s+").length > 500) {
            throw new IllegalArgumentException("Feedback must not exceed 500 words");
        }

        User reviewer = findAdminOrThrow(reviewerId);
        Resource resource = findResourceOrThrow(resourceId);

        if (resource.getStatus() != ResourceStatus.PENDING_REVIEW) {
            throw new IllegalArgumentException(
                    "Only PENDING_REVIEW resources can be rejected. Current: " + resource.getStatus());
        }

        ResourceStatus previous = resource.getStatus();
        resourceRepository.updateStatus(resourceId, ResourceStatus.REJECTED, LocalDateTime.now());
        resourceRepository.flush();

        saveReviewFeedback(resourceId, reviewer.getId(), ReviewDecision.REJECTED, previous, feedbackText);
        return toDetailResponse(findResourceOrThrow(resourceId));
    }

    // PBI 3.2 — Unpublish: APPROVED → UNPUBLISHED
    @Transactional
    public ResourceReviewDetailResponse unpublishResource(Long resourceId, Long adminId) {
        findAdminOrThrow(adminId);
        Resource resource = findResourceOrThrow(resourceId);

        if (resource.getStatus() != ResourceStatus.APPROVED) {
            throw new IllegalArgumentException(
                    "Only APPROVED resources can be unpublished. Current: " + resource.getStatus());
        }

        resourceRepository.updateStatus(resourceId, ResourceStatus.UNPUBLISHED, LocalDateTime.now());
        resourceRepository.flush();
        return toDetailResponse(findResourceOrThrow(resourceId));
    }

    // ---------------------------------------------------------------
    // PBI 3.4 — Task: "Ensure the Review Queue automatically includes resubmitted items"
    // Contributor resubmits a REJECTED resource → status back to PENDING_REVIEW.
    // The queue (filtered by PENDING_REVIEW) picks it up automatically.
    // ---------------------------------------------------------------

    @Transactional
    public ResourceReviewDetailResponse resubmitResource(Long resourceId, Long contributorId) {
        Resource resource = findResourceOrThrow(resourceId);

        if (resource.getStatus() != ResourceStatus.REJECTED) {
            throw new IllegalArgumentException(
                    "Only REJECTED resources can be resubmitted. Current: " + resource.getStatus());
        }
        if (!resource.getContributorId().equals(contributorId)) {
            throw new UnauthorizedException("Only the original contributor can resubmit this resource.");
        }

        resourceRepository.updateStatus(resourceId, ResourceStatus.PENDING_REVIEW, LocalDateTime.now());
        resourceRepository.flush();
        return toDetailResponse(findResourceOrThrow(resourceId));
    }

    // PBI 3.2 — Republish: UNPUBLISHED → APPROVED
    @Transactional
    public ResourceReviewDetailResponse republishResource(Long resourceId, Long adminId) {
        findAdminOrThrow(adminId);
        Resource resource = findResourceOrThrow(resourceId);

        if (resource.getStatus() != ResourceStatus.UNPUBLISHED) {
            throw new IllegalArgumentException(
                    "Only UNPUBLISHED resources can be republished. Current: " + resource.getStatus());
        }

        resourceRepository.updateStatus(resourceId, ResourceStatus.APPROVED, LocalDateTime.now());
        resourceRepository.flush();
        return toDetailResponse(findResourceOrThrow(resourceId));
    }

    // PBI 3.1 — Archive: APPROVED/UNPUBLISHED → ARCHIVED
    @Transactional
    public ResourceReviewDetailResponse archiveResource(Long resourceId, Long adminId, String archiveReason) {
        User admin = findAdminOrThrow(adminId);
        Resource resource = findResourceOrThrow(resourceId);

        if (resource.getStatus() != ResourceStatus.APPROVED
                && resource.getStatus() != ResourceStatus.UNPUBLISHED) {
            throw new IllegalArgumentException(
                    "Only APPROVED or UNPUBLISHED resources can be archived. Current: " + resource.getStatus());
        }

        ResourceStatus previous = resource.getStatus();
        resourceRepository.updateStatusWithReason(
                resourceId, ResourceStatus.ARCHIVED, archiveReason, LocalDateTime.now());
        resourceRepository.flush();

        saveReviewFeedback(resourceId, admin.getId(), ReviewDecision.ARCHIVED, previous, archiveReason);
        return toDetailResponse(findResourceOrThrow(resourceId));
    }

    // ---------------------------------------------------------------
    // PBI 3.1 — Get review feedback history for a resource
    // ---------------------------------------------------------------

    public List<ReviewFeedbackResponse> getReviewHistory(Long resourceId) {
        findResourceOrThrow(resourceId);
        return reviewFeedbackRepository.findByResourceIdOrderByReviewedAtDesc(resourceId)
                .stream()
                .map(this::toFeedbackResponse)
                .collect(Collectors.toList());
    }

    // ---------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------

    private Resource findResourceOrThrow(Long resourceId) {
        return resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));
    }

    private User findAdminOrThrow(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (user.getRole() != UserRole.ADMIN) {
            throw new UnauthorizedException("Only admins can perform review actions.");
        }
        return user;
    }

    private void saveReviewFeedback(Long resourceId, Long reviewerId,
            ReviewDecision decision, ResourceStatus previousStatus, String feedbackText) {
        ReviewFeedback feedback = new ReviewFeedback();
        feedback.setResourceId(resourceId);
        feedback.setReviewerId(reviewerId);
        feedback.setDecision(decision);
        feedback.setPreviousStatus(previousStatus);
        feedback.setFeedbackText(feedbackText);
        feedback.setReviewedAt(LocalDateTime.now());
        reviewFeedbackRepository.save(feedback);
    }

    private ResourceReviewSummaryDto toSummaryDto(Resource r) {
        ResourceReviewSummaryDto dto = new ResourceReviewSummaryDto();
        dto.setId(r.getId());
        dto.setTitle(r.getTitle());
        dto.setStatus(r.getStatus());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());
        dto.setPlace(ResourceReviewSummaryDto.orNotProvided(r.getPlace()));

        userRepository.findById(r.getContributorId()).ifPresentOrElse(
                u -> dto.setContributorName(u.getUsername()),
                () -> dto.setContributorName("Not provided"));

        if (r.getCategoryId() != null) {
            categoryRepository.findById(r.getCategoryId()).ifPresentOrElse(
                    c -> dto.setCategoryName(c.getName()),
                    () -> dto.setCategoryName("Not provided"));
        } else {
            dto.setCategoryName(ResourceReviewSummaryDto.orNotProvided(r.getRequestedCategoryName()));
        }

        resourceMediaRepository.findByResourceIdAndMediaType(r.getId(), MediaType.COVER)
                .ifPresentOrElse(
                        m -> dto.setCoverUrl(m.getFileUrl()),
                        () -> dto.setCoverUrl(null));

        // PBI 3.4 — Audit Trail: surface previous rejection count so the review queue
        // can flag resubmitted items and reviewers can spot repeat submissions at a glance.
        long rejectionCount = reviewFeedbackRepository
                .countByResourceIdAndDecision(r.getId(), ReviewDecision.REJECTED);
        dto.setRejectionCount(rejectionCount);
        dto.setResubmission(r.getStatus() == ResourceStatus.PENDING_REVIEW && rejectionCount > 0);

        return dto;
    }

    private ResourceReviewDetailResponse toDetailResponse(Resource r) {
        ResourceReviewDetailResponse dto = new ResourceReviewDetailResponse();
        dto.setId(r.getId());
        dto.setTitle(r.getTitle());
        dto.setDescription(ResourceReviewDetailResponse.orNotProvided(r.getDescription()));
        dto.setStatus(r.getStatus());
        dto.setCategoryId(r.getCategoryId());
        dto.setContributorId(r.getContributorId());
        dto.setPlace(ResourceReviewDetailResponse.orNotProvided(r.getPlace()));
        dto.setCopyrightDeclaration(ResourceReviewDetailResponse.orNotProvided(r.getCopyrightDeclaration()));
        dto.setExternalLink(ResourceReviewDetailResponse.orNotProvided(r.getExternalLink()));
        dto.setArchiveReason(ResourceReviewDetailResponse.orNotProvided(r.getArchiveReason()));
        dto.setRequestedCategoryName(ResourceReviewDetailResponse.orNotProvided(r.getRequestedCategoryName()));
        dto.setCategoryRequestReason(ResourceReviewDetailResponse.orNotProvided(r.getCategoryRequestReason()));
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());

        userRepository.findById(r.getContributorId()).ifPresentOrElse(
                u -> dto.setContributorName(u.getUsername()),
                () -> dto.setContributorName("Not provided"));

        if (r.getCategoryId() != null) {
            categoryRepository.findById(r.getCategoryId()).ifPresentOrElse(
                    c -> dto.setCategoryName(c.getName()),
                    () -> dto.setCategoryName("Not provided"));
        } else {
            dto.setCategoryName(ResourceReviewDetailResponse.orNotProvided(r.getRequestedCategoryName()));
        }

        List<ResourceReviewDetailResponse.MediaFileDto> mediaFiles =
                resourceMediaRepository.findByResourceIdOrderBySortOrderAsc(r.getId())
                        .stream().map(this::toMediaFileDto).collect(Collectors.toList());
        dto.setMediaFiles(mediaFiles);

        reviewFeedbackRepository.findTopByResourceIdOrderByReviewedAtDesc(r.getId())
                .ifPresent(fb -> dto.setLatestFeedback(toFeedbackResponse(fb)));

        return dto;
    }

    private ResourceReviewDetailResponse.MediaFileDto toMediaFileDto(ResourceMedia m) {
        ResourceReviewDetailResponse.MediaFileDto dto = new ResourceReviewDetailResponse.MediaFileDto();
        dto.setId(m.getId());
        dto.setMediaType(m.getMediaType());
        dto.setFileUrl(m.getFileUrl());
        dto.setFileName(m.getFileName());
        dto.setMimeType(m.getMimeType());
        dto.setFileSize(m.getFileSize());
        dto.setSortOrder(m.getSortOrder());
        return dto;
    }

    private ReviewFeedbackResponse toFeedbackResponse(ReviewFeedback fb) {
        ReviewFeedbackResponse dto = new ReviewFeedbackResponse();
        dto.setId(fb.getId());
        dto.setDecision(fb.getDecision());
        dto.setPreviousStatus(fb.getPreviousStatus());
        dto.setFeedbackText(fb.getFeedbackText());
        dto.setReviewedAt(fb.getReviewedAt());
        userRepository.findById(fb.getReviewerId())
                .ifPresentOrElse(
                        u -> dto.setReviewerName(u.getUsername()),
                        () -> dto.setReviewerName("Not provided"));
        return dto;
    }
}
