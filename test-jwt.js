// Script to test JWT functionality
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Test JWT signing and verification
const testJwt = () => {
  try {
    console.log('Testing JWT functionality...');
    
    // Check if JWT_SECRET is set
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET is not set in environment variables!');
      return false;
    }
    
    console.log(`✅ JWT_SECRET is set (length: ${jwtSecret.length} characters)`);
    
    // Check JWT_EXPIRES_IN
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '90d';
    console.log(`✅ JWT_EXPIRES_IN: ${jwtExpiresIn}`);
    
    // Check JWT_COOKIE_EXPIRES_IN
    const jwtCookieExpiresIn = process.env.JWT_COOKIE_EXPIRES_IN || 90;
    console.log(`✅ JWT_COOKIE_EXPIRES_IN: ${jwtCookieExpiresIn}`);
    
    // Create a test payload
    const payload = { 
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'user'
    };
    
    console.log('Creating JWT with payload:', payload);
    
    // Sign the token
    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
    
    if (!token) {
      console.error('❌ Failed to sign JWT token!');
      return false;
    }
    
    console.log(`✅ JWT token created successfully: ${token.substring(0, 20)}...`);
    
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret);
    
    if (!decoded) {
      console.error('❌ Failed to verify JWT token!');
      return false;
    }
    
    console.log('✅ JWT token verified successfully:', decoded);
    
    // Check token expiration
    const expiresAt = new Date(decoded.exp * 1000);
    console.log(`✅ Token expires at: ${expiresAt.toISOString()}`);
    
    return true;
  } catch (err) {
    console.error('❌ Error testing JWT:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    return false;
  }
};

// Main function
const main = () => {
  console.log('Environment:', process.env.NODE_ENV);
  
  const jwtTestPassed = testJwt();
  
  if (jwtTestPassed) {
    console.log('\n✅ JWT functionality is working correctly!');
  } else {
    console.error('\n❌ JWT functionality test failed!');
  }
};

// Run the script
main();
