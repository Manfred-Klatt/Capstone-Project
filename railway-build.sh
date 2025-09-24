#!/bin/bash
# Custom build script for Railway deployment

# Clear npm cache first to avoid EBUSY errors
echo "Clearing npm cache..."
npm cache clean --force

# Install dependencies without dev dependencies
echo "Installing production dependencies..."
npm ci --omit=dev --no-fund --no-audit

# Create uploads directory
echo "Creating uploads directory..."
mkdir -p /app/uploads

echo "Build completed successfully!"
