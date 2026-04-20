package com.group26.heritage.module_a.service;

import com.group26.heritage.common.exception.ResourceNotFoundException;
import com.group26.heritage.common.repository.ContributorApplicationRepository;
import com.group26.heritage.common.repository.UserRepository;
import com.group26.heritage.entity.ContributorApplication;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.ApplicationStatus;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_a.dto.ProfileUpdateRequest;
import com.group26.heritage.module_a.dto.UserProfileResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ContributorApplicationRepository applicationRepository;
    private final EmailService emailService;

    public UserService(UserRepository userRepository,
                       ContributorApplicationRepository applicationRepository,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.emailService = emailService;
    }

    public UserProfileResponse getProfileWithStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get the latest application status
        Optional<ContributorApplication> latestApp = applicationRepository.findByUserId(userId);
        ApplicationStatus appStatus = latestApp.map(ContributorApplication::getStatus).orElse(null);
        LocalDateTime reviewedAt = latestApp.map(ContributorApplication::getReviewedAt).orElse(null);

        return UserProfileResponse.fromUser(user, appStatus, reviewedAt);
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
    public ContributorApplication applyForContributor(Long userId, String reason) {
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
        application.setReason(reason);
        return applicationRepository.save(application);
    }

    public List<ContributorApplication> getPendingApplications() {
        return applicationRepository.findByStatus(ApplicationStatus.PENDING);
    }

    @Transactional
    public void approveApplication(Long applicationId, Long adminId) {
        ContributorApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        User user = userRepository.findById(app.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(UserRole.CONTRIBUTOR);
        userRepository.save(user);
        app.setStatus(ApplicationStatus.APPROVED);
        app.setReviewedAt(LocalDateTime.now());
        app.setAdminId(adminId);
        applicationRepository.save(app);
        emailService.sendApprovalEmail(user.getEmail(), user.getUsername());
    }

    @Transactional
    public void rejectApplication(Long applicationId, Long adminId) {
        ContributorApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        User user = userRepository.findById(app.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        app.setStatus(ApplicationStatus.REJECTED);
        app.setReviewedAt(LocalDateTime.now());
        app.setAdminId(adminId);
        applicationRepository.save(app);
        emailService.sendRejectionEmail(user.getEmail(), user.getUsername());
    }
}
