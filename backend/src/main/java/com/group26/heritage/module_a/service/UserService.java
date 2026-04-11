package com.group26.heritage.module_a.service;

import com.group26.heritage.common.exception.ResourceNotFoundException;
import com.group26.heritage.common.repository.ContributorApplicationRepository;
import com.group26.heritage.common.repository.UserRepository;
import com.group26.heritage.entity.ContributorApplication;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.ApplicationStatus;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_a.dto.ProfileUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ContributorApplicationRepository applicationRepository;

    public UserService(UserRepository userRepository,
                       ContributorApplicationRepository applicationRepository) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
    }

    public User getProfile(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public User updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = getProfile(userId);
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
        User user = getProfile(userId);
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
        User user = getProfile(app.getUserId());
        user.setRole(UserRole.CONTRIBUTOR);
        userRepository.save(user);
        app.setStatus(ApplicationStatus.APPROVED);
        app.setReviewedAt(LocalDateTime.now());
        app.setAdminId(adminId);
        applicationRepository.save(app);
    }

    @Transactional
    public void rejectApplication(Long applicationId, Long adminId) {
        ContributorApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        app.setStatus(ApplicationStatus.REJECTED);
        app.setReviewedAt(LocalDateTime.now());
        app.setAdminId(adminId);
        applicationRepository.save(app);
    }
}
