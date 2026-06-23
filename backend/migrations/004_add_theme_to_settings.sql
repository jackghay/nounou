-- Alter site_settings table to add theme support
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'royal_gold';
