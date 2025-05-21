const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000; // Changed to 3000 to match fly.toml

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  'https://acnhid.b-cdn.net',
  'https://animal-crossing-id-game.fly.dev',
  'http://localhost:3000'  // For local development
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

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve images from the images directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Serve the main HTML file for all other GET requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'game.html'));
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

// Create HTTP server
const server = app.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  const host = address.address === '::' ? '0.0.0.0' : address.address;
  
  console.log(`Server is running on http://${host}:${address.port}`);
  console.log(`Server is listening on all network interfaces (0.0.0.0:${PORT})`);
  console.log(`CORS is configured for: ${allowedOrigins.join(', ')}`);
  
  // Log available routes
  console.log('\nAvailable routes:');
  console.log(`- GET / (serves game.html)`);
  console.log(`- GET /health (health check)`);
  console.log(`- GET /api/health (API health check)`);
  console.log(`- GET /images/* (serves static images)`);
  
  // Verify server is listening on all interfaces
  const interfaces = require('os').networkInterfaces();
  console.log('\nNetwork interfaces:');
  Object.keys(interfaces).forEach(iface => {
    interfaces[iface].forEach(details => {
      if (details.family === 'IPv4' && !details.internal) {
        console.log(`- http://${details.address}:${PORT}`);
      }
    });
  });
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
