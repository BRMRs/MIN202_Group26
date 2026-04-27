USE heritage_db;

-- Rich seed data for Resource Management integration testing
-- Safe to run multiple times.

-- 1. Reuse existing users (avoid assumptions about custom NOT NULL columns in users table)
SET @seed_user_1 = COALESCE(
    (SELECT id FROM users WHERE role = 'CONTRIBUTOR' ORDER BY id LIMIT 1),
    (SELECT id FROM users ORDER BY id LIMIT 1)
);

SET @seed_user_2 = COALESCE(
    (SELECT id FROM users WHERE role = 'CONTRIBUTOR' AND id <> @seed_user_1 ORDER BY id LIMIT 1),
    @seed_user_1
);

-- 2. Ensure categories (Music remains INACTIVE for republish-category test)
INSERT INTO categories (name, description, status, is_default, created_at)
VALUES
  ('Textile', 'Traditional textile resources', 'ACTIVE', FALSE, NOW()),
  ('Music', 'Traditional music resources', 'INACTIVE', FALSE, NOW()),
  ('Craft', 'Traditional craft resources', 'ACTIVE', FALSE, NOW()),
  ('Oral History', 'Oral history resources', 'ACTIVE', FALSE, NOW()),
  ('Architecture', 'Traditional architecture resources', 'ACTIVE', FALSE, NOW()),
  ('Festival', 'Festival and ceremony resources', 'ACTIVE', FALSE, NOW()),
  ('Ritual', 'Ritual documentation resources', 'ACTIVE', FALSE, NOW())
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  status = VALUES(status);

-- 3. Ensure tags
INSERT INTO tags (name, created_at, is_deleted)
VALUES
  ('Architecture', NOW(), FALSE),
  ('Accessibility', NOW(), FALSE),
  ('Performance', NOW(), FALSE),
  ('Musicology', NOW(), FALSE),
  ('Interview', NOW(), FALSE),
  ('Craftsmanship', NOW(), FALSE),
  ('Conservation', NOW(), FALSE),
  ('Festival', NOW(), FALSE),
  ('Ritual', NOW(), FALSE),
  ('Oral History', NOW(), FALSE)
ON DUPLICATE KEY UPDATE
  is_deleted = VALUES(is_deleted);

-- 4. Recover baseline resources to testable states (if they already exist)
UPDATE resources r
JOIN categories c ON c.name = 'Textile'
SET r.status = 'APPROVED',
    r.category_id = c.id,
    r.archive_reason = NULL,
    r.updated_at = NOW()
WHERE r.title = 'Suzhou Silk Weaving Field Notes';

UPDATE resources r
JOIN categories c ON c.name = 'Music'
SET r.status = 'UNPUBLISHED',
    r.category_id = c.id,
    r.archive_reason = NULL,
    r.updated_at = NOW()
WHERE r.title = 'Folk Drum Pattern Archive';

UPDATE resources r
JOIN categories c ON c.name = 'Craft'
SET r.status = 'APPROVED',
    r.category_id = c.id,
    r.archive_reason = NULL,
    r.updated_at = NOW()
WHERE r.title = 'Bamboo Craft Interview Clips';

UPDATE resources r
JOIN categories c ON c.name = 'Oral History'
SET r.status = 'APPROVED',
    r.category_id = c.id,
    r.archive_reason = NULL,
    r.updated_at = NOW()
WHERE r.title = 'Temple Fair Oral History';

-- 5. Insert missing baseline resources
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
JOIN (SELECT @seed_user_1 AS id) u
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
JOIN (SELECT @seed_user_1 AS id) u
WHERE c.name = 'Music'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Folk Drum Pattern Archive');

INSERT INTO resources (title, description, category_id, contributor_id, status, place, created_at, updated_at)
SELECT 'Bamboo Craft Interview Clips',
       'Recovered to APPROVED for repeated testing',
       c.id,
       u.id,
       'APPROVED',
       'Hangzhou',
       NOW(),
       NOW()
FROM categories c
JOIN (SELECT @seed_user_1 AS id) u
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
JOIN (SELECT @seed_user_1 AS id) u
WHERE c.name = 'Oral History'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Temple Fair Oral History');

