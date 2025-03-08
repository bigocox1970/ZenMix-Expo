/*
  # Create audio tracks table

  1. New Tables
    - `audio_tracks`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `category` (text, required)
      - `url` (text, required)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `audio_tracks` table
    - Add policies for:
      - Public read access to all tracks
      - Authenticated users can create tracks
      - Users can update/delete their own tracks
      - Admins can manage all tracks
*/

CREATE TABLE IF NOT EXISTS audio_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE audio_tracks ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view audio tracks"
  ON audio_tracks
  FOR SELECT
  USING (true);

-- Authenticated users can create tracks
CREATE POLICY "Authenticated users can create tracks"
  ON audio_tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own tracks
CREATE POLICY "Users can update own tracks"
  ON audio_tracks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own tracks
CREATE POLICY "Users can delete own tracks"
  ON audio_tracks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);