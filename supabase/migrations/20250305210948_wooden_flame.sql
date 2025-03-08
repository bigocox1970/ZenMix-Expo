/*
  # Fix Mixes Schema

  1. Changes
    - Drop and recreate mixes table with proper structure
    - Create mix_tracks table for track relationships
    - Set up RLS policies for both tables

  2. Security
    - Enable RLS on both tables
    - Add policies for user access control
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS mix_tracks;
DROP TABLE IF EXISTS mixes;

-- Create mixes table
CREATE TABLE mixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration integer NOT NULL DEFAULT 30,
  is_public boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create mix_tracks table
CREATE TABLE mix_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mix_id uuid NOT NULL REFERENCES mixes(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES audio_tracks(id) ON DELETE CASCADE,
  volume float NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mix_tracks ENABLE ROW LEVEL SECURITY;

-- Policies for mixes
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

-- Policies for mix_tracks
CREATE POLICY "Users can read mix tracks for their mixes" 
  ON mix_tracks 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM mixes 
      WHERE mixes.id = mix_tracks.mix_id 
      AND mixes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create mix tracks for their mixes" 
  ON mix_tracks 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mixes 
      WHERE mixes.id = mix_tracks.mix_id 
      AND mixes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update mix tracks for their mixes" 
  ON mix_tracks 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM mixes 
      WHERE mixes.id = mix_tracks.mix_id 
      AND mixes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete mix tracks for their mixes" 
  ON mix_tracks 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM mixes 
      WHERE mixes.id = mix_tracks.mix_id 
      AND mixes.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX mix_tracks_mix_id_idx ON mix_tracks(mix_id);
CREATE INDEX mix_tracks_track_id_idx ON mix_tracks(track_id);
CREATE INDEX mixes_user_id_idx ON mixes(user_id);