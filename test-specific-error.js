#!/usr/bin/env node

/**
 * Test specific error details
 * This script tests individual components to isolate the 500 error
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
        'User-Agent': 'Error-Test/1.0',
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
          body: data
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

async function testSpecificEndpoints() {
  console.log('🔍 Testing Specific Endpoints for Error Details');
  console.log('=' .repeat(50));

  // Test 1: Simple GET request to auth endpoint (should return 404 or method not allowed, not 500)
  console.log('\n1️⃣ Testing GET to /api/v1/auth (should not be 500)...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/auth`);
    console.log(`Status: ${response.status}`);
    console.log(`Body: ${response.body}`);
    
    if (response.status === 500) {
      console.log('❌ Even GET to /auth returns 500 - this indicates a routing/middleware issue');
    } else {
      console.log('✅ GET to /auth returns expected non-500 status');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Test with minimal signup data to see if it's a validation issue
  console.log('\n2️⃣ Testing minimal signup data...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      body: {
        username: 'test',
        email: 'test@test.com',
        password: '12345678',
        passwordConfirm: '12345678'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Body: ${response.body}`);
    
    if (response.status === 500) {
      console.log('❌ Minimal data still causes 500 - likely a code/import issue');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Test with empty body to see if it's a validation issue
  console.log('\n3️⃣ Testing empty body (should get validation error, not 500)...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      body: {}
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Body: ${response.body}`);
    
    if (response.status === 500) {
      console.log('❌ Empty body causes 500 - should be 400 validation error');
    } else if (response.status === 400) {
      console.log('✅ Empty body returns 400 validation error as expected');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Test other endpoints to see if it's auth-specific
  console.log('\n4️⃣ Testing leaderboard endpoint (non-auth)...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/leaderboard/fish`, {
      headers: {
        'X-Guest-Token': 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Body: ${response.body.substring(0, 200)}...`);
    
    if (response.status === 200) {
      console.log('✅ Leaderboard works - issue is specific to auth endpoints');
    } else if (response.status === 500) {
      console.log('❌ Leaderboard also returns 500 - broader issue');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 5: Test game endpoints
  console.log('\n5️⃣ Testing game categories endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/game/categories`);
    
    console.log(`Status: ${response.status}`);
    console.log(`Body: ${response.body.substring(0, 200)}...`);
    
    if (response.status === 200) {
      console.log('✅ Game endpoints work - issue is specific to auth');
    } else if (response.status === 500) {
      console.log('❌ Game endpoints also return 500 - broader issue');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 DIAGNOSIS:');
  console.log('If only auth endpoints return 500:');
  console.log('  - Check JWT_SECRET is properly set');
  console.log('  - Check User model import paths');
  console.log('  - Check auth service dependencies');
  console.log('');
  console.log('If all endpoints return 500:');
  console.log('  - Check MongoDB connection');
  console.log('  - Check global middleware issues');
  console.log('  - Check environment variable loading');
}

testSpecificEndpoints().catch(console.error);
