package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Like Repository — used by Module D for like/unlike feature.
 * IMPORTANT: This is the ONLY LikeRepository in the project.
 */
@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    // TODO: Optional<Like> findByUserIdAndResourceId(Long userId, Long resourceId);
    // TODO: long countByResourceId(Long resourceId);
    // TODO: boolean existsByUserIdAndResourceId(Long userId, Long resourceId);
    // TODO: void deleteByUserIdAndResourceId(Long userId, Long resourceId);
}
