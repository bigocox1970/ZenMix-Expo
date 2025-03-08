/*
  # Create meditation sessions table

  1. New Tables
    - `meditation_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `duration` (integer, minutes)
      - `completed` (boolean)
      - `mix_id` (uuid, foreign key to mixes, optional)
      - `started_at` (timestamp)
      - `ended_at` (timestamp)
      - `mood_before` (text, optional)
      - `mood_after` (text, optional)
      - `notes` (text, optional)

  2. Security
    - Enable RLS
    - Add policies for user access control
*/

CREATE TABLE meditation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  duration integer NOT NULL,
  completed boolean DEFAULT true,
  mix_id uuid REFERENCES mixes(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  mood_before text,
  mood_after text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own sessions"
  ON meditation_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create sessions"
  ON meditation_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON meditation_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON meditation_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX idx_meditation_sessions_mix_id ON meditation_sessions(mix_id);
CREATE INDEX idx_meditation_sessions_started_at ON meditation_sessions(started_at);

-- Add trigger for updated_at
CREATE TRIGGER update_meditation_sessions_updated_at
    BEFORE UPDATE ON meditation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the avatars bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Create policy to allow users to update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- Create policy to allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

-- Create policy to allow public to view avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars'); 