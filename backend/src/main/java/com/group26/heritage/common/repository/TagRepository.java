package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Tag;
import com.group26.heritage.module_e.dto.TagUsageRow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Tag Repository — shared across modules B, D, E.
 * IMPORTANT: This is the ONLY TagRepository in the project.
 */
@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findAllByIsDeletedFalseOrderByNameAsc();

    List<Tag> findByIsDeletedFalseAndNameContainingIgnoreCaseOrderByNameAsc(String keyword);

    Optional<Tag> findByIdAndIsDeletedFalse(Long id);

    Optional<Tag> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIsDeletedFalse(String name);

    boolean existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse(String name, Long id);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query(value = """
        select t.id as id,
               t.name as name,
               t.is_deleted as isDeleted,
               t.created_at as createdAt,
               count(distinct r.id) as approvedResourceCount
          from tags t
          left join resource_tags rt
                 on rt.tag_id = t.id
          left join resources r
                 on r.id = rt.resource_id
                and r.status = 'APPROVED'
         where t.is_deleted = false
         group by t.id, t.name, t.is_deleted, t.created_at
         order by t.name asc
        """, nativeQuery = true)
    List<TagUsageRow> findActiveTagsWithApprovedResourceCount();

    @Query(value = """
        select t.id as id,
               t.name as name,
               t.is_deleted as isDeleted,
               t.created_at as createdAt,
               count(distinct r.id) as approvedResourceCount
          from tags t
          left join resource_tags rt
                 on rt.tag_id = t.id
          left join resources r
                 on r.id = rt.resource_id
                and r.status = 'APPROVED'
         where t.is_deleted = false
           and lower(t.name) like lower(concat('%', :keyword, '%'))
         group by t.id, t.name, t.is_deleted, t.created_at
         order by t.name asc
        """, nativeQuery = true)
    List<TagUsageRow> searchActiveTagsWithApprovedResourceCount(@Param("keyword") String keyword);

    @Query(value = """
        select count(distinct r.id)
          from resource_tags rt
          join resources r
            on r.id = rt.resource_id
           and r.status = 'APPROVED'
         where rt.tag_id = :tagId
        """, nativeQuery = true)
    long countApprovedResourcesByTagId(@Param("tagId") Long tagId);
}
