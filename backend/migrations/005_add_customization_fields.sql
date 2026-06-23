-- Alter site_settings table to add advanced customization support
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT 'Tajawal';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS card_style VARCHAR(50) DEFAULT 'medium';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bg_sparkles VARCHAR(50) DEFAULT 'none';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS primary_color VARCHAR(50) DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(50) DEFAULT '';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS background_color VARCHAR(50) DEFAULT '';
