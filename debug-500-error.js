#!/usr/bin/env node

/**
 * Debug 500 Error Script
 * Tests the Railway deployment to identify the root cause of 500 errors
 */

const https = require('https');

const BASE_URL = 'https://capstone-project-production-3cce.up.railway.app';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Script/1.0',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          raw: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function debugDeployment() {
  console.log('🔍 Debugging Railway Deployment 500 Errors');
  console.log('🌐 Base URL:', BASE_URL);
  console.log('=' .repeat(60));

  // Test 1: Basic health check
  console.log('\n1️⃣ Testing Basic Health Check...');
  try {
    const healthResponse = await makeRequest(`${BASE_URL}/health`);
    console.log(`Status: ${healthResponse.status}`);
    console.log(`Body: ${healthResponse.body}`);
    
    if (healthResponse.status === 200) {
      console.log('✅ Basic health check passed');
    } else {
      console.log('❌ Basic health check failed');
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }

  // Test 2: API health check
  console.log('\n2️⃣ Testing API Health Check...');
  try {
    const apiHealthResponse = await makeRequest(`${BASE_URL}/api/v1/health`);
    console.log(`Status: ${apiHealthResponse.status}`);
    console.log(`Body: ${apiHealthResponse.body}`);
    
    if (apiHealthResponse.status === 200) {
      console.log('✅ API health check passed');
      
      // Parse and check database status
      try {
        const healthData = JSON.parse(apiHealthResponse.body);
        if (healthData.database && healthData.database.status === 'connected') {
          console.log('✅ Database is connected');
        } else {
          console.log('❌ Database connection issue:', healthData.database);
        }
      } catch (e) {
        console.log('⚠️ Could not parse health response as JSON');
      }
    } else {
      console.log('❌ API health check failed');
    }
  } catch (error) {
    console.log('❌ API health check error:', error.message);
  }

  // Test 3: Test signup endpoint with minimal data
  console.log('\n3️⃣ Testing Signup Endpoint...');
  const testUser = {
    username: 'debugtest' + Date.now(),
    email: 'debug' + Date.now() + '@test.com',
    password: 'Test1234!',
    passwordConfirm: 'Test1234!'
  };

  try {
    const signupResponse = await makeRequest(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      body: testUser
    });
    
    console.log(`Status: ${signupResponse.status}`);
    console.log(`Headers:`, signupResponse.headers);
    console.log(`Body: ${signupResponse.body}`);
    
    if (signupResponse.status === 201) {
      console.log('✅ Signup successful');
    } else if (signupResponse.status === 500) {
      console.log('❌ 500 Internal Server Error detected');
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(signupResponse.body);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Raw error response:', signupResponse.body);
      }
    } else {
      console.log(`❌ Signup failed with status: ${signupResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Signup request error:', error.message);
  }

  // Test 4: Test login endpoint
  console.log('\n4️⃣ Testing Login Endpoint...');
  try {
    const loginResponse = await makeRequest(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'Test1234!'
      }
    });
    
    console.log(`Status: ${loginResponse.status}`);
    console.log(`Body: ${loginResponse.body}`);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
    } else if (loginResponse.status === 500) {
      console.log('❌ 500 Internal Server Error detected');
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(loginResponse.body);
        console.log('Error details:', errorData);
      } catch (e) {
        console.log('Raw error response:', loginResponse.body);
      }
    } else {
      console.log(`❌ Login failed with status: ${loginResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Login request error:', error.message);
  }

  // Test 5: Check if it's a CORS issue
  console.log('\n5️⃣ Testing CORS Headers...');
  try {
    const corsResponse = await makeRequest(`${BASE_URL}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log(`CORS Status: ${corsResponse.status}`);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': corsResponse.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': corsResponse.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': corsResponse.headers['access-control-allow-headers']
    });
  } catch (error) {
    console.log('❌ CORS test error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔍 Debug Summary:');
  console.log('If you see 500 errors above, the issue is likely:');
  console.log('1. Missing environment variables in Railway');
  console.log('2. Database connection issues');
  console.log('3. Import path errors in the code');
  console.log('4. Missing dependencies');
  console.log('\nCheck Railway logs for more detailed error messages.');
}

// Run the debug script
debugDeployment().catch(console.error);
