package com.group26.heritage.common.repository;

import com.group26.heritage.entity.ContributorApplication;
import com.group26.heritage.entity.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ContributorApplication Repository — used by Module A.
 * IMPORTANT: This is the ONLY ContributorApplicationRepository in the project.
 */
@Repository
public interface ContributorApplicationRepository extends JpaRepository<ContributorApplication, Long> {
    Optional<ContributorApplication> findByUserId(Long userId);
    List<ContributorApplication> findByStatus(ApplicationStatus status);
    boolean existsByUserIdAndStatus(Long userId, ApplicationStatus status);
}
