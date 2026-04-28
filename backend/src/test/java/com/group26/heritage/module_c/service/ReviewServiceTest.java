package com.group26.heritage.module_c.service;

import com.group26.heritage.common.exception.UnauthorizedException;
import com.group26.heritage.common.repository.CategoryRepository;
import com.group26.heritage.common.repository.ResourceMediaRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.common.repository.ReviewFeedbackRepository;
import com.group26.heritage.common.repository.UserRepository;
import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.ReviewFeedback;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.CategoryStatus;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_c.dto.ResourceReviewDetailResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock private ResourceRepository       resourceRepository;
    @Mock private ReviewFeedbackRepository reviewFeedbackRepository;
    @Mock private UserRepository           userRepository;
    @Mock private CategoryRepository       categoryRepository;
    @Mock private ResourceMediaRepository  resourceMediaRepository;

    @InjectMocks private ReviewService reviewService;

    private User     adminUser;
    private User     contributorUser;
    private User     anotherUser;
    private Category activeCategory;
    private Category inactiveCategory;
    private Resource pendingResource;
    private Resource approvedResource;
    private Resource rejectedResource;
    private Resource unpublishedResource;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setEmailVerified(true);

        contributorUser = new User();
        contributorUser.setId(2L);
        contributorUser.setUsername("contributor");
        contributorUser.setRole(UserRole.CONTRIBUTOR);
        contributorUser.setEmailVerified(true);

        anotherUser = new User();
        anotherUser.setId(3L);
        anotherUser.setUsername("other_user");
        anotherUser.setRole(UserRole.CONTRIBUTOR);
        anotherUser.setEmailVerified(true);

        activeCategory = new Category();
        activeCategory.setId(1L);
        activeCategory.setName("Architecture");
        activeCategory.setStatus(CategoryStatus.ACTIVE);

        inactiveCategory = new Category();
        inactiveCategory.setId(1L);
        inactiveCategory.setName("Architecture");
        inactiveCategory.setStatus(CategoryStatus.INACTIVE);

        pendingResource    = makeResource(ResourceStatus.PENDING_REVIEW);
        approvedResource   = makeResource(ResourceStatus.APPROVED);
        rejectedResource   = makeResource(ResourceStatus.REJECTED);
        unpublishedResource = makeResource(ResourceStatus.UNPUBLISHED);

        lenient().when(resourceMediaRepository.findByResourceIdOrderBySortOrderAsc(anyLong()))
                .thenReturn(Collections.emptyList());
        lenient().when(reviewFeedbackRepository.findTopByResourceIdOrderByReviewedAtDesc(anyLong()))
                .thenReturn(Optional.empty());
        lenient().when(userRepository.findById(2L)).thenReturn(Optional.of(contributorUser));
        lenient().when(categoryRepository.findById(1L)).thenReturn(Optional.of(activeCategory));
    }

    private Resource makeResource(ResourceStatus status) {
        Resource r = new Resource();
        r.setId(1L);
        r.setTitle("Test Heritage Site");
        r.setDescription("A test description.");
        r.setStatus(status);
        r.setContributorId(2L);
        r.setCategoryId(1L);
        return r;
    }

    // approveResource

    @Test
    void approveResource_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(resourceRepository.findById(1L))
                .thenReturn(Optional.of(pendingResource))
                .thenReturn(Optional.of(makeResource(ResourceStatus.APPROVED)));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(activeCategory));
        when(resourceRepository.updateStatus(eq(1L), eq(ResourceStatus.APPROVED), any())).thenReturn(1);
        when(reviewFeedbackRepository.save(any(ReviewFeedback.class))).thenReturn(new ReviewFeedback());

        ResourceReviewDetailResponse response =
                reviewService.approveResource(1L, 1L, "Looks good.");

        assertEquals(ResourceStatus.APPROVED, response.getStatus());
        verify(resourceRepository).updateStatus(eq(1L), eq(ResourceStatus.APPROVED), any());
        verify(reviewFeedbackRepository).save(any(ReviewFeedback.class));
    }

    @Test
    void approveResource_alreadyApproved_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(approvedResource));

        assertThrows(IllegalArgumentException.class,
                () -> reviewService.approveResource(1L, 1L, "feedback"));
        verify(resourceRepository, never()).updateStatus(any(), any(), any());
    }

    @Test
    void approveResource_inactiveCategory_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(pendingResource));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(inactiveCategory));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> reviewService.approveResource(1L, 1L, "feedback"));
        assertTrue(ex.getMessage().toLowerCase().contains("category"));
    }

    @Test
    void approveResource_nonAdmin_throws() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(contributorUser));

        assertThrows(UnauthorizedException.class,
                () -> reviewService.approveResource(1L, 2L, "feedback"));
        verify(resourceRepository, never()).findById(any());
    }

    // rejectResource

    @Test
    void rejectResource_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(resourceRepository.findById(1L))
                .thenReturn(Optional.of(pendingResource))
                .thenReturn(Optional.of(makeResource(ResourceStatus.REJECTED)));
        when(resourceRepository.updateStatus(eq(1L), eq(ResourceStatus.REJECTED), any())).thenReturn(1);
        when(resourceRepository.updateReviewFeedback(eq(1L), any(), any())).thenReturn(1);
        when(reviewFeedbackRepository.save(any(ReviewFeedback.class))).thenReturn(new ReviewFeedback());

        ResourceReviewDetailResponse response =
                reviewService.rejectResource(1L, 1L, "Missing historical context.");

        assertEquals(ResourceStatus.REJECTED, response.getStatus());
        verify(reviewFeedbackRepository).save(any(ReviewFeedback.class));
        verify(resourceRepository).updateReviewFeedback(eq(1L), any(), any());
    }

    @Test
    void rejectResource_blankFeedback_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> reviewService.rejectResource(1L, 1L, ""));
        verifyNoInteractions(resourceRepository);
        verifyNoInteractions(userRepository);
    }

    @Test
    void rejectResource_nullFeedback_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> reviewService.rejectResource(1L, 1L, null));
    }

    // resubmitResource

    @Test
    void resubmitResource_success() {
        when(resourceRepository.findById(1L))
                .thenReturn(Optional.of(rejectedResource))
                .thenReturn(Optional.of(makeResource(ResourceStatus.PENDING_REVIEW)));
        when(resourceRepository.updateStatus(eq(1L), eq(ResourceStatus.PENDING_REVIEW), any())).thenReturn(1);

        ResourceReviewDetailResponse response =
                reviewService.resubmitResource(1L, 2L);

        assertEquals(ResourceStatus.PENDING_REVIEW, response.getStatus());
        verify(resourceRepository).updateStatus(eq(1L), eq(ResourceStatus.PENDING_REVIEW), any());
    }

    @Test
    void resubmitResource_wrongUser_throws() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(rejectedResource));

        assertThrows(UnauthorizedException.class,
                () -> reviewService.resubmitResource(1L, 3L));
        verify(resourceRepository, never()).updateStatus(any(), any(), any());
    }

    @Test
    void resubmitResource_wrongStatus_throws() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(pendingResource));

        assertThrows(IllegalArgumentException.class,
                () -> reviewService.resubmitResource(1L, 2L));
    }

    // unpublishResource

    @Test
    void unpublishResource_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(resourceRepository.findById(1L))
                .thenReturn(Optional.of(approvedResource))
                .thenReturn(Optional.of(makeResource(ResourceStatus.UNPUBLISHED)));
        when(resourceRepository.updateStatus(eq(1L), eq(ResourceStatus.UNPUBLISHED), any())).thenReturn(1);
        when(resourceRepository.updateReviewFeedback(eq(1L), any(), any())).thenReturn(1);
        when(reviewFeedbackRepository.save(any(ReviewFeedback.class))).thenReturn(new ReviewFeedback());

        ResourceReviewDetailResponse response =
                reviewService.unpublishResource(1L, 1L, "Policy violation.");

        assertEquals(ResourceStatus.UNPUBLISHED, response.getStatus());
        verify(resourceRepository).updateStatus(eq(1L), eq(ResourceStatus.UNPUBLISHED), any());
    }

    @Test
    void unpublishResource_blankReason_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> reviewService.unpublishResource(1L, 1L, "   "));
        verifyNoInteractions(resourceRepository);
    }

    // archiveResource

    @Test
    void archiveResource_fromApproved_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(resourceRepository.findById(1L))
                .thenReturn(Optional.of(approvedResource))
                .thenReturn(Optional.of(makeResource(ResourceStatus.ARCHIVED)));
        when(resourceRepository.updateStatusWithReason(
                eq(1L), eq(ResourceStatus.ARCHIVED), any(), any())).thenReturn(1);
        when(resourceRepository.updateReviewFeedback(eq(1L), any(), any())).thenReturn(1);
        when(reviewFeedbackRepository.save(any(ReviewFeedback.class))).thenReturn(new ReviewFeedback());

        ResourceReviewDetailResponse response =
                reviewService.archiveResource(1L, 1L, "No longer relevant.");

        assertEquals(ResourceStatus.ARCHIVED, response.getStatus());
        verify(resourceRepository).updateStatusWithReason(
                eq(1L), eq(ResourceStatus.ARCHIVED), any(), any());
    }

    @Test
    void archiveResource_fromUnpublished_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(resourceRepository.findById(1L))
                .thenReturn(Optional.of(unpublishedResource))
                .thenReturn(Optional.of(makeResource(ResourceStatus.ARCHIVED)));
        when(resourceRepository.updateStatusWithReason(
                eq(1L), eq(ResourceStatus.ARCHIVED), any(), any())).thenReturn(1);
        when(resourceRepository.updateReviewFeedback(eq(1L), any(), any())).thenReturn(1);
        when(reviewFeedbackRepository.save(any(ReviewFeedback.class))).thenReturn(new ReviewFeedback());

        ResourceReviewDetailResponse response =
                reviewService.archiveResource(1L, 1L, "Superseded by new entry.");

        assertEquals(ResourceStatus.ARCHIVED, response.getStatus());
    }

    @Test
    void archiveResource_wrongStatus_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(rejectedResource));

        assertThrows(IllegalArgumentException.class,
                () -> reviewService.archiveResource(1L, 1L, "reason"));
        verify(resourceRepository, never()).updateStatusWithReason(any(), any(), any(), any());
    }

    // republishResource

    @Test
    void republishResource_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(resourceRepository.findById(1L))
                .thenReturn(Optional.of(unpublishedResource))
                .thenReturn(Optional.of(makeResource(ResourceStatus.APPROVED)));
        when(resourceRepository.updateStatus(eq(1L), eq(ResourceStatus.APPROVED), any())).thenReturn(1);
        when(reviewFeedbackRepository.save(any(ReviewFeedback.class))).thenReturn(new ReviewFeedback());

        ResourceReviewDetailResponse response =
                reviewService.republishResource(1L, 1L, "Revised and re-approved.");

        assertEquals(ResourceStatus.APPROVED, response.getStatus());
        verify(resourceRepository).updateStatus(eq(1L), eq(ResourceStatus.APPROVED), any());
    }

    // getResourceDetail

    @Test
    void getResourceDetail_rejectedByNonContributor_throws() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(rejectedResource));
        when(userRepository.findById(3L)).thenReturn(Optional.of(anotherUser));

        assertThrows(UnauthorizedException.class,
                () -> reviewService.getResourceDetail(1L, 3L));
    }

    @Test
    void getResourceDetail_rejectedByContributor_ok() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(rejectedResource));

        ResourceReviewDetailResponse response =
                reviewService.getResourceDetail(1L, 2L);

        assertNotNull(response);
        assertEquals(ResourceStatus.REJECTED, response.getStatus());
    }
}
