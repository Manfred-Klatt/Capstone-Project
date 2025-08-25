# Animal Crossing Quiz Game

A fun and interactive quiz game based on Animal Crossing New Horizons, featuring authentication, leaderboards, and real-time gameplay.

## ✨ Features

- **User Authentication**
  - Sign up, login, and password reset
  - JWT-based authentication with refresh tokens
  - Role-based access control (user/admin)

- **Gameplay**
  - Multiple categories (villagers, fish, bugs, and sea creatures)
  - Different difficulty levels
  - Real-time scoring and feedback
  - Global and friend leaderboards

- **User Profiles**
  - Track game history and statistics
  - View achievements and progress
  - Customize your profile

- **API**
  - RESTful API with proper HTTP status codes
  - Rate limiting and security headers
  - Input validation and sanitization
  - Comprehensive error handling and logging

## 🛠 Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Logging**: Winston with daily rotation
- **Documentation**: OpenAPI/Swagger
- **Testing**: Jest, Supertest
- **Code Quality**: ESLint, Prettier

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- npm (v8 or higher) or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/acnh-quiz-game.git
   cd acnh-quiz-game
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory and add the following variables:
   ```env
   NODE_ENV=development
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/acnh-quiz
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=90d
   JWT_COOKIE_EXPIRES_IN=90
   CORS_ORIGIN=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Seed the database with sample data (optional):
   ```bash
   npm run seed
   # or
   yarn seed
   ```

## API Documentation

1. Generate API documentation:
   ```bash
   npm run docs
   # or
   yarn docs
   ```

2. Serve the documentation:
   ```bash
   npm run serve:docs
   # or
   yarn serve:docs
   ```

   Then open `http://localhost:8080` in your browser.

## Testing

Run the test suite:

```bash
npm test
# or
yarn test
```

Run tests with coverage:

```bash
npm run test:coverage
# or
yarn test:coverage
```

## Deployment

1. Set up production environment variables in your hosting provider.
2. Build the frontend (if applicable).
3. Start the production server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Application environment | `development` |
| PORT | Port to run the server on | `8000` |
| MONGODB_URI | MongoDB connection string | `mongodb://localhost:27017/acnh-quiz` |
| JWT_SECRET | Secret for JWT signing | (required) |
| JWT_EXPIRES_IN | JWT expiration time | `90d` |
| JWT_COOKIE_EXPIRES_IN | JWT cookie expiration in days | `90` |
| CORS_ORIGIN | Allowed CORS origins | `http://localhost:3000` |
| RATE_LIMIT_WINDOW_MS | Rate limiting window in milliseconds | `15 * 60 * 1000` (15 minutes) |
| RATE_LIMIT_MAX | Maximum requests per window | `100` |

## 📁 Project Structure

```plaintext
.
├── src/                      # Source code
│   ├── api/                  # API routes and controllers
│   ├── config/               # Application configuration
│   ├── loaders/              # Application loaders (express, mongoose, socket.io)
│   ├── middleware/           # Express middleware
│   ├── models/               # Database models
│   ├── services/             # Business logic
│   ├── utils/                # Utility functions
│   ├── app.js                # Express application
│   └── server.js             # Server entry point
├── scripts/                  # Utility scripts
├── tests/                    # Test files
├── .env.example              # Example environment variables
├── .eslintrc.js              # ESLint configuration
├── .gitignore                # Git ignore file
├── package.json              # Project dependencies and scripts
└── README.md                 # Project documentation
```

```
src/
├── api/                    # API routes and controllers
│   └── v1/                 # API versioning
│       ├── auth/           # Authentication routes and controllers
│       ├── users/          # User management routes and controllers
│       └── game/           # Game-related routes and controllers
├── config/                 # Configuration files
│   ├── db.js               # Database configuration
│   └── index.js            # Main configuration
├── loaders/                # Application loaders
│   ├── express.js          # Express app configuration
│   ├── mongodb.js          # MongoDB connection
│   └── socketio.js         # Socket.IO configuration
├── middleware/             # Custom middleware
│   ├── auth.js             # Authentication middleware
│   └── error.js            # Error handling middleware
├── models/                 # Database models
│   ├── User.js             # User model
│   └── Game.js             # Game model
├── services/               # Business logic
│   ├── auth.service.js     # Authentication service
│   ├── user.service.js     # User service
│   └── game.service.js     # Game service
├── utils/                  # Utility functions
│   ├── apiFeatures.js      # API features (filtering, sorting, etc.)
│   └── appError.js         # Custom error class
└── app.js                  # Main application entry point
```

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Admin Tools and Leaderboard Management

### Accessing Admin Tools

The game includes admin tools for managing leaderboard data. To access these tools:

1. Click on the Nook icon in the top-left corner of the game screen 5 times within 3 seconds
2. Enter the passcode: `blathers`
3. The admin tools panel will appear with various options

### Initializing Leaderboard Data

If you encounter a 500 Internal Server Error when accessing leaderboard data, you may need to initialize the MongoDB database with sample data:

1. Access the admin tools as described above
2. Click the "Initialize Leaderboard Data" button (green button at the top)
3. Confirm the initialization when prompted
4. Wait for the confirmation message that data has been initialized

### Testing Leaderboard API

A standalone test page is available to verify the leaderboard API functionality:

1. Open `leaderboard-test.html` in your browser
2. The page will automatically check API connectivity
3. Use the "Initialize Leaderboard Data" button to populate the database
4. Test different category leaderboards using the category buttons

### Troubleshooting Leaderboard Issues

- If the leaderboard shows "No scores yet" after initialization, check the browser console for API errors
- Verify that the MongoDB connection string in `.env` is correct (should match the format below)
- Ensure the server is running and accessible at the expected URL
- The game will fall back to local storage if the server is unavailable

### MongoDB Connection

The application uses MongoDB Atlas for persistent storage. The connection string in `.env` should follow this format:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.vswiduv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

If you encounter 500 Internal Server Error responses from the API, check that:

1. The MongoDB connection string is correct (username and password)
2. The MongoDB Atlas cluster is running and accessible
3. The API endpoints are correctly formatted with `/api/v1/` prefix

### API Endpoints

The game uses the following API endpoints:

- `GET /api/v1/leaderboard/{category}` - Get leaderboard data for a specific category
- `POST /api/v1/submit-guest-score` - Submit a guest high score
- `POST /api/v1/initialize-leaderboard` - Initialize the leaderboard with sample data

You can test these endpoints using the included `test-api.js` script:

```bash
node test-api.js
```

## Acknowledgments

- Animal Crossing and its assets are property of Nintendo.
- This project is for educational purposes only.
