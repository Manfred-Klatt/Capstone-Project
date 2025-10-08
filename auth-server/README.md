# Authentication Server for Blathers App

This is a standalone authentication server for the Animal Crossing Quiz Game (Blathers App). It provides API endpoints for user registration, login, and account reactivation.

## Features

- User registration (signup)
- User authentication (login)
- Account reactivation
- MongoDB integration
- JWT token generation

## Deployment to Railway

### Prerequisites

1. [Railway account](https://railway.app/)
2. Git installed on your machine
3. Railway CLI (optional)

### Deployment Steps

#### Option 1: Deploy via Railway Dashboard

1. Create a new project in Railway dashboard
2. Connect your GitHub repository or use the "Deploy from GitHub" option
3. Select the repository and branch
4. Railway will automatically detect the Node.js project and deploy it

#### Option 2: Deploy via Railway CLI

1. Install Railway CLI:

   ```bash
   npm i -g @railway/cli
   ```

2. Login to Railway:

   ```bash
   railway login
   ```

3. Link to your project:

   ```bash
   railway link
   ```

4. Deploy the project:

   ```bash
   railway up
   ```

### Environment Variables

Set the following environment variables in Railway dashboard:

- `PORT`: The port on which the server will run (Railway sets this automatically)
- `MONGODB_URI`: Your MongoDB connection string with database name: `mongodb+srv://manfredjklatt:ZLjT2en0MjBgjnkF@cluster0.vswiduv.mongodb.net/acnh-quiz?retryWrites=true&w=majority&appName=Cluster0`
- `JWT_SECRET`: Secret key for JWT token generation (use a strong random string)
- `JWT_EXPIRES_IN`: JWT token expiration time (e.g., '90d')
- `NODE_ENV`: Set to 'production' for production deployment

## API Endpoints

### Health Check

- `GET /` - Root endpoint
- `GET /health` - Check if the server is running
- `GET /api/v1/health` - Check if the API and database connection are working

### Authentication

- `POST /api/v1/auth/signup` - Register a new user
  - Request body: `{ "username": "example", "email": "user@example.com", "password": "Password123!", "passwordConfirm": "Password123!" }`
  - Response: JWT token and user data

- `POST /api/v1/auth/login` - Login with existing credentials
  - Request body: `{ "email": "user@example.com", "password": "Password123!" }`
  - Response: JWT token and user data

- `POST /api/v1/auth/reactivate-account` - Reactivate a deactivated account
  - Request body: `{ "email": "user@example.com" }`
  - Response: Success message

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. For development with auto-restart:

   ```bash
   npm run dev
   ```

## Updating the Frontend

After deploying to Railway, update your frontend code to use the Railway-hosted authentication server URL.

1. In your index.html file, update the `ALTERNATE_API_URLS` array to include your new Railway URL:

   ```javascript
   const ALTERNATE_API_URLS = [
     'https://capstone-project-production-3cce.up.railway.app',
     'https://api.blathers.app',
     'https://acnh-auth-server.up.railway.app', // Your new Railway auth server URL
     'http://localhost:3000' // Local authentication server
   ];
   ```

2. Make sure your frontend's CORS settings allow requests from your Railway domain.

3. Test the connection by trying to log in through your application.
