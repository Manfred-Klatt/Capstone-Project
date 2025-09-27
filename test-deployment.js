#!/usr/bin/env node

/**
 * Deployment Testing Script
 * Tests login, registration, and leaderboard functionalities
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.argv[2] || 'https://your-railway-app.railway.app';
const TEST_USER = {
  username: 'testuser' + Date.now(),
  email: 'test' + Date.now() + '@example.com',
  password: 'testpassword123',
  passwordConfirm: 'testpassword123'
};

console.log('🧪 Testing Animal Crossing Quiz Game Deployment');
console.log('🌐 Base URL:', BASE_URL);
console.log('👤 Test User:', { username: TEST_USER.username, email: TEST_USER.email });
console.log('=' .repeat(60));

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Deployment-Test-Script/1.0',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * Test functions
 */
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/health`);
    
    if (response.status === 200) {
      console.log('✅ Health check passed');
      console.log('📊 Response:', response.data);
      return true;
    } else {
      console.log('❌ Health check failed:', response.status);
      console.log('📄 Response:', response.raw);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  console.log('\n👤 Testing User Registration...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      body: TEST_USER
    });
    
    if (response.status === 201) {
      console.log('✅ User registration successful');
      console.log('🎫 Token received:', !!response.data.token);
      console.log('👤 User data:', response.data.data?.user);
      return { success: true, token: response.data.token, user: response.data.data?.user };
    } else {
      console.log('❌ User registration failed:', response.status);
      console.log('📄 Response:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    return { success: false };
  }
}

async function testUserLogin() {
  console.log('\n🔐 Testing User Login...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: {
        email: TEST_USER.email,
        password: TEST_USER.password
      }
    });
    
    if (response.status === 200) {
      console.log('✅ User login successful');
      console.log('🎫 Token received:', !!response.data.token);
      console.log('👤 User data:', response.data.data?.user);
      return { success: true, token: response.data.token, user: response.data.data?.user };
    } else {
      console.log('❌ User login failed:', response.status);
      console.log('📄 Response:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return { success: false };
  }
}

async function testLeaderboard(token = null) {
  console.log('\n🏆 Testing Leaderboard...');
  
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    // Test getting leaderboard
    const response = await makeRequest(`${BASE_URL}/api/v1/leaderboard/fish`, {
      headers
    });
    
    if (response.status === 200) {
      console.log('✅ Leaderboard fetch successful');
      console.log('📊 Leaderboard data:', {
        entries: response.data.data?.length || 0,
        sample: response.data.data?.slice(0, 3)
      });
      return { success: true, data: response.data };
    } else {
      console.log('❌ Leaderboard fetch failed:', response.status);
      console.log('📄 Response:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Leaderboard error:', error.message);
    return { success: false };
  }
}

async function testGuestToken() {
  console.log('\n🎭 Testing Guest Token...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/leaderboard/fish`, {
      headers: {
        'X-Guest-Token': 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Guest token access successful');
      console.log('📊 Guest leaderboard data:', {
        entries: response.data.data?.length || 0
      });
      return { success: true };
    } else {
      console.log('❌ Guest token access failed:', response.status);
      console.log('📄 Response:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Guest token error:', error.message);
    return { success: false };
  }
}

async function testGameEndpoints(token = null) {
  console.log('\n🎮 Testing Game Endpoints...');
  
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    // Test getting categories
    const response = await makeRequest(`${BASE_URL}/api/v1/game/categories`, {
      headers
    });
    
    if (response.status === 200) {
      console.log('✅ Game categories fetch successful');
      console.log('🎯 Categories:', response.data.data);
      return { success: true };
    } else {
      console.log('❌ Game categories fetch failed:', response.status);
      console.log('📄 Response:', response.data);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Game endpoints error:', error.message);
    return { success: false };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  const results = {
    healthCheck: false,
    registration: false,
    login: false,
    leaderboard: false,
    guestToken: false,
    gameEndpoints: false
  };
  
  let userToken = null;
  
  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  
  if (!results.healthCheck) {
    console.log('\n❌ Health check failed. Cannot proceed with other tests.');
    return results;
  }
  
  // Test 2: User Registration
  const registrationResult = await testUserRegistration();
  results.registration = registrationResult.success;
  if (registrationResult.success) {
    userToken = registrationResult.token;
  }
  
  // Test 3: User Login
  const loginResult = await testUserLogin();
  results.login = loginResult.success;
  if (loginResult.success && !userToken) {
    userToken = loginResult.token;
  }
  
  // Test 4: Leaderboard (with auth)
  results.leaderboard = (await testLeaderboard(userToken)).success;
  
  // Test 5: Guest Token
  results.guestToken = (await testGuestToken()).success;
  
  // Test 6: Game Endpoints
  results.gameEndpoints = (await testGameEndpoints(userToken)).success;
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const status = passed ? 'PASSED' : 'FAILED';
    console.log(`${icon} ${test.padEnd(20)} ${status}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\n📊 Overall Score:', `${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your deployment is fully functional!');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
  
  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  if (process.argv.length < 3) {
    console.log('Usage: node test-deployment.js <BASE_URL>');
    console.log('Example: node test-deployment.js https://your-app.railway.app');
    process.exit(1);
  }
  
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest };
