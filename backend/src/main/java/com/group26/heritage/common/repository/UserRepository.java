package com.group26.heritage.common.repository;

import com.group26.heritage.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * User Repository — shared across all modules.
 * IMPORTANT: This is the ONLY UserRepository in the project.
 * All modules must inject this repository, never create a duplicate.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // TODO: Optional<User> findByUsername(String username);
    // TODO: Optional<User> findByEmail(String email);
    // TODO: boolean existsByEmail(String email);
    // TODO: boolean existsByUsername(String username);
}
