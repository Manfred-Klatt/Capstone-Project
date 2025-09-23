// Script to test the login functionality
require('dotenv').config();
const fetch = require('node-fetch');

async function testLogin() {
  try {
    const baseUrl = 'https://capstone-project-production-3cce.up.railway.app';
    const pathPrefix = '/api/v1';
    const loginUrl = `${baseUrl}${pathPrefix}/auth/login`;
    
    console.log(`Testing login at: ${loginUrl}`);
    
    const credentials = {
      email: 'test@example.com',
      password: 'Test1234!'
    };
    
    console.log('Request payload:', JSON.stringify({ ...credentials, password: '********' }, null, 2));
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials)
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
        console.log('Login failed:', data.message || response.statusText);
      }
    } catch (e) {
      console.error('Could not parse JSON response:', e.message);
    }
  } catch (error) {
    console.error('Error during login test:', error);
  }
}

testLogin();
