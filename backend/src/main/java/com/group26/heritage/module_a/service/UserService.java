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
import com.group26.heritage.module_a.dto.ContributorApplicationListResponse;
import com.group26.heritage.module_a.dto.ContributorApplicationDetailResponse;
import com.group26.heritage.module_a.dto.ProfileUpdateRequest;
import com.group26.heritage.module_a.dto.UserProfileResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class UserService {

    private static final int APPLICATION_REASON_MAX_LENGTH = 2000;
    private static final int REJECT_REASON_MAX_LENGTH = 1000;
    private static final int MAX_EVIDENCE_FILES = 5;
    private static final long MAX_EVIDENCE_FILE_BYTES = 50L * 1024 * 1024;
    private static final long MAX_AVATAR_FILE_BYTES = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_AVATAR_FILE_EXTENSIONS = List.of(
            ".png", ".jpg", ".jpeg", ".webp", ".gif"
    );
    private static final List<String> ALLOWED_EVIDENCE_FILE_EXTENSIONS = List.of(
            ".docx", ".pdf", ".txt",
            ".png", ".jpg", ".jpeg",
            ".mov", ".mp4", ".mp3"
    );

    private final UserRepository userRepository;
    private final ContributorApplicationRepository applicationRepository;
    private final ContributorApplicationFileRepository applicationFileRepository;
    private final EmailVerificationService emailVerificationService;
    private final Path uploadDir;

    @PersistenceContext
    private EntityManager entityManager;

    public UserService(UserRepository userRepository,
                       ContributorApplicationRepository applicationRepository,
                       ContributorApplicationFileRepository applicationFileRepository,
                       EmailVerificationService emailVerificationService,
                       @Value("${app.upload-dir}") String uploadDir) throws IOException {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.applicationFileRepository = applicationFileRepository;
        this.emailVerificationService = emailVerificationService;
        this.uploadDir = Paths.get(uploadDir);
        Files.createDirectories(this.uploadDir);
    }

    public UserProfileResponse getProfileWithStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get the latest application status
        Optional<ContributorApplication> latestApp = applicationRepository.findFirstByUserIdOrderByAppliedAtDesc(userId);
        ApplicationStatus appStatus = latestApp.map(ContributorApplication::getStatus).orElse(null);
        LocalDateTime reviewedAt = latestApp.map(ContributorApplication::getReviewedAt).orElse(null);
        String rejectReason = latestApp.map(ContributorApplication::getRejectReason).orElse(null);

        return UserProfileResponse.fromUser(user, appStatus, reviewedAt, rejectReason);
    }

    @Transactional
    public User updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new IllegalArgumentException("Username already exists");
            }
            user.setUsername(request.getUsername());
        }
        if (request.getBio() != null) {
            if (request.getBio().length() > 50) {
                throw new IllegalArgumentException("Bio must not exceed 50 characters");
            }
            user.setBio(request.getBio());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        return userRepository.save(user);
    }

    @Transactional
    public String uploadAvatar(Long userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Avatar file is required");
        }
        if (file.getSize() > MAX_AVATAR_FILE_BYTES) {
            throw new IllegalArgumentException("Avatar image must not exceed 5MB.");
        }
        String originalName = Objects.requireNonNull(file.getOriginalFilename());
        validateAvatarFileType(originalName);

        String safeName = System.currentTimeMillis() + "_avatar_" + userId + "_" + originalName.replace(" ", "_");
        Path target = uploadDir.resolve(safeName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String avatarUrl = "/uploads/" + safeName;
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        return avatarUrl;
    }

    @Transactional
    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        executeNativeUpdateIfTableExists("DELETE FROM reports WHERE created_by = :userId", userId);

        executeNativeUpdate("DELETE FROM contributor_application_files WHERE application_id IN " +
                "(SELECT id FROM contributor_applications WHERE user_id = :userId)", userId);
        executeNativeUpdate("DELETE FROM contributor_applications WHERE user_id = :userId", userId);
        executeNativeUpdate("UPDATE contributor_applications SET admin_id = NULL WHERE admin_id = :userId", userId);

        executeNativeUpdate("DELETE FROM likes WHERE user_id = :userId", userId);
        executeNativeUpdate("DELETE FROM comments WHERE user_id = :userId", userId);
        executeNativeUpdate("DELETE FROM review_feedback WHERE reviewer_id = :userId", userId);

        executeNativeUpdateIfTableExists("DELETE FROM resource_tags WHERE resource_id IN " +
                "(SELECT id FROM resources WHERE contributor_id = :userId)", userId);
        executeNativeUpdate("DELETE FROM likes WHERE resource_id IN " +
                "(SELECT id FROM resources WHERE contributor_id = :userId)", userId);
        executeNativeUpdate("DELETE FROM comments WHERE resource_id IN " +
                "(SELECT id FROM resources WHERE contributor_id = :userId)", userId);
        executeNativeUpdate("DELETE FROM review_feedback WHERE resource_id IN " +
                "(SELECT id FROM resources WHERE contributor_id = :userId)", userId);
        executeNativeUpdate("DELETE FROM resource_media WHERE resource_id IN " +
                "(SELECT id FROM resources WHERE contributor_id = :userId)", userId);
        executeNativeUpdate("DELETE FROM resources WHERE contributor_id = :userId", userId);

        userRepository.delete(user);
    }

    @Transactional
    public ContributorApplication applyForContributor(Long userId, String reason, List<MultipartFile> files) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() != UserRole.VIEWER) {
            throw new IllegalArgumentException("Only VIEWER can apply for contributor role");
        }
        if (applicationRepository.existsByUserIdAndStatus(userId, ApplicationStatus.PENDING)) {
            throw new IllegalArgumentException("Application already pending");
        }
        ContributorApplication application = new ContributorApplication();
        application.setUserId(userId);
        application.setStatus(ApplicationStatus.PENDING);
        application.setAppliedAt(LocalDateTime.now());
        application.setReason(cleanReason(reason, APPLICATION_REASON_MAX_LENGTH, "Reason"));
        ContributorApplication saved = applicationRepository.save(application);
        saveEvidenceFiles(saved.getId(), files);
        return saved;
    }

    public List<ContributorApplicationListResponse> getApplicationsList() {
        List<ContributorApplication> apps = applicationRepository.findAllByOrderByAppliedAtDesc();
        return apps.stream().map(app -> {
            ContributorApplicationListResponse dto = new ContributorApplicationListResponse();
            dto.setId(app.getId());
            dto.setUserId(app.getUserId());
            dto.setStatus(app.getStatus());
            dto.setAppliedAt(app.getAppliedAt());
            userRepository.findById(app.getUserId()).ifPresent(u -> dto.setUsername(u.getUsername()));
            return dto;
        }).toList();
    }

    public ContributorApplicationDetailResponse getApplicationDetail(Long applicationId) {
        ContributorApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        User applicant = userRepository.findById(app.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Applicant not found"));
        List<ContributorApplicationFile> files = applicationFileRepository.findByApplicationIdOrderBySortOrderAsc(applicationId);

        ContributorApplicationDetailResponse detail = new ContributorApplicationDetailResponse();
        detail.setId(app.getId());
        detail.setUserId(app.getUserId());
        detail.setUsername(applicant.getUsername());
        detail.setEmail(applicant.getEmail());
        detail.setStatus(app.getStatus());
        detail.setReason(app.getReason());
        detail.setRejectReason(app.getRejectReason());
        detail.setAppliedAt(app.getAppliedAt());
        detail.setReviewedAt(app.getReviewedAt());
        detail.setAdminId(app.getAdminId());
        detail.setFiles(files.stream().map(this::toFileDto).toList());
        return detail;
    }

    @Transactional
    public void approveApplication(Long applicationId, Long adminId) {
        ContributorApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        ensurePending(app);
        User user = userRepository.findById(app.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(UserRole.CONTRIBUTOR);
        userRepository.save(user);
        app.setStatus(ApplicationStatus.APPROVED);
        app.setReviewedAt(LocalDateTime.now());
        app.setAdminId(adminId);
        app.setRejectReason(null);
        applicationRepository.save(app);
        emailVerificationService.sendApplicationApprovedEmail(user.getEmail());
    }

    @Transactional
    public void rejectApplication(Long applicationId, Long adminId, String rejectReason) {
        ContributorApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        ensurePending(app);
        User user = userRepository.findById(app.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        app.setStatus(ApplicationStatus.REJECTED);
        app.setReviewedAt(LocalDateTime.now());
        app.setAdminId(adminId);
        app.setRejectReason(cleanReason(rejectReason, REJECT_REASON_MAX_LENGTH, "Reject reason"));
        applicationRepository.save(app);
        emailVerificationService.sendApplicationRejectedEmail(user.getEmail());
    }

    private void saveEvidenceFiles(Long applicationId, List<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty()) return;
        List<MultipartFile> nonEmptyFiles = files.stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();
        if (nonEmptyFiles.size() > MAX_EVIDENCE_FILES) {
            throw new IllegalArgumentException("You can upload up to " + MAX_EVIDENCE_FILES + " evidence files.");
        }
        int sortOrder = 1;
        for (MultipartFile file : nonEmptyFiles) {
            if (file.getSize() > MAX_EVIDENCE_FILE_BYTES) {
                throw new IllegalArgumentException("Each evidence file must not exceed 50MB.");
            }
            String originalName = Objects.requireNonNull(file.getOriginalFilename());
            validateEvidenceFileType(originalName);
            String safeName = System.currentTimeMillis() + "_application_" + applicationId + "_" + originalName.replace(" ", "_");
            Path target = uploadDir.resolve(safeName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            ContributorApplicationFile evidence = new ContributorApplicationFile();
            evidence.setApplicationId(applicationId);
            evidence.setFileUrl("/uploads/" + safeName);
            evidence.setFileName(originalName);
            evidence.setFileSize(file.getSize());
            evidence.setMimeType(file.getContentType());
            evidence.setSortOrder(sortOrder++);
            evidence.setUploadedAt(LocalDateTime.now());
            applicationFileRepository.save(evidence);
        }
    }

    private String cleanReason(String value, int maxLength, String label) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(label + " is required");
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new IllegalArgumentException(label + " must not exceed " + maxLength + " characters");
        }
        return trimmed;
    }

    private void ensurePending(ContributorApplication app) {
        if (app.getStatus() != ApplicationStatus.PENDING) {
            throw new IllegalStateException("Only pending applications can be reviewed");
        }
    }

    private void validateEvidenceFileType(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        boolean allowed = ALLOWED_EVIDENCE_FILE_EXTENSIONS.stream().anyMatch(lower::endsWith);
        if (!allowed) {
            throw new IllegalStateException("Evidence files support docx, pdf, txt, png, jpg, jpeg, mov, mp4, and mp3 only");
        }
    }

    private void validateAvatarFileType(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        boolean allowed = ALLOWED_AVATAR_FILE_EXTENSIONS.stream().anyMatch(lower::endsWith);
        if (!allowed) {
            throw new IllegalArgumentException("Avatar image must be png, jpg, jpeg, webp, or gif.");
        }
    }

    private ContributorApplicationDetailResponse.FileDto toFileDto(ContributorApplicationFile file) {
        ContributorApplicationDetailResponse.FileDto dto = new ContributorApplicationDetailResponse.FileDto();
        dto.setId(file.getId());
        dto.setFileUrl(file.getFileUrl());
        dto.setFileName(file.getFileName());
        dto.setFileSize(file.getFileSize());
        dto.setMimeType(file.getMimeType());
        dto.setSortOrder(file.getSortOrder());
        dto.setUploadedAt(file.getUploadedAt());
        return dto;
    }

    private int executeNativeUpdate(String sql, Long userId) {
        return entityManager.createNativeQuery(sql)
                .setParameter("userId", userId)
                .executeUpdate();
    }

    private void executeNativeUpdateIfTableExists(String sql, Long userId) {
        try {
            executeNativeUpdate(sql, userId);
        } catch (RuntimeException ignored) {
            // Some test schemas are generated from JPA entities and do not include helper tables
            // such as reports or resource_tags. Production init.sql creates them.
        }
    }
}
