const fetch = require('node-fetch');

// Configuration
const API_URL = 'https://capstone-project-production-3cce.up.railway.app/api/v1';
const SECRET_KEY = 'initialize-leaderboard-123';

// Test functions
async function testInitializeLeaderboard() {
  console.log('Testing leaderboard initialization...');
  
  try {
    const response = await fetch(`${API_URL}/initialize-leaderboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secretKey: SECRET_KEY
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Failed to initialize leaderboard: ${response.status}`, errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Leaderboard initialized successfully:', data.message);
    return true;
  } catch (error) {
    console.error('❌ Error initializing leaderboard:', error.message);
    return false;
  }
}

async function testGetLeaderboard(category = 'fish') {
  console.log(`Testing get leaderboard for ${category}...`);
  
  try {
    const response = await fetch(`${API_URL}/leaderboard/${category}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Failed to get ${category} leaderboard: ${response.status}`, errorData);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Got ${category} leaderboard:`, data.length, 'entries');
    console.log(data.slice(0, 3)); // Show top 3 entries
    return true;
  } catch (error) {
    console.error(`❌ Error getting ${category} leaderboard:`, error.message);
    return false;
  }
}

async function testSubmitGuestScore() {
  console.log('Testing guest score submission...');
  
  try {
    const response = await fetch(`${API_URL}/submit-guest-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'TestUser',
        category: 'fish',
        score: 85
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Failed to submit guest score: ${response.status}`, errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Guest score submitted successfully:', data.data.message);
    return true;
  } catch (error) {
    console.error('❌ Error submitting guest score:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('=== STARTING API TESTS ===');
  console.log(`API URL: ${API_URL}`);
  console.log('------------------------');
  
  // Test initialize leaderboard
  const initResult = await testInitializeLeaderboard();
  console.log('------------------------');
  
  // Test get leaderboard for each category
  const categories = ['fish', 'bugs', 'sea', 'villagers'];
  for (const category of categories) {
    await testGetLeaderboard(category);
    console.log('------------------------');
  }
  
  // Test submit guest score
  await testSubmitGuestScore();
  console.log('------------------------');
  
  console.log('=== API TESTS COMPLETED ===');
}

// Run all tests
runTests();
