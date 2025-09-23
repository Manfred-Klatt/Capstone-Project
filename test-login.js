// Enhanced script to test the login functionality with detailed error reporting
require('dotenv').config();
const fetch = require('node-fetch');

async function testLogin() {
  try {
    // Test both local and production environments
    const environments = [
      {
        name: 'Production',
        baseUrl: 'https://capstone-project-production-3cce.up.railway.app',
        pathPrefix: '/api/v1'
      },
      {
        name: 'Local',
        baseUrl: 'http://localhost:8000',
        pathPrefix: '/api/v1'
      }
    ];

    // Test with different credentials
    const testCredentials = [
      {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test1234!'
      },
      {
        name: 'Invalid Password',
        email: 'test@example.com',
        password: 'WrongPassword123!'
      },
      {
        name: 'Non-existent User',
        email: 'nonexistent@example.com',
        password: 'Test1234!'
      }
    ];

    // Run tests for each environment and credential combination
    for (const env of environments) {
      console.log(`\n===== Testing ${env.name} Environment =====`);
      const loginUrl = `${env.baseUrl}${env.pathPrefix}/auth/login`;
      console.log(`Login URL: ${loginUrl}`);

      // First, test the health endpoint
      try {
        console.log(`\nTesting health endpoint at ${env.baseUrl}/health`);
        const healthResponse = await fetch(`${env.baseUrl}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log(`Health check status: ${healthResponse.status}`);
        const healthText = await healthResponse.text();
        try {
          const healthData = JSON.parse(healthText);
          console.log('Health check data:', JSON.stringify(healthData, null, 2));
        } catch (e) {
          console.log('Raw health response:', healthText);
        }
      } catch (healthError) {
        console.error(`Health check error for ${env.name}:`, healthError.message);
        // Continue with login tests even if health check fails
      }

      // Now test login with different credentials
      for (const cred of testCredentials) {
        console.log(`\n--- Testing with ${cred.name} credentials ---`);
        console.log('Request payload:', JSON.stringify({ email: cred.email, password: '********' }, null, 2));
        
        try {
          const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              email: cred.email,
              password: cred.password
            })
          });
          
          console.log('Response status:', response.status);
          
          const headers = {};
          response.headers.forEach((value, name) => {
            headers[name] = value;
          });
          console.log('Response headers:', JSON.stringify(headers, null, 2));
          
          const text = await response.text();
          console.log('Raw response:', text);
          
          try {
            const data = JSON.parse(text);
            console.log('Parsed response:', JSON.stringify(data, null, 2));
            
            if (response.ok) {
              console.log('Login successful!');
            } else {
              console.log('Login failed:', data.message || data.error || response.statusText);
            }
          } catch (e) {
            console.error('Could not parse JSON response:', e.message);
          }
        } catch (fetchError) {
          console.error(`Fetch error for ${env.name} with ${cred.name}:`, fetchError.message);
        }
      }
    }
  } catch (error) {
    console.error('Error during login test:', error);
  }
}

testLogin();
