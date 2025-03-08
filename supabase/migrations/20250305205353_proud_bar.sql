/*
  # Create Mix Tracks Table

  1. New Tables
    - `mix_tracks`
      - `id` (uuid, primary key)
      - `mix_id` (uuid, foreign key to mixes)
      - `track_id` (uuid, foreign key to audio_tracks)
      - `volume` (float, default 1.0)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `mix_tracks` table
    - Add policies for authenticated users to manage their own mix tracks
*/

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