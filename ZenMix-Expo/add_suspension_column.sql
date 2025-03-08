-- Add is_suspended column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- Update any existing rows to have is_suspended set to false
UPDATE profiles
SET is_suspended = false
WHERE is_suspended IS NULL;
