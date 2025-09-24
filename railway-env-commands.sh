#!/bin/bash
# Commands to set up environment variables in Railway

# Link to the correct service first
echo "First, link to your main application service:"
echo "railway link"
echo ""
echo "Then run these commands to set environment variables:"

# Essential environment variables
echo "railway variables set JWT_SECRET=\"*ogMU&%cx!u8iUw^KgGDA8neFF@oGMA9&9U^Cr8Jzb2o6dMqYc#4iSbz2X%x$Xc4\""
echo "railway variables set JWT_EXPIRES_IN=\"7d\""
echo "railway variables set JWT_COOKIE_EXPIRES_IN=\"90\""
echo "railway variables set NODE_ENV=\"production\""
echo "railway variables set CORS_ORIGIN=\"https://blathers.app\""
echo "railway variables set GUEST_LEADERBOARD_TOKEN=\"a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9\""
echo "railway variables set GUEST_IMAGE_TOKEN=\"a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9\""
echo "railway variables set SESSION_SECRET=\"acnh_quiz_session_production_secret_2024_blathers\""
echo "railway variables set NOOKIPEDIA_API_KEY=\"6f2b7c8f-9a1d-4e3c-b0f2-e5d4c3b2a1f0\""

# MongoDB connection string
echo "railway variables set MONGODB_URI=\"mongodb+srv://manfredjklatt:ZLjT2en0MjBgjnkF@cluster0.vswiduv.mongodb.net/acnh-quiz?retryWrites=true&w=majority&appName=Cluster0\""

echo ""
echo "After setting all variables, deploy your application:"
echo "railway up"
