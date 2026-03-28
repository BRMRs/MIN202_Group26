package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.ResourceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Modifying
    @Query("""
        update Resource resource
           set resource.status = :targetStatus,
               resource.updatedAt = CURRENT_TIMESTAMP
         where resource.categoryId = :categoryId
           and resource.status = :sourceStatus
        """)
    int updateStatusByCategoryIdAndStatus(@Param("categoryId") Long categoryId,
                                          @Param("sourceStatus") ResourceStatus sourceStatus,
                                          @Param("targetStatus") ResourceStatus targetStatus);

    List<Resource> findByCategoryId(Long categoryId);
}
