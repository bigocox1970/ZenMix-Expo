-- ZenMix Database Schema

-- Enable UUID extension for Postgres
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types if needed
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    avatar_url TEXT,
    username TEXT,
    preferred_background TEXT,
    notifications BOOLEAN,
    description TEXT,
    role user_role DEFAULT 'user'
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Meditation_presets table
CREATE TABLE meditation_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    tags TEXT[]
);

-- Sound_files table
CREATE TABLE sound_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    description TEXT
);

-- Location_states table
CREATE TABLE location_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User_states table
CREATE TABLE user_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    location TEXT
);

-- Favorite_sounds table
CREATE TABLE favorite_sounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sound_id UUID REFERENCES sound_files(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Preset_sounds table (junction table for meditation_presets and sound_files)
CREATE TABLE preset_sounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preset_id UUID REFERENCES meditation_presets(id) ON DELETE CASCADE,
    sound_id UUID REFERENCES sound_files(id) ON DELETE CASCADE,
    volume FLOAT DEFAULT 1.0,
    is_playing BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(preset_id, sound_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_meditation_presets_user_id ON meditation_presets(user_id);
CREATE INDEX idx_sound_files_category_id ON sound_files(category_id);
CREATE INDEX idx_user_states_user_id ON user_states(user_id);
CREATE INDEX idx_favorite_sounds_user_id ON favorite_sounds(user_id);
CREATE INDEX idx_favorite_sounds_sound_id ON favorite_sounds(sound_id);
CREATE INDEX idx_preset_sounds_preset_id ON preset_sounds(preset_id);
CREATE INDEX idx_preset_sounds_sound_id ON preset_sounds(sound_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meditation_presets_updated_at
    BEFORE UPDATE ON meditation_presets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sound_files_updated_at
    BEFORE UPDATE ON sound_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_states_updated_at
    BEFORE UPDATE ON location_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_states_updated_at
    BEFORE UPDATE ON user_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_favorite_sounds_updated_at
    BEFORE UPDATE ON favorite_sounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preset_sounds_updated_at
    BEFORE UPDATE ON preset_sounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to tables
COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON TABLE profiles IS 'Stores user profile information';
COMMENT ON TABLE categories IS 'Stores sound categories';
COMMENT ON TABLE meditation_presets IS 'Stores user-created meditation presets';
COMMENT ON TABLE sound_files IS 'Stores information about available sound files';
COMMENT ON TABLE location_states IS 'Stores possible location states';
COMMENT ON TABLE user_states IS 'Stores user state information';
COMMENT ON TABLE favorite_sounds IS 'Stores user favorite sounds';
COMMENT ON TABLE preset_sounds IS 'Junction table linking presets with sounds and their settings'; 