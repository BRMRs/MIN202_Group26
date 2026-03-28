package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.ResourceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Resource Repository — shared across modules B, C, D, E.
 * IMPORTANT: This is the ONLY ResourceRepository in the project.
 */
@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    // PBI 3.2 — Task: Optimize status update performance (target < 1s)
    // Direct UPDATE avoids loading the full entity before saving.
    @Modifying
    @Query("UPDATE Resource r SET r.status = :status, r.updatedAt = :updatedAt WHERE r.id = :id")
    int updateStatus(@Param("id") Long id,
                     @Param("status") ResourceStatus status,
                     @Param("updatedAt") LocalDateTime updatedAt);

    // PBI 3.2 — Task: Optimize archive with reason
    @Modifying
    @Query("UPDATE Resource r SET r.status = :status, r.archiveReason = :reason, r.updatedAt = :updatedAt WHERE r.id = :id")
    int updateStatusWithReason(@Param("id") Long id,
                               @Param("status") ResourceStatus status,
                               @Param("reason") String reason,
                               @Param("updatedAt") LocalDateTime updatedAt);

    // PBI 3.2 — Task: Ensure Approved content visibility in discovery/search (used by Module D)
    Page<Resource> findByStatus(ResourceStatus status, Pageable pageable);
    List<Resource> findByStatus(ResourceStatus status);

    // General filtering queries (used by Module C dashboard and Module D)
    List<Resource> findByContributorId(Long contributorId);
    Page<Resource> findByCategoryId(Long categoryId, Pageable pageable);
    Page<Resource> findByStatusAndCategoryId(ResourceStatus status, Long categoryId, Pageable pageable);
    Page<Resource> findByStatusAndContributorId(ResourceStatus status, Long contributorId, Pageable pageable);

    // PBI 3.2 — Task: Restrict rejected items to contributor-only access
    List<Resource> findByContributorIdAndStatus(Long contributorId, ResourceStatus status);
}