-- 6. More resources for broader scenario testing
INSERT INTO resources (title, description, category_id, contributor_id, status, place, archive_reason, created_at, updated_at)
SELECT 'Ancient Opera Costume Registry',
       'Archived sample with reason',
       c.id,
       u.id,
       'ARCHIVED',
       'Suzhou',
       'Outdated metadata and duplicate file set',
       NOW(),
       NOW()
FROM categories c
JOIN (SELECT @seed_user_1 AS id) u
WHERE c.name = 'Textile'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Ancient Opera Costume Registry');

INSERT INTO resources (title, description, category_id, contributor_id, status, place, created_at, updated_at)
SELECT 'Lantern Festival Parade Notes',
       'Unpublished but with ACTIVE category to test direct republish',
       c.id,
       u.id,
       'UNPUBLISHED',
       'Ningbo',
       NOW(),
       NOW()
FROM categories c
JOIN (SELECT @seed_user_1 AS id) u
WHERE c.name = 'Festival'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Lantern Festival Parade Notes');

INSERT INTO resources (title, description, category_id, contributor_id, status, place, created_at, updated_at)
SELECT 'Stone Arch Bridge Survey',
       'Approved sample for archive/unpublish action',
       c.id,
       u.id,
       'APPROVED',
       'Wuzhen',
       NOW(),
       NOW()
FROM categories c
JOIN (SELECT @seed_user_2 AS id) u
WHERE c.name = 'Architecture'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Stone Arch Bridge Survey');

INSERT INTO resources (title, description, category_id, contributor_id, status, place, created_at, updated_at)
SELECT 'Temple Drum Audio Log',
       'Rejected sample, action buttons should remain disabled',
       c.id,
       u.id,
       'REJECTED',
       'Xi''an',
       NOW(),
       NOW()
FROM categories c
JOIN (SELECT @seed_user_2 AS id) u
WHERE c.name = 'Music'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Temple Drum Audio Log');

INSERT INTO resources (title, description, category_id, contributor_id, status, place, created_at, updated_at)
SELECT 'Village Ritual Process Record',
       'Pending review sample',
       c.id,
       u.id,
       'PENDING_REVIEW',
       'Fuzhou',
       NOW(),
       NOW()
FROM categories c
JOIN (SELECT @seed_user_2 AS id) u
WHERE c.name = 'Ritual'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Village Ritual Process Record');

INSERT INTO resources (title, description, category_id, contributor_id, status, place, created_at, updated_at)
SELECT 'Embroidery Pattern Draft Book',
       'Draft sample to verify non-target statuses are listed',
       c.id,
       u.id,
       'DRAFT',
       'Suzhou',
       NOW(),
       NOW()
FROM categories c
JOIN (SELECT @seed_user_1 AS id) u
WHERE c.name = 'Textile'
  AND NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Embroidery Pattern Draft Book');

-- 7. Ensure deterministic archive reason for archived sample
UPDATE resources
SET archive_reason = 'Outdated metadata and duplicate file set',
    updated_at = NOW()
WHERE title = 'Ancient Opera Costume Registry'
  AND status = 'ARCHIVED';

-- 8. Tag linking for all key resources
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
JOIN tags t ON t.name = 'Oral History'
WHERE r.title = 'Temple Fair Oral History';

INSERT IGNORE INTO resource_tags (resource_id, tag_id)
SELECT r.id, t.id
FROM resources r
JOIN tags t ON t.name = 'Conservation'
WHERE r.title = 'Ancient Opera Costume Registry';

INSERT IGNORE INTO resource_tags (resource_id, tag_id)
SELECT r.id, t.id
FROM resources r
JOIN tags t ON t.name = 'Festival'
WHERE r.title = 'Lantern Festival Parade Notes';

INSERT IGNORE INTO resource_tags (resource_id, tag_id)
SELECT r.id, t.id
FROM resources r
JOIN tags t ON t.name = 'Architecture'
WHERE r.title = 'Stone Arch Bridge Survey';

INSERT IGNORE INTO resource_tags (resource_id, tag_id)
SELECT r.id, t.id
FROM resources r
JOIN tags t ON t.name = 'Ritual'
WHERE r.title = 'Village Ritual Process Record';

INSERT IGNORE INTO resource_tags (resource_id, tag_id)
SELECT r.id, t.id
FROM resources r
JOIN tags t ON t.name = 'Craftsmanship'
WHERE r.title = 'Embroidery Pattern Draft Book';

