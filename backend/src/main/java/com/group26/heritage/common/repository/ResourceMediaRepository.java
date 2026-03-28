package com.group26.heritage.common.repository;

import com.group26.heritage.entity.ResourceMedia;
import com.group26.heritage.entity.enums.MediaType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ResourceMedia Repository — shared across modules B and C.
 * IMPORTANT: This is the ONLY ResourceMediaRepository in the project.
 */
@Repository
public interface ResourceMediaRepository extends JpaRepository<ResourceMedia, Long> {
    List<ResourceMedia> findByResourceIdOrderBySortOrderAsc(Long resourceId);
    Optional<ResourceMedia> findByResourceIdAndMediaType(Long resourceId, MediaType mediaType);
}
