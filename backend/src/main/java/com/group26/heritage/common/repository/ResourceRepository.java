package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.ResourceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Resource Repository — shared across modules B, C, D, E.
 * IMPORTANT: This is the ONLY ResourceRepository in the project.
 */
@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    // TODO: List<Resource> findByStatus(ResourceStatus status);
    // TODO: List<Resource> findByContributorId(Long contributorId);
    // TODO: Page<Resource> findByStatus(ResourceStatus status, Pageable pageable);
    // TODO: @Query search by title or description containing keyword
}
