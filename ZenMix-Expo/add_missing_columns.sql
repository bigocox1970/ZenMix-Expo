-- Add is_suspended column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- Add notifications_enabled column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT false;

-- Update any existing rows with notifications to use notifications_enabled
UPDATE profiles
SET notifications_enabled = notifications
WHERE notifications IS NOT NULL;
