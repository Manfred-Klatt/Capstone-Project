// Script to check JWT configuration in the production environment
require('dotenv').config({ path: '.env.production' });
const jwt = require('jsonwebtoken');

// Check JWT configuration
const checkJwtConfig = () => {
  console.log('Checking JWT configuration...');
  
  // Check if JWT_SECRET is set
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('ERROR: JWT_SECRET is not set in the environment variables!');
    return false;
  }
  
  console.log('JWT_SECRET is set:', jwtSecret.substring(0, 3) + '...' + jwtSecret.substring(jwtSecret.length - 3));
  
  // Check if JWT_EXPIRES_IN is set
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN;
  if (!jwtExpiresIn) {
    console.error('ERROR: JWT_EXPIRES_IN is not set in the environment variables!');
    return false;
  }
  
  console.log('JWT_EXPIRES_IN is set:', jwtExpiresIn);
  
  // Check if JWT_COOKIE_EXPIRES_IN is set
  const jwtCookieExpiresIn = process.env.JWT_COOKIE_EXPIRES_IN;
  if (!jwtCookieExpiresIn) {
    console.error('ERROR: JWT_COOKIE_EXPIRES_IN is not set in the environment variables!');
    return false;
  }
  
  console.log('JWT_COOKIE_EXPIRES_IN is set:', jwtCookieExpiresIn);
  
  // Test JWT signing and verification
  try {
    const payload = { id: 'test-user-id' };
    console.log('Testing JWT signing with payload:', payload);
    
    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
    console.log('JWT token generated successfully:', token.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, jwtSecret);
    console.log('JWT token verified successfully:', decoded);
    
    return true;
  } catch (err) {
    console.error('ERROR: Failed to sign or verify JWT token:', err.message);
    return false;
  }
};

// Main function
const main = () => {
  console.log('Environment:', process.env.NODE_ENV);
  
  const jwtConfigValid = checkJwtConfig();
  
  if (jwtConfigValid) {
    console.log('JWT configuration is valid!');
  } else {
    console.error('JWT configuration is invalid!');
  }
};

// Run the script
main();
