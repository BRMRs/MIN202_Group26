package com.group26.heritage.entity;

import com.group26.heritage.entity.enums.ResourceStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
// PBI 3.2 — Task: Optimize status update performance
// Indexes on high-frequency filter columns keep dashboard queries under 1s.
@Table(name = "resources", indexes = {
    @Index(name = "idx_resources_status",         columnList = "status"),
    @Index(name = "idx_resources_contributor_id", columnList = "contributor_id"),
    @Index(name = "idx_resources_category_id",    columnList = "category_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "contributor_id", nullable = false)
    private Long contributorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceStatus status = ResourceStatus.DRAFT;

    @Column(length = 200)
    private String place;

    @Column(name = "requested_category_name", length = 100)
    private String requestedCategoryName;

    @Column(name = "category_request_reason", columnDefinition = "TEXT")
    private String categoryRequestReason;

    @Column(name = "copyright_declaration", columnDefinition = "TEXT")
    private String copyrightDeclaration;

    @Column(name = "external_link", length = 500)
    private String externalLink;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "archive_reason", columnDefinition = "TEXT")
    private String archiveReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // TODO: @ManyToOne @JoinColumn(name = "category_id", insertable = false, updatable = false) private Category category;
    // TODO: @ManyToOne @JoinColumn(name = "contributor_id", insertable = false, updatable = false) private User contributor;
    // TODO: @ManyToMany @JoinTable(name = "resource_tags", ...) private Set<Tag> tags;
    // TODO: @OneToMany(mappedBy = "resourceId") private List<Comment> comments;
    // TODO: Add @PrePersist and @PreUpdate lifecycle hooks
}
