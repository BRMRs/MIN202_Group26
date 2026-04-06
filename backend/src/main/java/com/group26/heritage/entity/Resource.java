package com.group26.heritage.entity;

import com.group26.heritage.entity.enums.ResourceStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "resources")
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

    @Column(length = 100)
    private String category;

    @Column(name = "contributor_id", nullable = false)
    private Long contributorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceStatus status = ResourceStatus.DRAFT;

    @Column(length = 200)
    private String place;

    @Column(length = 200)
    private String tags;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "external_link", length = 500)
    private String externalLink;

    @Column(name = "copyright_declaration", columnDefinition = "TEXT")
    private String copyrightDeclaration;

    @Column(columnDefinition = "TEXT")
    private String reviewFeedback;

    @Column(name = "archive_reason", columnDefinition = "TEXT")
    private String archiveReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}