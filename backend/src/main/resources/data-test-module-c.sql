
    -- 测试用户（密码都是 password123 的 BCrypt 加密）
    INSERT INTO users (username, email, password, role, email_verified, created_at, updated_at)
    VALUES
    ('reviewer1', 'reviewer1@test.com', '$2a$10$N.zmdr9zjPTBSMqlLGsKyuNEBDLGSGFEKMFt8J6.5OB.bHm1GE8Ri', 'ADMIN', TRUE, NOW(), NOW()),
    ('contributor1', 'contributor1@test.com', '$2a$10$N.zmdr9zjPTBSMqlLGsKyuNEBDLGSGFEKMFt8J6.5OB.bHm1GE8Ri', 'CONTRIBUTOR', TRUE, NOW(), NOW());

    -- 测试分类
    INSERT INTO categories (name, description, status, created_at)
    VALUES ('Local Traditions', 'Traditional customs and practices', 'ACTIVE', NOW());

    -- 测试资源（不同状态，用于测试各种场景）
    INSERT INTO resources (title, description, category_id, contributor_id, status, place, created_at, updated_at)
    VALUES
    ('Ancient Temple Heritage', 'A 500-year-old temple...', 1, 3, 'PENDING_REVIEW', 'Beijing', NOW(), NOW()),
    ('Folk Song Collection', 'Traditional folk songs...', 1, 3, 'PENDING_REVIEW', 'Suzhou', NOW(), NOW()),
    ('Local Food Culture', 'Regional cuisine traditions...', 1, 3, 'APPROVED', 'Chengdu', NOW(), NOW()),
    ('Historic Bridge', 'An ancient stone bridge...', 1, 3, 'APPROVED', 'Hangzhou', NOW(), NOW()),
    ('Old Market District', 'Traditional market area...', 1, 3, 'REJECTED', 'Shanghai', NOW(), NOW());
