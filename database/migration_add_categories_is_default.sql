-- 在已有 heritage_db 上手工升级时使用（若使用 spring.jpa.hibernate.ddl-auto=update 则由 Hibernate 自动加列，可跳过本脚本）
USE heritage_db;

ALTER TABLE categories
    ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT '系统预置分类；管理员新建为 FALSE'
        AFTER status;
