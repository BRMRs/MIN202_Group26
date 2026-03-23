package com.group26.heritage.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "review_feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resource_id", nullable = false)
    private Long resourceId;

    @Column(name = "reviewer_id", nullable = false)
    private Long reviewerId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "feedback_text", columnDefinition = "TEXT")
    private String feedbackText;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    // TODO: @ManyToOne @JoinColumn(name = "resource_id", insertable = false, updatable = false) private Resource resource;
    // TODO: @ManyToOne @JoinColumn(name = "reviewer_id", insertable = false, updatable = false) private User reviewer;
}
