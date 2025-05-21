# Animal Crossing Game - PostgreSQL Authentication System

This document provides instructions for setting up and using the PostgreSQL authentication system for the Animal Crossing Guessing Game.

## Prerequisites

- PostgreSQL 12+ installed on your system
- Node.js 14+ installed on your system
- npm or yarn package manager

## Database Setup

1. Install PostgreSQL if you haven't already:
   - Windows: Download and install from [PostgreSQL website](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql`
   - Linux: `sudo apt install postgresql postgresql-contrib`

2. Start the PostgreSQL service:
   - Windows: The installer typically sets up PostgreSQL as a service that starts automatically
   - macOS: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

3. Create the database:

   ```bash
   psql -U postgres
   CREATE DATABASE acnh_game;
   \q
   ```

4. Run the database setup script:

   ```bash
   psql -U postgres -d acnh_game -f database_setup.sql
   ```

## Environment Configuration

1. Update the `.env` file with your PostgreSQL credentials:

   ```
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=acnh_game
   ```

## Installing Dependencies

Install the required Node.js packages:

```bash
npm install
```

This will install all the necessary dependencies including:

- PostgreSQL client (pg)
- Express session with PostgreSQL store (connect-pg-simple)
- CORS for cross-origin requests
- bcrypt for password hashing
- jsonwebtoken for authentication tokens

## Running the Server

Start the server with:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## Authentication System Features

1. **User Registration**:
   - Username, email, and password required
   - Password is securely hashed using bcrypt
   - Initial high scores are created for all game categories

2. **User Login**:
   - Login with username or email
   - JWT token issued for authentication
   - Session stored in PostgreSQL database

3. **Profile Management**:
   - View user profile and high scores
   - Update email and password

4. **Secure Session Handling**:
   - Sessions stored in PostgreSQL database
   - Token expiration and validation
   - Logout functionality to invalidate sessions

5. **High Score Tracking**:
   - Separate high scores for each game category
   - Leaderboards for top players

## API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Login a user
- `GET /api/profile` - Get user profile (authenticated)
- `PUT /api/profile` - Update user profile (authenticated)
- `POST /api/save-score` - Save a game score (authenticated)
- `GET /api/leaderboard/:category` - Get leaderboard for a category
- `POST /api/logout` - Logout and invalidate session (authenticated)

## Security Considerations

1. All passwords are hashed using bcrypt before storage
2. JWT tokens are used for authentication
3. Sessions are stored in the PostgreSQL database
4. HTTPS should be enabled in production
5. Input validation is performed on all API endpoints

## Troubleshooting

- If you encounter connection issues, verify your PostgreSQL credentials in the `.env` file
- Ensure PostgreSQL service is running
- Check server logs for detailed error messages
