#!/bin/bash
# Simple build script for Railway

echo "Cleaning npm cache..."
npm cache clean --force

echo "Removing node_modules/.cache if it exists..."
rm -rf node_modules/.cache || true

echo "Installing dependencies..."
npm ci --omit=dev --no-fund --no-audit

echo "Build completed successfully!"
