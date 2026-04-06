package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
