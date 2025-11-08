-- =========================================================
-- Add password_custom column to warga table
-- =========================================================
USE fundraising_dbcopyyy;

-- Check if column exists before adding
ALTER TABLE warga 
ADD COLUMN IF NOT EXISTS password_custom VARCHAR(255) DEFAULT NULL 
COMMENT 'Custom password untuk warga, jika NULL gunakan default 1234';

-- Add additional columns that might be useful
ALTER TABLE warga 
ADD COLUMN IF NOT EXISTS email VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS alamat TEXT DEFAULT NULL;

-- Show the updated table structure
DESCRIBE warga;
