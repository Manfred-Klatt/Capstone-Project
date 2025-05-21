-- Create the database if it doesn't exist
-- Run this command separately: CREATE DATABASE acnh_game;

-- Connect to the database
\c acnh_game;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create high scores table
CREATE TABLE IF NOT EXISTS high_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL, -- 'fish', 'bugs', 'sea', 'villagers'
    score INTEGER NOT NULL DEFAULT 0,
    date_achieved TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category)
);

-- Create sessions table for managing user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE
);

-- Create leaderboard view for easy querying
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    u.username,
    h.category,
    h.score,
    h.date_achieved
FROM high_scores h
JOIN users u ON h.user_id = u.id
ORDER BY h.category, h.score DESC;

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_high_scores_user_id ON high_scores(user_id);
CREATE INDEX idx_high_scores_category ON high_scores(category);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
