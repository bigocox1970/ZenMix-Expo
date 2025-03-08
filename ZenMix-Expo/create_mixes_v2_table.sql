-- Create a new table for storing mixes with tracks as JSON
CREATE TABLE IF NOT EXISTS mixes_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 300,
  is_public BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tracks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for user_id for faster queries
CREATE INDEX IF NOT EXISTS mixes_v2_user_id_idx ON mixes_v2(user_id);

-- Add index for public mixes
CREATE INDEX IF NOT EXISTS mixes_v2_is_public_idx ON mixes_v2(is_public);

-- Add RLS policies
ALTER TABLE mixes_v2 ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own mixes or public mixes
CREATE POLICY select_own_or_public_mixes_v2 ON mixes_v2
  FOR SELECT USING (
    auth.uid() = user_id OR is_public = true
  );

-- Policy for users to insert their own mixes
CREATE POLICY insert_own_mixes_v2 ON mixes_v2
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policy for users to update their own mixes
CREATE POLICY update_own_mixes_v2 ON mixes_v2
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Policy for users to delete their own mixes
CREATE POLICY delete_own_mixes_v2 ON mixes_v2
  FOR DELETE USING (
    auth.uid() = user_id
  );
