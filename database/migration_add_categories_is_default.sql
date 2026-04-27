-- Manual upgrade for an existing heritage_db. Skip this if Hibernate already added the column.
USE heritage_db;

ALTER TABLE categories
    ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Built-in category; admin-created categories use FALSE'
        AFTER status;
