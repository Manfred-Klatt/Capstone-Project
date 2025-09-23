// Script to check environment variables in the production environment
require('dotenv').config({ path: '.env.production' });

// Check environment variables
const checkEnvironmentVariables = () => {
  console.log('Checking environment variables...');
  
  // Required environment variables
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_COOKIE_EXPIRES_IN'
  ];
  
  // Optional environment variables
  const optionalVars = [
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX',
    'CORS_ORIGIN',
    'SESSION_SECRET',
    'GUEST_LEADERBOARD_TOKEN',
    'GUEST_IMAGE_TOKEN',
    'NOOKIPEDIA_API_KEY'
  ];
  
  // Check required variables
  console.log('\nRequired environment variables:');
  let missingRequired = false;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      console.error(`❌ ${varName} is missing!`);
      missingRequired = true;
    } else {
      // Mask sensitive values
      let displayValue = value;
      if (varName.includes('SECRET') || varName.includes('TOKEN') || varName.includes('PASSWORD') || varName.includes('URI')) {
        displayValue = value.substring(0, 3) + '...' + value.substring(value.length - 3);
      }
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  }
  
  // Check optional variables
  console.log('\nOptional environment variables:');
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (!value) {
      console.warn(`⚠️ ${varName} is not set`);
    } else {
      // Mask sensitive values
      let displayValue = value;
      if (varName.includes('SECRET') || varName.includes('TOKEN') || varName.includes('KEY')) {
        displayValue = value.substring(0, 3) + '...' + value.substring(value.length - 3);
      }
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  }
  
  // Check MongoDB URI format
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    console.log('\nChecking MongoDB URI format:');
    
    // Check if it includes the database name
    if (!mongoUri.includes('mongodb+srv://')) {
      console.error('❌ MONGODB_URI does not use mongodb+srv:// protocol');
    } else {
      console.log('✅ MONGODB_URI uses mongodb+srv:// protocol');
    }
    
    // Check if it includes the database name
    const dbNameMatch = mongoUri.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/);
    if (!dbNameMatch) {
      console.error('❌ MONGODB_URI does not include a database name');
      console.log('   Format should be: mongodb+srv://username:password@host/database?options');
    } else {
      console.log(`✅ MONGODB_URI includes database name: ${dbNameMatch[1]}`);
    }
    
    // Check if it includes retryWrites and w=majority
    if (!mongoUri.includes('retryWrites=true')) {
      console.warn('⚠️ MONGODB_URI does not include retryWrites=true');
    } else {
      console.log('✅ MONGODB_URI includes retryWrites=true');
    }
    
    if (!mongoUri.includes('w=majority')) {
      console.warn('⚠️ MONGODB_URI does not include w=majority');
    } else {
      console.log('✅ MONGODB_URI includes w=majority');
    }
  }
  
  // Check JWT configuration
  console.log('\nChecking JWT configuration:');
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      console.warn(`⚠️ JWT_SECRET is only ${jwtSecret.length} characters long. Recommended length is at least 32 characters.`);
    } else {
      console.log(`✅ JWT_SECRET length is ${jwtSecret.length} characters`);
    }
  }
  
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN;
  if (jwtExpiresIn) {
    console.log(`✅ JWT_EXPIRES_IN is set to ${jwtExpiresIn}`);
  }
  
  const jwtCookieExpiresIn = process.env.JWT_COOKIE_EXPIRES_IN;
  if (jwtCookieExpiresIn) {
    if (isNaN(jwtCookieExpiresIn)) {
      console.error(`❌ JWT_COOKIE_EXPIRES_IN is not a number: ${jwtCookieExpiresIn}`);
    } else {
      console.log(`✅ JWT_COOKIE_EXPIRES_IN is set to ${jwtCookieExpiresIn} days`);
    }
  }
  
  // Summary
  console.log('\nEnvironment variables summary:');
  if (missingRequired) {
    console.error('❌ Some required environment variables are missing!');
    return false;
  } else {
    console.log('✅ All required environment variables are set');
    return true;
  }
};

// Main function
const main = () => {
  console.log('Environment:', process.env.NODE_ENV);
  
  const envVarsValid = checkEnvironmentVariables();
  
  if (envVarsValid) {
    console.log('\n✅ Environment variables are valid!');
  } else {
    console.error('\n❌ Environment variables are invalid!');
  }
};

// Run the script
main();
