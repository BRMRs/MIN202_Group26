-- ============================================================
-- Mock Data for Module D (PBI 4.4 & 4.5)
-- ============================================================

USE heritage_db;

-- 1. Insert Categories (Module E)
INSERT INTO categories (name, description, status, created_at) 
VALUES ('Architecture', 'Classical buildings and gardens', 'ACTIVE', NOW()),
       ('Traditions', 'Local customs and festivals', 'ACTIVE', NOW());

-- 2. Insert Users (Module A)
-- Password is 'password' (not hashed for mock simplicity, in real app use BCrypt)
INSERT INTO users (username, email, password, role, email_verified, created_at, updated_at)
VALUES ('HeritageLover', 'lover@heritage.org', 'password', 'VIEWER', TRUE, NOW(), NOW()),
       ('Contributor01', 'c01@heritage.org', 'password', 'CONTRIBUTOR', TRUE, NOW(), NOW());

-- 3. Insert Resources (Module B/D)
INSERT INTO resources (title, description, category_id, contributor_id, status, place, copyright_declaration, external_link, created_at, updated_at, comment_count, like_count)
VALUES ('Suzhou Classical Gardens', 'The Classical Gardens of Suzhou are a group of gardens in Suzhou, Jiangsu province, China, which have been added to the UNESCO World Heritage List.', 1, 2, 'APPROVED', 'Suzhou, Jiangsu', 'Public Domain - UNESCO Heritage Site', 'https://whc.unesco.org/en/list/813', NOW(), NOW(), 2, 15),
       ('Empty Resource Example', 'A resource with minimal information for testing purposes.', 2, 2, 'ARCHIVED', 'Unknown', 'None', '', NOW(), NOW(), 0, 0);

-- 4. Insert Resource Media (Module B/D)
INSERT INTO resource_media (resource_id, media_type, file_url, file_name, sort_order, uploaded_at)
VALUES (1, 'COVER', 'https://images.unsplash.com/photo-1599571234389-bb0899a13467?q=80&w=1000', 'garden_main.jpg', 0, NOW()),
       (1, 'DETAIL', 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?q=80&w=1000', 'pavilion.jpg', 1, NOW()),
       (1, 'DETAIL', 'https://images.unsplash.com/photo-1528660493888-ab6f4761e036?q=80&w=1000', 'bridge.jpg', 2, NOW()),
       (2, 'COVER', 'https://via.placeholder.com/1000x600?text=No+Image', 'placeholder.jpg', 0, NOW());

-- 5. Insert Tags (Module E)
INSERT INTO tags (name, created_at) VALUES ('Garden', NOW()), ('UNESCO', NOW());

-- 6. Link Resources to Tags
INSERT INTO resource_tags (resource_id, tag_id) VALUES (1, 1), (1, 2);

-- 7. Insert Comments (Module D)
INSERT INTO comments (resource_id, user_id, content, created_at)
VALUES (1, 1, 'This garden is absolutely breathtaking! I visited last year and the atmosphere is so peaceful.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
       (1, 2, 'The architectural details are fascinating. Does anyone know more about the specific stones used in the rockeries?', DATE_SUB(NOW(), INTERVAL 1 DAY));
