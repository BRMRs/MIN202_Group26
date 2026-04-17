package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.enums.CategoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Category Repository — shared across modules B, D, E.
 * IMPORTANT: This is the ONLY CategoryRepository in the project.
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    List<Category> findAllByOrderByNameAsc();

    List<Category> findAllByStatusOrderByNameAsc(CategoryStatus status);
}
