-- Add PIN and staff_id fields for cross-device offline PIN login
ALTER TABLE users ADD COLUMN pin TEXT;
ALTER TABLE users ADD COLUMN staff_id TEXT;
