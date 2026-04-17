package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_e.dto.CategoryDashboardRow;
import com.group26.heritage.module_e.dto.ContributorDashboardRow;
import com.group26.heritage.module_e.dto.StatusDashboardRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    
    List<Resource> findByContributorIdOrderByUpdatedAtDesc(Long contributorId);
    
    List<Resource> findByContributorIdAndStatusInOrderByUpdatedAtDesc(Long contributorId, List<ResourceStatus> statuses);
    
    List<Resource> findByStatusOrderByUpdatedAtDesc(ResourceStatus status);
    
    List<Resource> findByCategoryId(Long categoryId);

    List<Resource> findByCategoryIdOrderByIdAsc(Long categoryId);

    long countByCategoryId(Long categoryId);

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

    @Modifying
    @Query("""
        update Resource resource
           set resource.categoryId = :targetCategoryId,
               resource.category = :targetCategoryName,
               resource.updatedAt = CURRENT_TIMESTAMP
         where resource.categoryId = :sourceCategoryId
           and resource.id in :resourceIds
        """)
    int migrateCategoryByIds(@Param("sourceCategoryId") Long sourceCategoryId,
                             @Param("targetCategoryId") Long targetCategoryId,
                             @Param("targetCategoryName") String targetCategoryName,
                             @Param("resourceIds") List<Long> resourceIds);

    @Modifying
    @Query("UPDATE Resource r SET r.status = :status, r.updatedAt = :updatedAt WHERE r.id = :id")
    int updateStatus(@Param("id") Long id,
                     @Param("status") ResourceStatus status,
                     @Param("updatedAt") LocalDateTime updatedAt);

    /** 与 Module C 审核拒绝时的反馈文案同步，供贡献者在草稿箱中查看 */
    @Modifying
    @Query("UPDATE Resource r SET r.reviewFeedback = :feedback, r.updatedAt = :updatedAt WHERE r.id = :id")
    int updateReviewFeedback(@Param("id") Long id,
                           @Param("feedback") String feedback,
                           @Param("updatedAt") LocalDateTime updatedAt);

    long countByContributorIdAndStatus(Long contributorId, ResourceStatus status);

    @Modifying
    @Query("UPDATE Resource r SET r.status = :status, r.archiveReason = :reason, r.updatedAt = :updatedAt WHERE r.id = :id")
    int updateStatusWithReason(@Param("id") Long id,
                               @Param("status") ResourceStatus status,
                               @Param("reason") String reason,
                               @Param("updatedAt") LocalDateTime updatedAt);

    Page<Resource> findByStatus(ResourceStatus status, Pageable pageable);
    List<Resource> findByStatus(ResourceStatus status);
    List<Resource> findByContributorId(Long contributorId);
    Page<Resource> findByCategoryId(Long categoryId, Pageable pageable);
    Page<Resource> findByStatusAndCategoryId(ResourceStatus status, Long categoryId, Pageable pageable);
    Page<Resource> findByStatusAndContributorId(ResourceStatus status, Long contributorId, Pageable pageable);
    List<Resource> findByContributorIdAndStatus(Long contributorId, ResourceStatus status);
    Page<Resource> findAll(Pageable pageable);

    @Query(value = """
        select r.status as status,
               count(*) as count
          from resources r
         group by r.status
        """, nativeQuery = true)
    List<StatusDashboardRow> countResourcesByStatusForDashboard();

    @Query(value = """
        select c.id as categoryId,
               coalesce(c.name, 'Unassigned') as categoryName,
               coalesce(c.status, 'INACTIVE') as categoryStatus,
               count(r.id) as count
          from resources r
          left join categories c
                 on c.id = r.category_id
         group by c.id, c.name, c.status
         order by count(r.id) desc, categoryName asc
        """, nativeQuery = true)
    List<CategoryDashboardRow> countResourcesByCategoryForDashboard();

    @Query(value = """
        select u.id as contributorId,
               u.username as contributorName,
               count(r.id) as count
          from resources r
          join users u
            on u.id = r.contributor_id
         where u.role = 'CONTRIBUTOR'
           and r.status <> 'DRAFT'
         group by u.id, u.username
         order by count(r.id) desc, u.username asc
        """, nativeQuery = true)
    List<ContributorDashboardRow> countSubmittedResourcesByContributorForDashboard();
}
