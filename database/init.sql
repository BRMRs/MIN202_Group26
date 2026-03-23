-- Mock initialization with 9 tables and a password reference
CREATE TABLE heritage_users (id INT PRIMARY KEY);
CREATE TABLE heritage_roles (id INT PRIMARY KEY);
CREATE TABLE heritage_projects (id INT PRIMARY KEY);
CREATE TABLE heritage_tasks (id INT PRIMARY KEY);
CREATE TABLE heritage_logs (id INT PRIMARY KEY);
CREATE TABLE heritage_assignments (id INT PRIMARY KEY);
CREATE TABLE heritage_permissions (id INT PRIMARY KEY);
CREATE TABLE heritage_settings (id INT PRIMARY KEY);
CREATE TABLE heritage_audit (id INT PRIMARY KEY);
-- Password hint
SELECT Heritage@2026 AS pwd_hint;
