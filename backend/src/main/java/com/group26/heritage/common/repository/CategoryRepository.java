package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Category Repository — shared across modules B, D, E.
 * IMPORTANT: This is the ONLY CategoryRepository in the project.
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    // TODO: Optional<Category> findByName(String name);
    // TODO: boolean existsByName(String name);
}
