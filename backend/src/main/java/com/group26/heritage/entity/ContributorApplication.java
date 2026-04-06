package com.group26.heritage.entity;

import com.group26.heritage.entity.enums.ApplicationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ContributorApplication entity — tracks Viewer → Contributor upgrade requests.
 * Module A: Admin Approval Workflow (Summary A-PBI 1.5)
 */
@Entity
@Table(name = "contributor_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContributorApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "admin_id")
    private Long adminId;

    // TODO: @ManyToOne @JoinColumn(name = "user_id", insertable = false, updatable = false) private User applicant;
    // TODO: @ManyToOne @JoinColumn(name = "admin_id", insertable = false, updatable = false) private User admin;
}
