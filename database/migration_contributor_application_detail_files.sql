-- Upgrade an existing heritage_db for contributor application detail review.
-- Safe to run multiple times.
USE heritage_db;

ALTER TABLE contributor_applications
    MODIFY COLUMN reason TEXT NULL;

SET @has_reject_reason := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contributor_applications'
      AND COLUMN_NAME = 'reject_reason'
);

SET @add_reject_reason_sql := IF(
    @has_reject_reason = 0,
    'ALTER TABLE contributor_applications ADD COLUMN reject_reason VARCHAR(1000) NULL AFTER reason',
    'SELECT ''reject_reason already exists'''
);

PREPARE add_reject_reason_stmt FROM @add_reject_reason_sql;
EXECUTE add_reject_reason_stmt;
DEALLOCATE PREPARE add_reject_reason_stmt;

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

SET @has_application_file_fk := (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'contributor_application_files'
      AND CONSTRAINT_NAME = 'fk_contributor_application_files_application'
);

SET @add_application_file_fk_sql := IF(
    @has_application_file_fk = 0,
    'ALTER TABLE contributor_application_files ADD CONSTRAINT fk_contributor_application_files_application FOREIGN KEY (application_id) REFERENCES contributor_applications (id) ON DELETE CASCADE',
    'SELECT ''application file foreign key already exists'''
);

PREPARE add_application_file_fk_stmt FROM @add_application_file_fk_sql;
EXECUTE add_application_file_fk_stmt;
DEALLOCATE PREPARE add_application_file_fk_stmt;
