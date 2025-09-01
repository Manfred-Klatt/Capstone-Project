/**
 * CORS Test Utility
 * 
 * This script helps test CORS configurations by making various types of requests
 * to the backend API and logging the results.
 */

// Base API URL - update this to match your environment
const BACKEND_API = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
  ? 'http://localhost:8000/api/v1'
  : 'https://capstone-project-production-3cce.up.railway.app/api/v1';

/**
 * Extract CSRF token from cookies
 */
function getCSRFToken() {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN' || name === '_csrf') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Test CORS with different request configurations
 */
async function testCORS() {
  const results = document.getElementById('cors-results');
  results.innerHTML = '<h3>Running CORS tests...</h3>';
  
  const tests = [
    {
      name: 'Health Check (Simple Request)',
      url: `${BACKEND_API.split('/api/v1')[0]}/health`,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    },
    {
      name: 'Health Check with Guest Token (Preflight)',
      url: `${BACKEND_API.split('/api/v1')[0]}/health`,
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'X-Guest-Token': 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9'
      },
      credentials: 'include'
    },
    {
      name: 'Leaderboard with Guest Token (Preflight)',
      url: `${BACKEND_API}/leaderboard?category=fish&limit=5`,
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Guest-Token': 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9'
      },
      credentials: 'include'
    },
    {
      name: 'Image Proxy with Guest Token (Preflight)',
      url: `${BACKEND_API}/game/image-proxy?url=${encodeURIComponent('https://acnhapi.com/v1/images/fish/1')}`,
      method: 'GET',
      headers: { 
        'Accept': 'image/png',
        'X-Guest-Token': 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9'
      },
      credentials: 'include'
    },
    {
      name: 'CORS Test - Guest Token Endpoint',
      url: `${BACKEND_API}/cors-test/test-guest-token`,
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'X-Guest-Token': 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9'
      },
      credentials: 'include'
    },
    {
      name: 'CORS Test - Preflight Endpoint',
      url: `${BACKEND_API}/cors-test/test-preflight`,
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Guest-Token': 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9',
        'X-Custom-Header': 'test-value'
      },
      credentials: 'include'
    },
    {
      name: 'CORS Test - CSRF Endpoint',
      url: `${BACKEND_API}/cors-test/test-csrf`,
      method: 'GET',
      headers: { 
        'Accept': 'application/json'
      },
      credentials: 'include'
    }
  ];

  // Add CSRF token to all tests if available
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    tests.forEach(test => {
      test.headers['X-CSRF-Token'] = csrfToken;
    });
  }

  // Run all tests and collect results
  const testResults = [];
  
  for (const test of tests) {
    try {
      console.log(`Running test: ${test.name}`);
      console.log('Request details:', {
        url: test.url,
        method: test.method,
        headers: test.headers,
        credentials: test.credentials
      });
      
      const startTime = performance.now();
      const response = await fetch(test.url, {
        method: test.method,
        headers: test.headers,
        credentials: test.credentials,
        mode: 'cors'
      });
      const endTime = performance.now();
      
      let responseData;
      try {
        if (test.url.includes('image-proxy')) {
          responseData = 'Image data (binary)';
        } else {
          responseData = await response.json();
        }
      } catch (e) {
        responseData = await response.text();
      }
      
      testResults.push({
        name: test.name,
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        time: Math.round(endTime - startTime),
        headers: Object.fromEntries([...response.headers.entries()]),
        data: responseData
      });
      
      console.log(`Test completed: ${test.name}`, {
        success: response.ok,
        status: response.status,
        headers: Object.fromEntries([...response.headers.entries()])
      });
    } catch (error) {
      console.error(`Test failed: ${test.name}`, error);
      testResults.push({
        name: test.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // Display results
  displayResults(testResults);
}

/**
 * Display test results in the UI
 */
function displayResults(results) {
  const resultsElement = document.getElementById('cors-results');
  resultsElement.innerHTML = '';
  
  results.forEach(result => {
    const resultElement = document.createElement('div');
    resultElement.className = `test-result ${result.success ? 'success' : 'failure'}`;
    
    const headerElement = document.createElement('h3');
    headerElement.textContent = `${result.name}: ${result.success ? '✅ Success' : '❌ Failed'}`;
    resultElement.appendChild(headerElement);
    
    const detailsElement = document.createElement('pre');
    detailsElement.className = 'test-details';
    
    if (result.error) {
      detailsElement.textContent = `Error: ${result.error}`;
    } else {
      const details = {
        Status: `${result.status} ${result.statusText}`,
        'Response Time': `${result.time}ms`,
        'Response Headers': result.headers,
        'Response Data': result.data
      };
      detailsElement.textContent = JSON.stringify(details, null, 2);
    }
    
    resultElement.appendChild(detailsElement);
    resultsElement.appendChild(resultElement);
  });
}

// Run tests when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const testButton = document.getElementById('run-tests');
  if (testButton) {
    testButton.addEventListener('click', testCORS);
  }
});
