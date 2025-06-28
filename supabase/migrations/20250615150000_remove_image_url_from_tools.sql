-- Remove image_url column from tools table as it has no functionality
ALTER TABLE tools DROP COLUMN IF EXISTS image_url;