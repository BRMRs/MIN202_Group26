-- =========================================================================
-- Cultural Heritage Platform - Database Initialization Script
-- 严格按照《数据库设计文档.pdf》要求生成
-- 包含 11 张核心表、外键级联规则及初始化数据
-- =========================================================================

USE heritage_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 清理框架自动生成的无用旧表
DROP TABLE IF EXISTS heritage_assignments, heritage_audit, heritage_logs, 
heritage_permissions, heritage_projects, heritage_roles, heritage_settings, 
heritage_tasks, heritage_users;

-- 按照外键依赖倒序删除现有表
DROP TABLE IF EXISTS reports, review_feedback, likes, comments, resource_tags, tags, 
resource_media, contributor_applications, resources, categories, users;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 1. 用户表 (users)
-- =============================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '电子邮箱',
    password VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    role ENUM('ADMIN', 'CONTRIBUTOR', 'VIEWER') NOT NULL DEFAULT 'VIEWER' COMMENT '用户角色',
    avatar_url VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    bio VARCHAR(50) DEFAULT NULL COMMENT '个人简介',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT '邮箱是否已验证',
    verification_token VARCHAR(255) DEFAULT NULL COMMENT '邮箱验证token',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. 分类表 (categories)
-- =============================================
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    parent_id BIGINT DEFAULT NULL COMMENT '父分类ID',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. 资源表 (resources)
-- =============================================
CREATE TABLE resources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '资源标题',
    description TEXT COMMENT '详细描述',
    category_id BIGINT NOT NULL DEFAULT 1 COMMENT '所属分类',
    contributor_id BIGINT NOT NULL COMMENT '贡献者ID',
    status ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT' COMMENT '资源状态',
    place VARCHAR(200) DEFAULT NULL COMMENT '资源地点',
    copyright_declaration TEXT DEFAULT NULL COMMENT '版权声明',
    external_link VARCHAR(500) DEFAULT NULL COMMENT '相关外部链接',
    archive_reason TEXT DEFAULT NULL COMMENT '归档原因',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (contributor_id) REFERENCES users(id) ON DELETE RESTRICT -- 规则5：禁止删除用户贡献的资源
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 4. 资源媒体表 (resource_media)
-- =============================================
CREATE TABLE resource_media (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_id BIGINT NOT NULL COMMENT '所属资源ID',
    media_type ENUM('COVER', 'DETAIL', 'VIDEO', 'AUDIO', 'DOCUMENT') NOT NULL COMMENT '媒体类型',
    file_url VARCHAR(500) NOT NULL COMMENT '文件访问URL',
    file_name VARCHAR(255) DEFAULT NULL COMMENT '原始文件名',
    file_size BIGINT DEFAULT NULL COMMENT '文件大小(字节)',
    mime_type VARCHAR(100) DEFAULT NULL COMMENT 'MIME类型',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. 标签表 (tags)
-- =============================================
CREATE TABLE tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6. 资源标签关联表 (resource_tags)
-- =============================================
CREATE TABLE resource_tags (
    resource_id BIGINT NOT NULL COMMENT '资源ID',
    tag_id BIGINT NOT NULL COMMENT '标签ID',
    PRIMARY KEY (resource_id, tag_id),
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. 评论表 (comments)
-- =============================================
CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_id BIGINT NOT NULL COMMENT '所属资源ID',
    user_id BIGINT NOT NULL COMMENT '评论用户ID',
    content VARCHAR(500) NOT NULL COMMENT '评论内容',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 8. 点赞表 (likes)
-- =============================================
CREATE TABLE likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '点赞用户ID',
    resource_id BIGINT NOT NULL COMMENT '被点赞资源ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_resource (user_id, resource_id), -- 规则3.7：保证唯一点赞
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 9. 审核反馈表 (review_feedback)
-- =============================================
CREATE TABLE review_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resource_id BIGINT NOT NULL COMMENT '被审核资源ID',
    reviewer_id BIGINT NOT NULL COMMENT '审核人ID',
    decision ENUM('APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL COMMENT '审核决定',
    previous_status ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL COMMENT '审核前的资源状态',
    feedback_text TEXT DEFAULT NULL COMMENT '审核意见',
    reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '审核时间',
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT -- 规则5：审计日志必须保留
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 10. 贡献者申请表 (contributor_applications)
-- =============================================
CREATE TABLE contributor_applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '申请人ID',
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT '申请状态',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    reviewed_at DATETIME DEFAULT NULL COMMENT '审核时间',
    admin_id BIGINT DEFAULT NULL COMMENT '处理该申请的管理员ID',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 11. 统计报表表 (reports)
-- =============================================
CREATE TABLE reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL COMMENT '报表类型',
    from_date DATE NOT NULL COMMENT '统计开始日期',
    to_date DATE NOT NULL COMMENT '统计结束日期',
    total_count INT DEFAULT 0 COMMENT '资源总数',
    approved_count INT DEFAULT 0 COMMENT '已发布资源数',
    category_breakdown JSON DEFAULT NULL COMMENT '按分类详细统计',
    trend_data JSON DEFAULT NULL COMMENT '趋势数据',
    extra_data JSON DEFAULT NULL COMMENT '其他扩展数据',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '报表生成时间',
    created_by BIGINT NOT NULL COMMENT '生成该报表的管理员ID',
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 12. 插入初始化数据
-- =============================================

-- (1) 创建默认分类“未分类”
INSERT INTO categories (id, name, description, parent_id, sort_order)
VALUES (1, '未分类', '未分类的资源', NULL, 0);

-- (2) 创建默认管理员账户
-- 用户名: admin | 密码: admin123 (BCrypt加密后) | 角色: ADMIN
INSERT INTO users (username, email, password, role, email_verified, created_at, updated_at)
VALUES ('admin', 'admin@heritage.org', '$2a$10$wY1zZOTv2xK.R5t.6oJ0l.oF8J1k1zZOTv2xK.R5t.6oJ0l.oF8J1', 'ADMIN', TRUE, NOW(), NOW());
