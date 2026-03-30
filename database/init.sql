-- ============================================================
-- Community Heritage Resource Sharing and Curation Platform
-- Database Initialization Script
-- Group 26 | CPT202
-- ============================================================

CREATE DATABASE IF NOT EXISTS heritage_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE heritage_db;

-- ------------------------------------------------------------
-- Module B: Resource Submission
-- Table: resources
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resources (
    id                   BIGINT          NOT NULL AUTO_INCREMENT,
    contributor_id       BIGINT          NOT NULL COMMENT 'FK to users.id (Module A)',
    title                VARCHAR(30)     DEFAULT NULL COMMENT 'Max 30 chars',
    category             VARCHAR(50)     DEFAULT NULL,
    theme                VARCHAR(50)     DEFAULT NULL,
    place                VARCHAR(50)     DEFAULT NULL,
    description          TEXT            DEFAULT NULL COMMENT 'Max 2000 chars',
    tags                 VARCHAR(255)    DEFAULT NULL COMMENT 'Space-separated, each starting with #',
    file_path            VARCHAR(512)    DEFAULT NULL COMMENT 'Server-side file path after upload',
    external_link        VARCHAR(512)    DEFAULT NULL,
    copyright_declaration TEXT           DEFAULT NULL,
    status               VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
                             COMMENT 'DRAFT | PENDING_REVIEW | APPROVED | REJECTED',
    review_feedback      TEXT            DEFAULT NULL,
    created_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_contributor_id (contributor_id),
    INDEX idx_status (status),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Module B: submitted heritage resources';
