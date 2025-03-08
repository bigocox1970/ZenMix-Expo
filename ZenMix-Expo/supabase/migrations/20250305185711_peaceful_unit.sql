/*
  # Add suspension status to profiles

  1. Changes
    - Add is_suspended column to profiles table with default false
    - Add comment explaining the column's purpose
*/

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

COMMENT ON COLUMN profiles.is_suspended IS 'Boolean flag indicating if the user account is suspended';