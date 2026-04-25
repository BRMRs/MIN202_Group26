-- ============================================================
-- Heritage Platform — Database Safe Initialization Script
-- MySQL 8.0+ | Character Set: utf8mb4 | Engine: InnoDB
-- 
-- 特点：只创建不存在的表，不会删除已有数据
-- 适用：日常启动，保留现有数据
-- ============================================================

CREATE DATABASE IF NOT EXISTS heritage_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE heritage_db;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
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
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description TEXT         NULL,
    status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE
                             COMMENT '系统预置分类；管理员新建为 FALSE',
    created_at  DATETIME     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认分类（如果不存在）
INSERT IGNORE INTO categories (name, description, status, is_default, created_at) VALUES
('Traditional Craftsmanship', 'Handmade techniques, traditional crafts, and related artifacts', 'ACTIVE', TRUE, NOW()),
('Folk Customs', 'Festivals, rituals, temple fairs, and life customs', 'ACTIVE', TRUE, NOW()),
('Folk Literature & Oral History', 'Myths, legends, epics, ballads, and oral traditions', 'ACTIVE', TRUE, NOW()),
('Traditional Performing Arts', 'Local opera, folk arts, traditional music and dance', 'ACTIVE', TRUE, NOW()),
('Historic Architecture & Settlements', 'Historic buildings, vernacular architecture, traditional villages, and cultural landscapes', 'ACTIVE', TRUE, NOW()),
('Traditional Fine Arts', 'Painting, paper-cutting, embroidery, carving, and visual arts', 'ACTIVE', TRUE, NOW()),
('Traditional Sports & Games', 'Martial arts, dragon boat, traditional board games, and folk games', 'ACTIVE', TRUE, NOW()),
('Intangible Heritage Cuisine & Foodways', 'Food-making techniques and related customs', 'ACTIVE', TRUE, NOW());

-- ============================================================
-- 3. resources
-- ============================================================
CREATE TABLE IF NOT EXISTS resources (
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
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_media (
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
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    name       VARCHAR(50) NOT NULL,
    created_at DATETIME    NULL,
    is_deleted BOOLEAN     NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. resource_tags
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_tags (
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
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
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
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
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
-- ============================================================
CREATE TABLE IF NOT EXISTS review_feedback (
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
-- ============================================================
CREATE TABLE IF NOT EXISTS contributor_applications (
    id          BIGINT   NOT NULL AUTO_INCREMENT,
    user_id     BIGINT   NOT NULL,
    status      ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    applied_at  DATETIME NULL,
    reviewed_at DATETIME NULL,
    admin_id    BIGINT   NULL COMMENT 'Admin who processed this application',
    reason      TEXT     NULL,
    reject_reason VARCHAR(1000) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_applications_user
        FOREIGN KEY (user_id)  REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_admin
        FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contributor_application_files (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    application_id BIGINT       NOT NULL,
    file_url       VARCHAR(500) NOT NULL,
    file_name      VARCHAR(255) NULL,
    file_size      BIGINT       NULL,
    mime_type      VARCHAR(100) NULL,
    sort_order     INT          NOT NULL DEFAULT 0,
    uploaded_at    DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_contributor_application_files_application
        FOREIGN KEY (application_id) REFERENCES contributor_applications (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. reports
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
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

-- ============================================================
-- 12. china_cities (中国城市数据)
-- ============================================================
CREATE TABLE IF NOT EXISTS china_cities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 默认账户（如果不存在则插入）
-- 使用 INSERT IGNORE 避免重复插入报错
-- ============================================================

-- Default admin account (admin / admin123)
INSERT IGNORE INTO users (id, username, email, password, role, email_verified, created_at, updated_at)
VALUES (
    1, 'admin', 'admin@heritage.org',
    '$2b$10$bkTyuuBfW3LZZ9NIOLqUaehjTh8XpyNeWbqwjtM27ybnfxr6ZIoCq',
    'ADMIN', TRUE, NOW(), NOW()
);

-- Additional admin accounts
INSERT IGNORE INTO users (id, username, email, password, role, email_verified, created_at, updated_at) VALUES
(2, 'admin2', 'admin2@heritage.org', '$2a$10$/c3TA3BeNlyChidDmivCy.Av00xH3x1xV3973aVyBpaqaMmEluaUO', 'ADMIN', TRUE, NOW(), NOW()),
(3, 'admin3', 'admin3@heritage.org', '$2a$10$rh8lTt2DIX6945/e3FosLeydvYLh3g1QnR1F9LInGkhJYWM9PKn8C', 'ADMIN', TRUE, NOW(), NOW()),
(4, 'admin4', 'admin4@heritage.org', '$2a$10$2SzP2GH2xHFIR2gktn6qOeQemM63AVln.RqoAbn0tRzbM9aZtm8ny', 'ADMIN', TRUE, NOW(), NOW());

-- Demo contributor account (contributor_demo / demo123)
INSERT IGNORE INTO users (id, username, email, password, role, email_verified, created_at, updated_at)
VALUES (
    5, 'contributor_demo', 'contributor@heritage.org',
    '$2b$10$CuGOqM.Zb4HhOJLK753hRuIDxSpekpcX4lliubMWcgzMILlxeRImG',
    'CONTRIBUTOR', TRUE, NOW(), NOW()
);
