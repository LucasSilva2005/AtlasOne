
-- V7: Add authentication support to application users.

ALTER TABLE app_users
ADD COLUMN password_hash VARCHAR(255) NOT NULL;
