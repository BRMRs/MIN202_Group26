-- =========================================================================
-- Cultural Heritage Platform - Database Initialization Script
-- Strictly aligned with the "Database Design Document"
-- Contains 11 core tables, foreign key cascades, and initial mock data
-- =========================================================================

USE heritage_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop legacy/template tables if they exist
DROP TABLE IF EXISTS heritage_assignments, heritage_audit, heritage_logs, 
heritage_permissions, heritage_projects, heritage_roles, heritage_settings, 
heritage_tasks, heritage_users;

-- Drop existing tables in reverse order of foreign key dependencies
DROP TABLE IF EXISTS reports, review_feedback, likes, comments, resource_tags, tags, 
resource_media, contributor_applications, resources, categories, users;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 1. Users Table (users)
-- =============================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Username',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT 'Email address',
    password VARCHAR(255) NOT NULL COMMENT 'BCrypt hashed password',
    role ENUM('ADMIN', 'CONTRIBUTOR', 'VIEWER') NOT NULL DEFAULT 'VIEWER' COMMENT 'User role',
    avatar_url VARCHAR(500) DEFAULT NULL COMMENT 'Avatar URL',
    bio VARCHAR(50) DEFAULT NULL COMMENT 'User biography',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Email verification status',
    verification_token VARCHAR(255) DEFAULT NULL COMMENT 'Email verification token',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. Categories Table (categories)
-- =============================================
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT 'Category name',
    description TEXT COMMENT 'Category description',
    parent_id BIGINT DEFAULT NULL COMMENT 'Parent category ID for hierarchy',
    sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sorting order',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. Resources Table (resources)
-- =============================================
CREATE TABLE resources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT 'Resource title',
    description TEXT COMMENT 'Detailed description',
    category_id BIGINT NOT NULL DEFAULT 1 COMMENT 'Associated category ID',
    contributor_id BIGINT NOT NULL COMMENT 'ID of the contributor who uploaded it',
    status ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT' COMMENT 'Current status of the resource',
    place VARCHAR(200) DEFAULT NULL COMMENT 'Geographical location or place',
    copyright_declaration TEXT DEFAULT NULL COMMENT 'Copyright declaration text',
    external_link VARCHAR(500) DEFAULT NULL COMMENT 'Related external link',
    archive_reason TEXT DEFAULT NULL COMMENT 'Reason for being archived',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (contributor_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 4. Resource Media Table (resource_media)
-- =============================================
CREATE TABLE resource_media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_id BIGINT NOT NULL COMMENT 'Associated resource ID',
    media_type ENUM('COVER', 'DETAIL', 'VIDEO', 'AUDIO', 'DOCUMENT') NOT NULL COMMENT 'Type of the media file',
    file_url VARCHAR(500) NOT NULL COMMENT 'File access URL',
    file_name VARCHAR(255) DEFAULT NULL COMMENT 'Original file name',
    file_size BIGINT DEFAULT NULL COMMENT 'File size in bytes',
    mime_type VARCHAR(100) DEFAULT NULL COMMENT 'MIME type of the file',
    sort_order INT NOT NULL DEFAULT 0 COMMENT 'Display sorting order',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Upload timestamp',
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. Tags Table (tags)
-- =============================================
CREATE TABLE tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Tag name',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6. Resource Tags Junction Table (resource_tags)
-- =============================================
CREATE TABLE resource_tags (
    resource_id BIGINT NOT NULL COMMENT 'Associated resource ID',
    tag_id BIGINT NOT NULL COMMENT 'Associated tag ID',
    PRIMARY KEY (resource_id, tag_id),
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. Comments Table (comments)
-- =============================================
CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_id BIGINT NOT NULL COMMENT 'Associated resource ID',
    user_id BIGINT NOT NULL COMMENT 'ID of the user who commented',
    content VARCHAR(500) NOT NULL COMMENT 'Content of the comment',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 8. Likes Table (likes)
-- =============================================
CREATE TABLE likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'ID of the user who liked',
    resource_id BIGINT NOT NULL COMMENT 'Associated resource ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    UNIQUE KEY uk_user_resource (user_id, resource_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 9. Review Feedback Table (review_feedback)
-- =============================================
CREATE TABLE review_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_id BIGINT NOT NULL COMMENT 'Resource being reviewed',
    reviewer_id BIGINT NOT NULL COMMENT 'Admin ID who reviewed',
    decision ENUM('APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL COMMENT 'Final review decision',
    previous_status ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL COMMENT 'Status before this review',
    feedback_text TEXT DEFAULT NULL COMMENT 'Comments or reasons provided by the admin',
    reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of the review',
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 10. Contributor Applications Table (contributor_applications)
-- =============================================
CREATE TABLE contributor_applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT 'ID of the applicant (Viewer)',
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT 'Application status',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Application submission timestamp',
    reviewed_at DATETIME DEFAULT NULL COMMENT 'Review timestamp',
    admin_id BIGINT DEFAULT NULL COMMENT 'Admin ID who processed the application',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 11. Reports Table (reports)
-- =============================================
CREATE TABLE reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL COMMENT 'Type of the report',
    from_date DATE NOT NULL COMMENT 'Statistics start date',
    to_date DATE NOT NULL COMMENT 'Statistics end date',
    total_count INT DEFAULT 0 COMMENT 'Total resource count',
    approved_count INT DEFAULT 0 COMMENT 'Approved resource count',
    category_breakdown JSON DEFAULT NULL COMMENT 'Detailed stats by category in JSON',
    trend_data JSON DEFAULT NULL COMMENT 'Trend data in JSON',
    extra_data JSON DEFAULT NULL COMMENT 'Additional extension data in JSON',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Report generation timestamp',
    created_by BIGINT NOT NULL COMMENT 'Admin ID who generated the report',
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 12. Insert Initial Data (Default Account & Classifications)
-- =============================================

-- Insert default categories
INSERT INTO categories (id, name, description, parent_id, sort_order) VALUES 
(1, 'Uncategorized', 'Resources without a specific category', NULL, 0),
(2, 'Architecture', 'Traditional architecture and historical sites', NULL, 1),
(3, 'Clothing', 'Traditional clothing and textiles', NULL, 2),
(4, 'Crafts', 'Traditional crafts and artworks', NULL, 3);

-- Insert default tags
INSERT INTO tags (id, name) VALUES 
(1, 'Ming Dynasty'),
(2, 'Wooden'),
(3, 'Red'),
(4, 'Su Embroidery');

-- Insert default admin account
-- Username: admin | Password: admin123 (BCrypt hashed) | Role: ADMIN
INSERT INTO users (username, email, password, role, email_verified, created_at, updated_at)
VALUES ('admin', 'admin@heritage.org', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', TRUE, NOW(), NOW());
