/**
 * Update Railway Environment Variables
 * 
 * This script provides instructions for updating environment variables in Railway.
 * It lists all the required environment variables for the Animal Crossing Quiz Game.
 * 
 * Usage:
 * node updateRailwayEnvVars.js
 */

// Required environment variables
const requiredEnvVars = [
  {
    name: 'NODE_ENV',
    value: 'production',
    description: 'Environment mode'
  },
  {
    name: 'JWT_SECRET',
    value: '*ogMU&%cx!u8iUw^KgGDA8neFF@oGMA9&9U^Cr8Jzb2o6dMqYc#4iSbz2X%x$Xc4',
    description: 'Secret key for JWT token generation'
  },
  {
    name: 'JWT_EXPIRES_IN',
    value: '7d',
    description: 'JWT token expiration time'
  },
  {
    name: 'JWT_COOKIE_EXPIRES_IN',
    value: '90',
    description: 'JWT cookie expiration time in days'
  },
  {
    name: 'CORS_ORIGIN',
    value: 'https://blathers.app',
    description: 'Allowed CORS origins'
  },
  {
    name: 'RATE_LIMIT_WINDOW_MS',
    value: '900000',
    description: 'Rate limiting window in milliseconds'
  },
  {
    name: 'RATE_LIMIT_MAX_REQUESTS',
    value: '100',
    description: 'Maximum requests per rate limit window'
  },
  {
    name: 'LOG_LEVEL',
    value: 'info',
    description: 'Logging level'
  },
  {
    name: 'NOOKIPEDIA_API_KEY',
    value: '6f2b7c8f-9a1d-4e3c-b0f2-e5d4c3b2a1f0',
    description: 'Nookipedia API key'
  },
  {
    name: 'GUEST_LEADERBOARD_TOKEN',
    value: 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9',
    description: 'Token for guest leaderboard access'
  },
  {
    name: 'GUEST_IMAGE_TOKEN',
    value: 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9',
    description: 'Token for guest image access'
  },
  {
    name: 'SESSION_SECRET',
    value: 'acnh_quiz_session_production_secret_2024_blathers',
    description: 'Secret for session management'
  }
];

// Print instructions
console.log('='.repeat(80));
console.log('RAILWAY ENVIRONMENT VARIABLES SETUP');
console.log('='.repeat(80));
console.log('\nTo set up environment variables in Railway:');
console.log('\n1. Go to the Railway dashboard: https://railway.app/dashboard');
console.log('2. Select your project "blathers.app"');
console.log('3. Click on your service (Capstone-Project)');
console.log('4. Go to the "Variables" tab');
console.log('5. Add or update the following environment variables:');
console.log('\n');

// Print environment variables table
console.log('| Variable Name | Value | Description |');
console.log('|---------------|-------|-------------|');

requiredEnvVars.forEach(envVar => {
  const value = envVar.name.includes('SECRET') || envVar.name.includes('TOKEN') || envVar.name.includes('KEY') 
    ? '********' // Mask sensitive values
    : envVar.value;
  
  console.log(`| ${envVar.name.padEnd(13)} | ${value.padEnd(5)} | ${envVar.description} |`);
});

console.log('\n');
console.log('Note: The MONGODB_URI variable will be automatically set by Railway when you create a MongoDB database.');
console.log('\nFor security reasons, you should generate your own values for the following variables:');
console.log('- JWT_SECRET');
console.log('- SESSION_SECRET');
console.log('- GUEST_LEADERBOARD_TOKEN');
console.log('- GUEST_IMAGE_TOKEN');
console.log('\nYou can generate secure random values using:');
console.log('node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
console.log('\n');

// Check current environment variables
console.log('Current environment variables:');
Object.keys(process.env)
  .filter(key => requiredEnvVars.some(envVar => envVar.name === key))
  .forEach(key => {
    const value = key.includes('SECRET') || key.includes('TOKEN') || key.includes('KEY')
      ? '********' // Mask sensitive values
      : process.env[key];
    
    console.log(`${key}: ${value}`);
  });

console.log('\n');
console.log('='.repeat(80));
