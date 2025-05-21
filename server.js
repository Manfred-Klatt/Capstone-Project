const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000; // Changed to 3000 to match fly.toml

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  'https://acnhid.b-cdn.net',
  'https://animal-crossing-id-game.fly.dev'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Health check endpoint (required by Fly.io)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    node: process.version
  });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    cors: 'Configured for allowed origins'
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
