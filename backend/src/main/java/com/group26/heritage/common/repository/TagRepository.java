package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Tag Repository — shared across modules B, D, E.
 * IMPORTANT: This is the ONLY TagRepository in the project.
 */
@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    // TODO: Optional<Tag> findByName(String name);
    // TODO: List<Tag> findByNameContainingIgnoreCase(String keyword);
}
