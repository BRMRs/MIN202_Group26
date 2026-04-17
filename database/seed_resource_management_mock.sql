USE heritage_db;

-- 1) Ensure one contributor exists for mock resources
INSERT INTO users (username, email, password, role, email_verified, created_at, updated_at)
SELECT 'contributor_demo',
       'contributor_demo@heritage.org',
       '$2a$10$N.zmdr9zjPTBSMqlLGsKyuNEBDLGSGFEKMFt8J6.5OB.bHm1GE8Ri',
       'CONTRIBUTOR',
       TRUE,
       NOW(),
       NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'contributor_demo'
);

-- 2) Mock categories (mixed ACTIVE/INACTIVE for linkage tests)
INSERT INTO categories (name, description, status, is_default, created_at)
VALUES
  ('Textile', 'Traditional textile resources', 'ACTIVE', FALSE, NOW()),
  ('Music', 'Traditional music resources', 'INACTIVE', FALSE, NOW()),
  ('Craft', 'Traditional craft resources', 'ACTIVE', FALSE, NOW()),
  ('Oral History', 'Oral history resources', 'ACTIVE', FALSE, NOW()),
  ('Architecture', 'Traditional architecture resources', 'ACTIVE', FALSE, NOW())
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  status = VALUES(status);

-- 3) Mock tags
INSERT INTO tags (name, created_at, is_deleted)
VALUES
  ('Architecture', NOW(), FALSE),
  ('Accessibility', NOW(), FALSE),
  ('Performance', NOW(), FALSE),
  ('Musicology', NOW(), FALSE),
  ('Interview', NOW(), FALSE)
ON DUPLICATE KEY UPDATE
  is_deleted = VALUES(is_deleted);

-- 4) Mock resources (for APPROVED/UNPUBLISHED/ARCHIVED transitions)
INSERT INTO resources (title, description, category_id, contributor_id, status, place, created_at, updated_at)
SELECT 'Suzhou Silk Weaving Field Notes',
       'Admin demo resource for archive/unpublish flow',
       c.id,
       u.id,
       'APPROVED',
       'Suzhou',
       NOW(),
       NOW()
FROM categories c
JOIN users u ON u.username = 'contributor_demo'
WHERE c.name = 'Textile'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Suzhou Silk Weaving Field Notes');

INSERT INTO resources (title, description, category_id, contributor_id, status, place, created_at, updated_at)
SELECT 'Folk Drum Pattern Archive',
       'Unpublished resource with INACTIVE category for republish check',
       c.id,
       u.id,
       'UNPUBLISHED',
       'Xi''an',
       NOW(),
       NOW()
FROM categories c
JOIN users u ON u.username = 'contributor_demo'
WHERE c.name = 'Music'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Folk Drum Pattern Archive');

INSERT INTO resources (title, description, category_id, contributor_id, status, place, created_at, updated_at)
SELECT 'Bamboo Craft Interview Clips',
       'Archived demo resource for admin-only visibility',
       c.id,
       u.id,
       'ARCHIVED',
       'Hangzhou',
       NOW(),
       NOW()
FROM categories c
JOIN users u ON u.username = 'contributor_demo'
WHERE c.name = 'Craft'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Bamboo Craft Interview Clips');

INSERT INTO resources (title, description, category_id, contributor_id, status, place, created_at, updated_at)
SELECT 'Temple Fair Oral History',
       'Approved demo resource for unpublish and archive action',
       c.id,
       u.id,
       'APPROVED',
       'Nanjing',
       NOW(),
       NOW()
FROM categories c
JOIN users u ON u.username = 'contributor_demo'
WHERE c.name = 'Oral History'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Temple Fair Oral History');

-- 5) Link resource_tags (many-to-many)
INSERT IGNORE INTO resource_tags (resource_id, tag_id)
SELECT r.id, t.id
FROM resources r
JOIN tags t ON t.name = 'Performance'
WHERE r.title = 'Suzhou Silk Weaving Field Notes';

INSERT IGNORE INTO resource_tags (resource_id, tag_id)
SELECT r.id, t.id
FROM resources r
JOIN tags t ON t.name = 'Musicology'
WHERE r.title = 'Folk Drum Pattern Archive';

INSERT IGNORE INTO resource_tags (resource_id, tag_id)
SELECT r.id, t.id
FROM resources r
JOIN tags t ON t.name = 'Interview'
WHERE r.title = 'Bamboo Craft Interview Clips';

INSERT IGNORE INTO resource_tags (resource_id, tag_id)
SELECT r.id, t.id
FROM resources r
JOIN tags t ON t.name = 'Architecture'
WHERE r.title = 'Temple Fair Oral History';

