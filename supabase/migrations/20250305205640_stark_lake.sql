/*
  # Update audio_tracks and favorites_sounds tables to use UUID

  1. Changes
    - Modify `id` column in `audio_tracks` table to use UUID type
    - Modify `sound_id` column in `favorites_sounds` table to use UUID type
    - Add default UUID generation for new records
    - Handle dependent constraints properly
    
  2. Migration Strategy
    - Drop dependent constraints first
    - Convert IDs to UUID in both tables
    - Recreate constraints with new UUID type
*/

DO $$ 
BEGIN
  -- First drop the dependent foreign key constraints
  ALTER TABLE favorites_sounds
  DROP CONSTRAINT IF EXISTS favorites_sounds_sound_id_fkey;

  -- Add new UUID column to audio_tracks
  ALTER TABLE audio_tracks 
  ADD COLUMN new_id uuid DEFAULT gen_random_uuid();

  -- Update new_id for existing records
  UPDATE audio_tracks 
  SET new_id = gen_random_uuid();

  -- Add new UUID column to favorites_sounds
  ALTER TABLE favorites_sounds
  ADD COLUMN new_sound_id uuid;

  -- Update new_sound_id to match the corresponding new_id from audio_tracks
  UPDATE favorites_sounds fs
  SET new_sound_id = at.new_id
  FROM audio_tracks at
  WHERE fs.sound_id = at.id::text;

  -- Drop the old primary key constraint
  ALTER TABLE audio_tracks 
  DROP CONSTRAINT IF EXISTS audio_tracks_pkey;

  -- Drop the old columns
  ALTER TABLE audio_tracks 
  DROP COLUMN id;

  ALTER TABLE favorites_sounds
  DROP COLUMN sound_id;

  -- Rename new columns
  ALTER TABLE audio_tracks 
  RENAME COLUMN new_id TO id;

  ALTER TABLE favorites_sounds
  RENAME COLUMN new_sound_id TO sound_id;

  -- Make the new id column the primary key
  ALTER TABLE audio_tracks 
  ADD PRIMARY KEY (id);

  -- Add NOT NULL constraint to sound_id
  ALTER TABLE favorites_sounds
  ALTER COLUMN sound_id SET NOT NULL;

  -- Recreate the foreign key constraint
  ALTER TABLE favorites_sounds
  ADD CONSTRAINT favorites_sounds_sound_id_fkey 
  FOREIGN KEY (sound_id) 
  REFERENCES audio_tracks(id)
  ON DELETE CASCADE;

  -- Now create the mix_tracks table with proper UUID foreign key
  CREATE TABLE IF NOT EXISTS mix_tracks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mix_id uuid REFERENCES mixes(id) ON DELETE CASCADE,
    track_id uuid REFERENCES audio_tracks(id) ON DELETE CASCADE,
    volume float DEFAULT 1.0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(mix_id, track_id)
  );

  -- Enable RLS on mix_tracks
  ALTER TABLE mix_tracks ENABLE ROW LEVEL SECURITY;

  -- Add RLS policies for mix_tracks
  CREATE POLICY "Users can read own mix tracks"
    ON mix_tracks
    FOR SELECT
    USING (
      auth.uid() IN (
        SELECT user_id FROM mixes WHERE id = mix_id
      )
    );

  CREATE POLICY "Users can insert mix tracks for own mixes"
    ON mix_tracks
    FOR INSERT
    WITH CHECK (
      auth.uid() IN (
        SELECT user_id FROM mixes WHERE id = mix_id
      )
    );

  CREATE POLICY "Users can update own mix tracks"
    ON mix_tracks
    FOR UPDATE
    USING (
      auth.uid() IN (
        SELECT user_id FROM mixes WHERE id = mix_id
      )
    );

  CREATE POLICY "Users can delete own mix tracks"
    ON mix_tracks
    FOR DELETE
    USING (
      auth.uid() IN (
        SELECT user_id FROM mixes WHERE id = mix_id
      )
    );
END $$;