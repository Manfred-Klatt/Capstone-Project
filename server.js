const express = require('express');
const app = express();
const PORT = 8000;

// CORS middleware to allow requests from your CDN domain
app.use((req, res, next) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', 'https://acnhid.b-cdn.net');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running with CORS enabled',
    timestamp: new Date().toISOString(),
    cors: 'Configured for https://acnhid.b-cdn.net'
  });
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CORS-enabled server running on http://localhost:${PORT}`);
  console.log(`Access from another device using http://YOUR_IP_ADDRESS:${PORT}`);
  console.log(`CORS is configured to allow requests from: https://acnhid.b-cdn.net`);
});
