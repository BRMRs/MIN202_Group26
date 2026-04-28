package com.group26.heritage.module_a.service;

import com.group26.heritage.common.exception.ResourceNotFoundException;
import com.group26.heritage.common.repository.ContributorApplicationFileRepository;
import com.group26.heritage.common.repository.ContributorApplicationRepository;
import com.group26.heritage.common.repository.UserRepository;
import com.group26.heritage.entity.ContributorApplication;
import com.group26.heritage.entity.ContributorApplicationFile;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.ApplicationStatus;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_a.dto.ContributorApplicationDetailResponse;
import com.group26.heritage.module_a.dto.ContributorApplicationListResponse;
import com.group26.heritage.module_a.dto.ProfileUpdateRequest;
import com.group26.heritage.module_a.dto.UserProfileResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private ContributorApplicationRepository applicationRepository;
    @Mock private ContributorApplicationFileRepository applicationFileRepository;
    @Mock private EmailVerificationService emailVerificationService;

    @TempDir
    Path tempDir;

    private UserService userService;

    private User viewerUser;
    private User adminUser;

    @BeforeEach
    void setUp() throws IOException {
        userService = new UserService(
                userRepository,
                applicationRepository,
                applicationFileRepository,
                emailVerificationService,
                tempDir.toString()
        );

        viewerUser = new User();
        viewerUser.setId(1L);
        viewerUser.setUsername("viewer");
        viewerUser.setEmail("viewer@example.com");
        viewerUser.setRole(UserRole.VIEWER);

        adminUser = new User();
        adminUser.setId(99L);
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(UserRole.ADMIN);
    }

    // ─── getProfileWithStatus ─────────────────────────────────────────────────

    @Test
    @DisplayName("getProfileWithStatus - should return profile with no application status when no application exists")
    void getProfileWithStatus_ShouldReturnProfile_WhenNoApplicationExists() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationRepository.findFirstByUserIdOrderByAppliedAtDesc(1L)).thenReturn(Optional.empty());

        // Act
        UserProfileResponse response = userService.getProfileWithStatus(1L);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getUsername()).isEqualTo("viewer");
        assertThat(response.getEmail()).isEqualTo("viewer@example.com");
        assertThat(response.getApplicationStatus()).isNull();
        assertThat(response.getApplicationReviewedAt()).isNull();
        assertThat(response.getApplicationRejectReason()).isNull();
    }

    @Test
    @DisplayName("getProfileWithStatus - should include reject reason when application is rejected")
    void getProfileWithStatus_ShouldIncludeRejectReason_WhenApplicationIsRejected() {
        // Arrange
        ContributorApplication app = new ContributorApplication();
        app.setStatus(ApplicationStatus.REJECTED);
        app.setRejectReason("Insufficient evidence");
        app.setReviewedAt(LocalDateTime.now());

        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationRepository.findFirstByUserIdOrderByAppliedAtDesc(1L)).thenReturn(Optional.of(app));

        // Act
        UserProfileResponse response = userService.getProfileWithStatus(1L);

        // Assert
        assertThat(response.getApplicationStatus()).isEqualTo(ApplicationStatus.REJECTED);
        assertThat(response.getApplicationRejectReason()).isEqualTo("Insufficient evidence");
        assertThat(response.getApplicationReviewedAt()).isNotNull();
    }

    @Test
    @DisplayName("getProfileWithStatus - should throw ResourceNotFoundException when user not found")
    void getProfileWithStatus_ShouldThrow_WhenUserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.getProfileWithStatus(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    // ─── updateProfile ────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateProfile - should update username when new username is available")
    void updateProfile_ShouldUpdateUsername_WhenNewUsernameIsAvailable() {
        // Arrange
        ProfileUpdateRequest req = new ProfileUpdateRequest();
        req.setUsername("newname");

        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(userRepository.existsByUsername("newname")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        User result = userService.updateProfile(1L, req);

        // Assert
        assertThat(result.getUsername()).isEqualTo("newname");
    }

    @Test
    @DisplayName("updateProfile - should throw when new username is already taken")
    void updateProfile_ShouldThrow_WhenUsernameAlreadyTaken() {
        // Arrange
        ProfileUpdateRequest req = new ProfileUpdateRequest();
        req.setUsername("takenname");

        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(userRepository.existsByUsername("takenname")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userService.updateProfile(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username already exists");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateProfile - should throw when bio exceeds 50 characters")
    void updateProfile_ShouldThrow_WhenBioExceeds50Chars() {
        // Arrange
        ProfileUpdateRequest req = new ProfileUpdateRequest();
        req.setBio("A".repeat(51));

        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));

        // Act & Assert
        assertThatThrownBy(() -> userService.updateProfile(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Bio must not exceed 50 characters");
    }

    @Test
    @DisplayName("updateProfile - should not change username when same username is submitted")
    void updateProfile_ShouldNotChangeUsername_WhenSameUsernameSubmitted() {
        // Arrange
        ProfileUpdateRequest req = new ProfileUpdateRequest();
        req.setUsername("viewer"); // same as current

        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        User result = userService.updateProfile(1L, req);

        // Assert — existsByUsername should NOT be called for same username
        verify(userRepository, never()).existsByUsername(any());
        assertThat(result.getUsername()).isEqualTo("viewer");
    }

    @Test
    @DisplayName("updateProfile - should throw ResourceNotFoundException when user not found")
    void updateProfile_ShouldThrow_WhenUserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.updateProfile(999L, new ProfileUpdateRequest()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── applyForContributor ──────────────────────────────────────────────────

    @Test
    @DisplayName("applyForContributor - should create PENDING application for VIEWER user")
    void applyForContributor_ShouldCreatePendingApplication_ForViewerUser() throws IOException {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationRepository.existsByUserIdAndStatus(1L, ApplicationStatus.PENDING)).thenReturn(false);
        ContributorApplication saved = new ContributorApplication();
        saved.setId(10L);
        saved.setUserId(1L);
        saved.setStatus(ApplicationStatus.PENDING);
        when(applicationRepository.save(any(ContributorApplication.class))).thenReturn(saved);

        // Act
        ContributorApplication result = userService.applyForContributor(1L, "I want to contribute", null);

        // Assert
        assertThat(result.getStatus()).isEqualTo(ApplicationStatus.PENDING);
        assertThat(result.getUserId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("applyForContributor - should throw when user already has a PENDING application")
    void applyForContributor_ShouldThrow_WhenPendingApplicationAlreadyExists() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationRepository.existsByUserIdAndStatus(1L, ApplicationStatus.PENDING)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userService.applyForContributor(1L, "reason", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Application already pending");
    }

    @Test
    @DisplayName("applyForContributor - should throw when user is not a VIEWER")
    void applyForContributor_ShouldThrow_WhenUserIsNotViewer() {
        // Arrange
        User contributor = new User();
        contributor.setId(2L);
        contributor.setRole(UserRole.CONTRIBUTOR);
        when(userRepository.findById(2L)).thenReturn(Optional.of(contributor));

        // Act & Assert
        assertThatThrownBy(() -> userService.applyForContributor(2L, "reason", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only VIEWER can apply");
    }

    @Test
    @DisplayName("applyForContributor - should throw when reason is blank")
    void applyForContributor_ShouldThrow_WhenReasonIsBlank() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationRepository.existsByUserIdAndStatus(1L, ApplicationStatus.PENDING)).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> userService.applyForContributor(1L, "   ", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Reason is required");
    }

    @Test
    @DisplayName("applyForContributor - should throw when reason exceeds 2000 characters")
    void applyForContributor_ShouldThrow_WhenReasonExceedsMaxLength() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationRepository.existsByUserIdAndStatus(1L, ApplicationStatus.PENDING)).thenReturn(false);

        // Act & Assert
        assertThatThrownBy(() -> userService.applyForContributor(1L, "A".repeat(2001), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must not exceed 2000 characters");
    }

    @Test
    @DisplayName("applyForContributor - should save evidence file when valid file is provided")
    void applyForContributor_ShouldSaveEvidenceFile_WhenValidFileProvided() throws IOException {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationRepository.existsByUserIdAndStatus(1L, ApplicationStatus.PENDING)).thenReturn(false);
        ContributorApplication saved = new ContributorApplication();
        saved.setId(10L);
        saved.setUserId(1L);
        saved.setStatus(ApplicationStatus.PENDING);
        when(applicationRepository.save(any())).thenReturn(saved);
        when(applicationFileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MockMultipartFile file = new MockMultipartFile(
                "files", "evidence.pdf", "application/pdf", "pdf content".getBytes());

        // Act
        userService.applyForContributor(1L, "I want to contribute", List.of(file));

        // Assert
        verify(applicationFileRepository).save(any(ContributorApplicationFile.class));
    }

    @Test
    @DisplayName("applyForContributor - should throw when file type is not allowed")
    void applyForContributor_ShouldThrow_WhenFileTypeIsNotAllowed() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationRepository.existsByUserIdAndStatus(1L, ApplicationStatus.PENDING)).thenReturn(false);
        ContributorApplication saved = new ContributorApplication();
        saved.setId(10L);
        when(applicationRepository.save(any())).thenReturn(saved);

        MockMultipartFile file = new MockMultipartFile(
                "files", "malware.exe", "application/octet-stream", "binary".getBytes());

        // Act & Assert
        assertThatThrownBy(() -> userService.applyForContributor(1L, "reason", List.of(file)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Evidence files support");
    }

    @Test
    @DisplayName("applyForContributor - should throw when more than 5 files are uploaded")
    void applyForContributor_ShouldThrow_WhenMoreThanFiveFilesUploaded() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationRepository.existsByUserIdAndStatus(1L, ApplicationStatus.PENDING)).thenReturn(false);
        ContributorApplication saved = new ContributorApplication();
        saved.setId(10L);
        when(applicationRepository.save(any())).thenReturn(saved);

        List<MultipartFile> files = java.util.stream.IntStream.rangeClosed(1, 6)
                .mapToObj(i -> (MultipartFile) new MockMultipartFile(
                        "files", "file" + i + ".pdf", "application/pdf", ("content" + i).getBytes()))
                .toList();

        // Act & Assert
        assertThatThrownBy(() -> userService.applyForContributor(1L, "reason", files))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("up to 5");
    }

    // ─── getApplicationsList ──────────────────────────────────────────────────

    @Test
    @DisplayName("getApplicationsList - should return list of all applications ordered by date desc")
    void getApplicationsList_ShouldReturnAllApplications() {
        // Arrange
        ContributorApplication app = new ContributorApplication();
        app.setId(1L);
        app.setUserId(1L);
        app.setStatus(ApplicationStatus.PENDING);
        app.setAppliedAt(LocalDateTime.now());

        when(applicationRepository.findAllByOrderByAppliedAtDesc()).thenReturn(List.of(app));
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));

        // Act
        List<ContributorApplicationListResponse> result = userService.getApplicationsList();

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(ApplicationStatus.PENDING);
        assertThat(result.get(0).getUsername()).isEqualTo("viewer");
    }

    // ─── getApplicationDetail ─────────────────────────────────────────────────

    @Test
    @DisplayName("getApplicationDetail - should return full detail including files")
    void getApplicationDetail_ShouldReturnFullDetail_IncludingFiles() {
        // Arrange
        ContributorApplication app = new ContributorApplication();
        app.setId(5L);
        app.setUserId(1L);
        app.setStatus(ApplicationStatus.PENDING);
        app.setReason("I want to contribute");
        app.setAppliedAt(LocalDateTime.now());

        ContributorApplicationFile file = new ContributorApplicationFile();
        file.setId(1L);
        file.setFileName("evidence.pdf");
        file.setFileUrl("/uploads/evidence.pdf");
        file.setSortOrder(1);

        when(applicationRepository.findById(5L)).thenReturn(Optional.of(app));
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationFileRepository.findByApplicationIdOrderBySortOrderAsc(5L)).thenReturn(List.of(file));

        // Act
        ContributorApplicationDetailResponse detail = userService.getApplicationDetail(5L);

        // Assert
        assertThat(detail.getId()).isEqualTo(5L);
        assertThat(detail.getUsername()).isEqualTo("viewer");
        assertThat(detail.getEmail()).isEqualTo("viewer@example.com");
        assertThat(detail.getReason()).isEqualTo("I want to contribute");
        assertThat(detail.getFiles()).hasSize(1);
        assertThat(detail.getFiles().get(0).getFileName()).isEqualTo("evidence.pdf");
    }

    @Test
    @DisplayName("getApplicationDetail - should throw when application not found")
    void getApplicationDetail_ShouldThrow_WhenApplicationNotFound() {
        when(applicationRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.getApplicationDetail(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Application not found");
    }

    // ─── approveApplication ───────────────────────────────────────────────────

    @Test
    @DisplayName("approveApplication - should set status APPROVED and upgrade user role to CONTRIBUTOR")
    void approveApplication_ShouldApproveAndUpgradeRole() {
        // Arrange
        ContributorApplication app = new ContributorApplication();
        app.setId(5L);
        app.setUserId(1L);
        app.setStatus(ApplicationStatus.PENDING);

        when(applicationRepository.findById(5L)).thenReturn(Optional.of(app));
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(applicationRepository.save(any(ContributorApplication.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        userService.approveApplication(5L, 99L);

        // Assert
        assertThat(viewerUser.getRole()).isEqualTo(UserRole.CONTRIBUTOR);
        assertThat(app.getStatus()).isEqualTo(ApplicationStatus.APPROVED);
        assertThat(app.getAdminId()).isEqualTo(99L);
        assertThat(app.getReviewedAt()).isNotNull();
        assertThat(app.getRejectReason()).isNull();
        verify(emailVerificationService).sendApplicationApprovedEmail("viewer@example.com");
    }

    @Test
    @DisplayName("approveApplication - should throw when application is not PENDING")
    void approveApplication_ShouldThrow_WhenApplicationIsNotPending() {
        // Arrange
        ContributorApplication app = new ContributorApplication();
        app.setId(5L);
        app.setStatus(ApplicationStatus.APPROVED); // already reviewed

        when(applicationRepository.findById(5L)).thenReturn(Optional.of(app));

        // Act & Assert
        assertThatThrownBy(() -> userService.approveApplication(5L, 99L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only pending applications can be reviewed");
    }

    @Test
    @DisplayName("approveApplication - should throw when application not found")
    void approveApplication_ShouldThrow_WhenApplicationNotFound() {
        when(applicationRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.approveApplication(999L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── rejectApplication ────────────────────────────────────────────────────

    @Test
    @DisplayName("rejectApplication - should set status REJECTED with reason")
    void rejectApplication_ShouldRejectWithReason() {
        // Arrange
        ContributorApplication app = new ContributorApplication();
        app.setId(5L);
        app.setUserId(1L);
        app.setStatus(ApplicationStatus.PENDING);

        when(applicationRepository.findById(5L)).thenReturn(Optional.of(app));
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Act
        userService.rejectApplication(5L, 99L, "Insufficient evidence");

        // Assert
        assertThat(app.getStatus()).isEqualTo(ApplicationStatus.REJECTED);
        assertThat(app.getRejectReason()).isEqualTo("Insufficient evidence");
        assertThat(app.getAdminId()).isEqualTo(99L);
        assertThat(app.getReviewedAt()).isNotNull();
        verify(emailVerificationService).sendApplicationRejectedEmail("viewer@example.com");
    }

    @Test
    @DisplayName("rejectApplication - should throw when reject reason is blank")
    void rejectApplication_ShouldThrow_WhenRejectReasonIsBlank() {
        // Arrange
        ContributorApplication app = new ContributorApplication();
        app.setId(5L);
        app.setUserId(1L);
        app.setStatus(ApplicationStatus.PENDING);

        when(applicationRepository.findById(5L)).thenReturn(Optional.of(app));
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));

        // Act & Assert
        assertThatThrownBy(() -> userService.rejectApplication(5L, 99L, "   "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Reject reason is required");
    }

    @Test
    @DisplayName("rejectApplication - should throw when reject reason exceeds 1000 characters")
    void rejectApplication_ShouldThrow_WhenRejectReasonExceedsMaxLength() {
        // Arrange
        ContributorApplication app = new ContributorApplication();
        app.setId(5L);
        app.setUserId(1L);
        app.setStatus(ApplicationStatus.PENDING);

        when(applicationRepository.findById(5L)).thenReturn(Optional.of(app));
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));

        // Act & Assert
        assertThatThrownBy(() -> userService.rejectApplication(5L, 99L, "A".repeat(1001)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("must not exceed 1000 characters");
    }

    @Test
    @DisplayName("rejectApplication - should throw when application is not PENDING")
    void rejectApplication_ShouldThrow_WhenApplicationIsNotPending() {
        // Arrange
        ContributorApplication app = new ContributorApplication();
        app.setId(5L);
        app.setStatus(ApplicationStatus.REJECTED); // already reviewed

        when(applicationRepository.findById(5L)).thenReturn(Optional.of(app));

        // Act & Assert
        assertThatThrownBy(() -> userService.rejectApplication(5L, 99L, "reason"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Only pending applications can be reviewed");
    }

    @Test
    @DisplayName("rejectApplication - should not change user role when rejecting")
    void rejectApplication_ShouldNotChangeUserRole_WhenRejecting() {
        // Arrange
        ContributorApplication app = new ContributorApplication();
        app.setId(5L);
        app.setUserId(1L);
        app.setStatus(ApplicationStatus.PENDING);

        when(applicationRepository.findById(5L)).thenReturn(Optional.of(app));
        when(userRepository.findById(1L)).thenReturn(Optional.of(viewerUser));
        when(applicationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Act
        userService.rejectApplication(5L, 99L, "Not enough info");

        // Assert — user role stays VIEWER
        assertThat(viewerUser.getRole()).isEqualTo(UserRole.VIEWER);
        verify(userRepository, never()).save(any());
    }
}
