/*
  # Update audio_tracks table to use UUID

  1. Changes
    - Modify `id` column in `audio_tracks` table to use UUID type
    - Add default UUID generation for new records
    
  2. Migration Strategy
    - Create temporary column
    - Convert existing IDs to UUID
    - Drop old column and rename new column
*/

DO $$ 
BEGIN
  -- Add new UUID column
  ALTER TABLE audio_tracks 
  ADD COLUMN new_id uuid DEFAULT gen_random_uuid();

  -- Update new_id for existing records if any
  UPDATE audio_tracks 
  SET new_id = gen_random_uuid();

  -- Drop the old primary key constraint
  ALTER TABLE audio_tracks 
  DROP CONSTRAINT IF EXISTS audio_tracks_pkey;

  -- Drop the old id column
  ALTER TABLE audio_tracks 
  DROP COLUMN id;

  -- Rename new_id to id
  ALTER TABLE audio_tracks 
  RENAME COLUMN new_id TO id;

  -- Make the new id column the primary key
  ALTER TABLE audio_tracks 
  ADD PRIMARY KEY (id);
END $$;

-- Now create the mix_tracks table with proper UUID foreign key
CREATE TABLE IF NOT EXISTS mix_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mix_id uuid REFERENCES mixes(id) ON DELETE CASCADE,
  track_id uuid REFERENCES audio_tracks(id) ON DELETE CASCADE,
  volume float DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(mix_id, track_id)
);

ALTER TABLE mix_tracks ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own mix tracks
CREATE POLICY "Users can read own mix tracks"
  ON mix_tracks
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM mixes WHERE id = mix_id
    )
  );

-- Allow users to insert mix tracks for their own mixes
CREATE POLICY "Users can insert mix tracks for own mixes"
  ON mix_tracks
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM mixes WHERE id = mix_id
    )
  );

-- Allow users to update their own mix tracks
CREATE POLICY "Users can update own mix tracks"
  ON mix_tracks
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM mixes WHERE id = mix_id
    )
  );

-- Allow users to delete their own mix tracks
CREATE POLICY "Users can delete own mix tracks"
  ON mix_tracks
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM mixes WHERE id = mix_id
    )
  );