-- ============================================================
-- Heritage Platform — Database Initialization Script
-- MySQL 8.0+ | Character Set: utf8mb4 | Engine: InnoDB
-- Run via MySQL CLI: mysql -u root -p heritage_db < init.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS heritage_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE heritage_db;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Drop legacy stub tables
-- ============================================================
DROP TABLE IF EXISTS heritage_audit;
DROP TABLE IF EXISTS heritage_settings;
DROP TABLE IF EXISTS heritage_permissions;
DROP TABLE IF EXISTS heritage_assignments;
DROP TABLE IF EXISTS heritage_logs;
DROP TABLE IF EXISTS heritage_tasks;
DROP TABLE IF EXISTS heritage_projects;
DROP TABLE IF EXISTS heritage_roles;
DROP TABLE IF EXISTS heritage_users;

-- Drop any trigger from previous schema versions
DROP TRIGGER IF EXISTS trg_before_delete_category;

-- ============================================================
-- Drop new tables in reverse dependency order (safe re-run)
-- ============================================================
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS contributor_applications;
DROP TABLE IF EXISTS review_feedback;
DROP TABLE IF EXISTS resource_tags;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS resource_media;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- ============================================================
-- 1. users
-- Stores all user accounts.
-- ============================================================
CREATE TABLE users (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    username           VARCHAR(50)  NOT NULL,
    email              VARCHAR(100) NOT NULL,
    password           VARCHAR(255) NOT NULL,
    role               ENUM('ADMIN','CONTRIBUTOR','VIEWER') NOT NULL DEFAULT 'VIEWER',
    avatar_url         VARCHAR(500) NULL,
    bio                VARCHAR(50)  NULL,
    email_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255) NULL,
    created_at         DATETIME     NULL,
    updated_at         DATETIME     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email    (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. categories
-- Flat (non-hierarchical) resource categories.
-- Deletion policy: LOGICAL DELETE ONLY — never physically deleted.
--   Set status = 'INACTIVE' to deactivate a category.
--   INACTIVE categories: cannot be used for new/edited resources,
--   and all their APPROVED resources become UNPUBLISHED.
-- ============================================================
CREATE TABLE categories (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description TEXT         NULL,
    status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at  DATETIME     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. resources
-- Core table: cultural heritage resources.
--
-- category_id = NULL means the contributor is requesting a new
-- category; in that case requested_category_name and
-- category_request_reason are required.
-- The admin must assign or create a category before approving.
--
-- Deletion rules:
--   contributor_id → RESTRICT (cannot delete a user who has resources)
--   category_id    → RESTRICT (categories are never physically deleted)
-- ============================================================
CREATE TABLE resources (
    id                       BIGINT       NOT NULL AUTO_INCREMENT,
    title                    VARCHAR(200) NOT NULL,
    description              TEXT         NULL,
    category_id              BIGINT       NULL DEFAULT NULL
                             COMMENT 'NULL = contributor is requesting a new category',
    contributor_id           BIGINT       NOT NULL,
    status                   ENUM('DRAFT','PENDING_REVIEW','APPROVED','REJECTED',
                                  'UNPUBLISHED','ARCHIVED')
                             NOT NULL DEFAULT 'DRAFT',
    place                    VARCHAR(200) NULL,
    requested_category_name  VARCHAR(100) NULL
                             COMMENT 'Required when category_id IS NULL',
    category_request_reason  TEXT         NULL
                             COMMENT 'Required when category_id IS NULL',
    copyright_declaration    TEXT         NULL,
    external_link            VARCHAR(500) NULL,
    archive_reason           TEXT         NULL
                             COMMENT 'Populated only when status = ARCHIVED',
    created_at               DATETIME     NULL,
    updated_at               DATETIME     NULL,
    comment_count            INT          NOT NULL DEFAULT 0,
    like_count               INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_resources_category
        FOREIGN KEY (category_id)    REFERENCES categories (id) ON DELETE RESTRICT,
    CONSTRAINT fk_resources_contributor
        FOREIGN KEY (contributor_id) REFERENCES users (id)      ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. resource_media
-- Stores images, videos, audio, and documents attached to a resource.
-- Special rule: each resource must have exactly one COVER media entry.
-- ============================================================
CREATE TABLE resource_media (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    resource_id BIGINT       NOT NULL,
    media_type  ENUM('COVER','DETAIL','VIDEO','AUDIO','DOCUMENT') NOT NULL,
    file_url    VARCHAR(500) NOT NULL,
    file_name   VARCHAR(255) NULL,
    file_size   BIGINT       NULL COMMENT 'File size in bytes',
    mime_type   VARCHAR(100) NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    uploaded_at DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_resource_media_resource
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. tags
-- Deletion policy: SOFT DELETE — set is_deleted = TRUE.
--   Soft-deleted tags: not shown in UI, cannot be applied to resources.
--   The resource_tags rows for the deleted tag are removed,
--   but the tag row itself is kept for historical queries.
-- ============================================================
CREATE TABLE tags (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    name       VARCHAR(50) NOT NULL,
    created_at DATETIME    NULL,
    is_deleted BOOLEAN     NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. resource_tags  (resources ↔ tags, many-to-many)
-- ============================================================
CREATE TABLE resource_tags (
    resource_id BIGINT NOT NULL,
    tag_id      BIGINT NOT NULL,
    PRIMARY KEY (resource_id, tag_id),
    CONSTRAINT fk_resource_tags_resource
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
    CONSTRAINT fk_resource_tags_tag
        FOREIGN KEY (tag_id)      REFERENCES tags (id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. comments
-- Deletion rules: user deleted → CASCADE; resource deleted → CASCADE
-- ============================================================
CREATE TABLE comments (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    resource_id BIGINT       NOT NULL,
    user_id     BIGINT       NOT NULL,
    content     VARCHAR(500) NOT NULL,
    created_at  DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_comments_resource
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user
        FOREIGN KEY (user_id)     REFERENCES users (id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. likes
-- Unique constraint on (user_id, resource_id) prevents duplicate likes.
-- Deletion rules: user deleted → CASCADE; resource deleted → CASCADE
-- ============================================================
CREATE TABLE likes (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    user_id     BIGINT   NOT NULL,
    resource_id BIGINT   NOT NULL,
    created_at  DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_likes_user_resource (user_id, resource_id),
    CONSTRAINT fk_likes_user
        FOREIGN KEY (user_id)     REFERENCES users (id)     ON DELETE CASCADE,
    CONSTRAINT fk_likes_resource
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. review_feedback
-- Audit log for every resource review action.
-- Deletion rules:
--   resource deleted  → CASCADE  (audit entries follow the resource)
--   reviewer deleted  → RESTRICT (audit logs must be preserved)
-- ============================================================
CREATE TABLE review_feedback (
    id              BIGINT   NOT NULL AUTO_INCREMENT,
    resource_id     BIGINT   NOT NULL,
    reviewer_id     BIGINT   NOT NULL,
    decision        ENUM('APPROVED','REJECTED','UNPUBLISHED','REPUBLISHED','ARCHIVED') NOT NULL,
    previous_status ENUM('DRAFT','PENDING_REVIEW','APPROVED','REJECTED',
                         'UNPUBLISHED','ARCHIVED') NOT NULL,
    feedback_text   TEXT     NULL,
    reviewed_at     DATETIME NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_review_feedback_resource
        FOREIGN KEY (resource_id) REFERENCES resources (id) ON DELETE CASCADE,
    CONSTRAINT fk_review_feedback_reviewer
        FOREIGN KEY (reviewer_id) REFERENCES users (id)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. contributor_applications
-- Tracks VIEWER → CONTRIBUTOR upgrade requests.
-- user_id is NOT unique: rejected applicants may reapply.
-- Deletion rules:
--   applicant (user_id) deleted → CASCADE
--   admin (admin_id)    deleted → SET NULL
-- ============================================================
CREATE TABLE contributor_applications (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    user_id     BIGINT   NOT NULL,
    status      ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    applied_at  DATETIME NULL,
    reviewed_at DATETIME NULL,
    admin_id    BIGINT   NULL COMMENT 'Admin who processed this application',
    PRIMARY KEY (id),
    CONSTRAINT fk_applications_user
        FOREIGN KEY (user_id)  REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_admin
        FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. reports
-- Pre-generated statistical reports for administrators.
-- Deletion rule: creator (created_by) deleted → RESTRICT
-- ============================================================
CREATE TABLE reports (
    id                 BIGINT      NOT NULL AUTO_INCREMENT,
    report_type        VARCHAR(50) NOT NULL COMMENT 'e.g. RESOURCE_STATS, CATEGORY_DISTRIBUTION',
    from_date          DATE        NOT NULL,
    to_date            DATE        NOT NULL,
    total_count        INT         NULL,
    approved_count     INT         NULL,
    category_breakdown JSON        NULL,
    trend_data         JSON        NULL,
    extra_data         JSON        NULL,
    created_at         DATETIME    NULL,
    created_by         BIGINT      NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_reports_creator
        FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Initial Data
-- ============================================================

-- Default admin account
-- Username : admin
-- Password : admin123
INSERT INTO users (username, email, password, role, email_verified, created_at, updated_at)
VALUES (
    'admin',
    'admin@heritage.org',
    '$2b$10$bkTyuuBfW3LZZ9NIOLqUaehjTh8XpyNeWbqwjtM27ybnfxr6ZIoCq',
    'ADMIN',
    TRUE,
    NOW(),
    NOW()
);

-- Demo contributor account
-- Username : contributor_demo
-- Password : demo123
INSERT INTO users (username, email, password, role, email_verified, created_at, updated_at)
VALUES (
    'contributor_demo',
    'contributor@heritage.org',
    '$2b$10$CuGOqM.Zb4HhOJLK753hRuIDxSpekpcX4lliubMWcgzMILlxeRImG',
    'CONTRIBUTOR',
    TRUE,
    NOW(),
    NOW()
);
