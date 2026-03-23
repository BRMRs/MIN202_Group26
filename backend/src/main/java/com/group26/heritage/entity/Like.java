package com.group26.heritage.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Like entity — represents a user liking a resource.
 * Uses composite primary key (user_id, resource_id).
 * Module D: Like/Unlike feature (Summary D-PBI 5)
 */
@Entity
@Table(name = "likes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Like {

    // TODO: Implement composite key using @IdClass(LikeId.class) or @EmbeddedId
    // For now, using a surrogate approach for simplicity
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // TODO: Add unique constraint on (user_id, resource_id) to prevent duplicate likes
    // TODO: @ManyToOne @JoinColumn(name = "user_id", insertable = false, updatable = false) private User user;
    // TODO: @ManyToOne @JoinColumn(name = "resource_id", insertable = false, updatable = false) private Resource resource;
}
