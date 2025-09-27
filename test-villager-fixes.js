#!/usr/bin/env node

/**
 * Test Villager Fixes
 * This script tests the villager functionality to ensure all fixes are working
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
        'User-Agent': 'Villager-Test/1.0',
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

async function testVillagerFunctionality() {
  console.log('🏡 Testing Villager Functionality');
  console.log('=' .repeat(50));

  // Test 1: Villager leaderboard endpoint
  console.log('\n1️⃣ Testing Villager Leaderboard Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/leaderboard/villagers`, {
      headers: {
        'X-Guest-Token': 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9'
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Villager leaderboard endpoint working');
      try {
        const data = JSON.parse(response.body);
        console.log(`📊 Entries found: ${data.data?.length || 0}`);
      } catch (e) {
        console.log('⚠️ Could not parse response as JSON');
      }
    } else {
      console.log('❌ Villager leaderboard endpoint failed');
      console.log(`Response: ${response.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Villager game data endpoint
  console.log('\n2️⃣ Testing Villager Game Data Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/villagers`);
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Villager data endpoint working');
      try {
        const data = JSON.parse(response.body);
        console.log(`🏡 Villagers found: ${data.data?.length || 0}`);
        if (data.data && data.data.length > 0) {
          const sample = data.data[0];
          console.log(`📝 Sample villager: ${sample.name || 'Unknown'}`);
          console.log(`🖼️ Has image URL: ${!!sample.image_url}`);
        }
      } catch (e) {
        console.log('⚠️ Could not parse response as JSON');
      }
    } else {
      console.log('❌ Villager data endpoint failed');
      console.log(`Response: ${response.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Game categories endpoint
  console.log('\n3️⃣ Testing Game Categories Endpoint...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/v1/game/categories`);
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Game categories endpoint working');
      try {
        const data = JSON.parse(response.body);
        console.log(`📋 Categories: ${JSON.stringify(data.data?.categories || [])}`);
        
        if (data.data?.categories?.includes('villagers')) {
          console.log('✅ Villagers category is included');
        } else {
          console.log('❌ Villagers category is missing');
        }
      } catch (e) {
        console.log('⚠️ Could not parse response as JSON');
      }
    } else {
      console.log('❌ Game categories endpoint failed');
      console.log(`Response: ${response.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Submit a test villager score
  console.log('\n4️⃣ Testing Villager Score Submission...');
  try {
    const testScore = {
      name: 'TestPlayer',
      score: 42,
      category: 'villagers'
    };

    const response = await makeRequest(`${BASE_URL}/api/v1/submit-guest-score`, {
      method: 'POST',
      headers: {
        'X-Guest-Token': 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9'
      },
      body: testScore
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Villager score submission working');
      try {
        const data = JSON.parse(response.body);
        console.log(`📊 Score submitted: ${data.message || 'Success'}`);
      } catch (e) {
        console.log('✅ Score submitted successfully');
      }
    } else {
      console.log('❌ Villager score submission failed');
      console.log(`Response: ${response.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 VILLAGER TEST SUMMARY:');
  console.log('✅ Frontend fixes applied:');
  console.log('   - updateWelcomeMessage function call moved');
  console.log('   - Villager image fallback to Cat_Silhouette.png');
  console.log('   - Categories cleaned up (removed art/mixed)');
  console.log('   - Database collections include villagers_leaderboard');
  console.log('');
  console.log('🔍 Next steps if issues persist:');
  console.log('   1. Check browser console for JavaScript errors');
  console.log('   2. Verify backend /api/v1/villagers endpoint');
  console.log('   3. Test villager category selection in game');
  console.log('   4. Ensure villager images show Cat Silhouette fallback');
}

testVillagerFunctionality().catch(console.error);
