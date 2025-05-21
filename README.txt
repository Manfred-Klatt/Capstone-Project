# Animal Crossing: New Horizons Identifier Game

## Overview
A fun and educational game where players test their knowledge of Animal Crossing: New Horizons by identifying various in-game creatures and characters. 
The game features multiple categories and difficulty levels. It also tracks high scores.

## Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Deployment**: Local server with Python's built-in HTTP server

## Features
- Multiple game categories (Fish, Bugs, Sea Creatures, Villagers)
- Three difficulty levels with varying time limits
- User authentication system
- High score tracking
- Responsive design for all device sizes
- Loading indicators and smooth animations

## Prerequisites
- Python 3.x (for local server)
- Node.js 14.x or higher
- PostgreSQL 12 or higher
- Modern web browser

## Setup Instructions

### 1. Database Setup
1. Install PostgreSQL if not already installed
2. Create a new database named `acnh_game`
3. Update the `.env` file in the backend directory with your database credentials

### 2. Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Start the server: `npm start`
   - For development with auto-reload: `npm run dev`

### 3. Frontend Setup
1. Open a new terminal in the project root directory
2. Start the local development server:
   - Double-click `start-server.bat`
   - Or run: `python -m http.server 8000 --bind 0.0.0.0`

## How to Play
1. Open your web browser and navigate to `http://localhost:8000`
2. Choose to play as a guest or sign up for an account
3. Select a category and difficulty level
4. Identify the displayed item before time runs out
5. Earn points for correct answers and try to beat your high score!

## Network Access
To access the game from other devices on your local network:
1. Find your computer's local IP address:
   - Windows: Open Command Prompt and type `ipconfig`
   - Look for "IPv4 Address" under your network adapter
2. On other devices, open a web browser and navigate to:
   `http://YOUR-IP-ADDRESS:8000`

## Troubleshooting
- Ensure all devices are on the same network
- Check that the backend server is running
- Verify database connection settings in `.env`
- Clear browser cache if experiencing display issues

## License
This project is for educational purposes only. All Animal Crossing content is property of Nintendo.
