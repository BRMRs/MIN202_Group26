package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_e.dto.AdminResourceRow;
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

    @Query(value = """
        select r.id as id,
               r.title as title,
               r.category_id as categoryId,
               coalesce(c.name, 'Unassigned') as categoryName,
               case
                   when c.status is null then 'INACTIVE'
                   else c.status
               end as categoryStatus,
               coalesce(u.username, 'Unknown') as contributorName,
               r.status as status,
               r.updated_at as updatedAt,
               coalesce(group_concat(distinct t.name order by t.name separator ', '), '') as tags
          from resources r
          left join categories c
                 on c.id = r.category_id
          left join users u
                 on u.id = r.contributor_id
          left join resource_tags rt
                 on rt.resource_id = r.id
          left join tags t
                 on t.id = rt.tag_id
                and t.is_deleted = 0
      group by r.id,
               r.title,
               r.category_id,
               c.name,
               c.status,
               u.username,
               r.status,
               r.updated_at
      order by r.updated_at desc, r.id desc
        """, nativeQuery = true)
    List<AdminResourceRow> findAdminResourceRows();
}
