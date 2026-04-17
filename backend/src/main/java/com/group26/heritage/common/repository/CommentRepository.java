package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Comment Repository — used by Module D.
 * IMPORTANT: This is the ONLY CommentRepository in the project.
 */
@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    // TODO: List<Comment> findByResourceIdOrderByCreatedAtDesc(Long resourceId);
    // TODO: long countByResourceId(Long resourceId);
}
