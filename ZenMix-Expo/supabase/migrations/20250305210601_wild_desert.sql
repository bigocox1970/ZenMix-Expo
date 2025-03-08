/*
  # Update Mixes Table Schema

  1. Changes
    - Make tracks column nullable
    - Add default values for duration and is_public
    - Add created_at timestamp

  2. Security
    - Ensure RLS policies are in place
*/

-- Update mixes table
ALTER TABLE mixes
ALTER COLUMN tracks DROP NOT NULL,
ALTER COLUMN duration SET DEFAULT 30,
ALTER COLUMN is_public SET DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Enable RLS if not already enabled
ALTER TABLE mixes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own mixes" ON mixes;
  DROP POLICY IF EXISTS "Users can create mixes" ON mixes;
  DROP POLICY IF EXISTS "Users can update own mixes" ON mixes;
  DROP POLICY IF EXISTS "Users can delete own mixes" ON mixes;
END $$;

-- Create policies
CREATE POLICY "Users can read own mixes"
  ON mixes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create mixes"
  ON mixes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mixes"
  ON mixes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mixes"
  ON mixes
  FOR DELETE
  USING (auth.uid() = user_id);