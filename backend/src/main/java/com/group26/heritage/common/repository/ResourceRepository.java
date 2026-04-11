package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_e.dto.AdminResourceMediaRow;
import com.group26.heritage.module_e.dto.AdminResourceRow;
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
        select r.id as id,
               r.title as title,
               r.description as description,
               r.contributor_id as contributorId,
               r.category_id as categoryId,
               coalesce(c.name, 'Unassigned') as categoryName,
               case
                   when c.status is null then 'INACTIVE'
                   else c.status
               end as categoryStatus,
               r.status as status,
               r.archive_reason as archiveReason,
               r.place as place,
               r.external_link as externalLink,
               r.copyright_declaration as copyrightDeclaration,
               r.created_at as createdAt,
               r.updated_at as updatedAt,
               coalesce(group_concat(distinct t.name order by t.name separator ', '), '') as tags
          from resources r
          left join categories c
                 on c.id = r.category_id
          left join resource_tags rt
                 on rt.resource_id = r.id
          left join tags t
                 on t.id = rt.tag_id
                and t.is_deleted = 0
        group by r.id,
                 r.title,
                 r.description,
                 r.contributor_id,
                 r.category_id,
                 c.name,
                 c.status,
                 r.status,
                 r.archive_reason,
                 r.place,
                 r.external_link,
                 r.copyright_declaration,
                 r.created_at,
                 r.updated_at
        order by r.id desc
          """, nativeQuery = true)
    List<AdminResourceRow> findAdminResourceRows();

    @Query(value = """
        select r.id as id,
               r.title as title,
               r.description as description,
               r.contributor_id as contributorId,
               r.category_id as categoryId,
               coalesce(c.name, 'Unassigned') as categoryName,
               case
                   when c.status is null then 'INACTIVE'
                   else c.status
               end as categoryStatus,
               r.status as status,
               r.archive_reason as archiveReason,
               r.place as place,
               r.external_link as externalLink,
               r.copyright_declaration as copyrightDeclaration,
               r.created_at as createdAt,
               r.updated_at as updatedAt,
               coalesce(group_concat(distinct t.name order by t.name separator ', '), '') as tags
          from resources r
          left join categories c
                 on c.id = r.category_id
          left join resource_tags rt
                 on rt.resource_id = r.id
          left join tags t
                 on t.id = rt.tag_id
                and t.is_deleted = 0
         where r.id = :resourceId
        group by r.id,
                 r.title,
                 r.description,
                 r.contributor_id,
                 r.category_id,
                 c.name,
                 c.status,
                 r.status,
                 r.archive_reason,
                 r.place,
                 r.external_link,
                 r.copyright_declaration,
                 r.created_at,
                 r.updated_at
         limit 1
        """, nativeQuery = true)
    AdminResourceRow findAdminResourceRowById(@Param("resourceId") Long resourceId);

    @Query(value = """
        select rm.id as id,
               rm.media_type as mediaType,
               rm.file_url as fileUrl,
               rm.file_name as fileName,
               rm.file_size as fileSize,
               rm.mime_type as mimeType,
               rm.sort_order as sortOrder,
               rm.uploaded_at as uploadedAt
          from resource_media rm
         where rm.resource_id = :resourceId
      order by case rm.media_type
                   when 'COVER' then 0
                   when 'DETAIL' then 1
                   when 'VIDEO' then 2
                   when 'AUDIO' then 3
                   else 4
               end,
               rm.sort_order asc,
               rm.id asc
        """, nativeQuery = true)
    List<AdminResourceMediaRow> findAdminMediaRowsByResourceId(@Param("resourceId") Long resourceId);
}
