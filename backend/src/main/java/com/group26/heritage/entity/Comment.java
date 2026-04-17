package com.group26.heritage.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 500)
    private String content;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // TODO: @ManyToOne @JoinColumn(name = "resource_id", insertable = false, updatable = false) private Resource resource;
    // TODO: @ManyToOne @JoinColumn(name = "user_id", insertable = false, updatable = false) private User user;
}
