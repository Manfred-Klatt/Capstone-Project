const express = require('express');
const path = require('path');
const http = require('http');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Add MIME type for SVG
const mime = require('mime');
mime.define({ 'image/svg+xml': ['svg'] }, true);

// Basic request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  'https://acnhid.b-cdn.net',
  'https://animal-crossing-id-game.fly.dev',
  'http://localhost:3000',  // For local development
  'http://localhost',       // Common alternative
  'http://127.0.0.1'        // IPv4 localhost
];

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Set CORS headers for all responses
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  
  // Set cache control for static assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Simple health check endpoint (no middleware, no CORS)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    node: process.version,
    uptime: process.uptime()
  });
});

// Configure static file serving with proper caching headers
const staticOptions = {
  etag: true,
  lastModified: true,
  maxAge: '1y',
  setHeaders: (res, path) => {
    // Set longer cache for static assets
    if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};

// Serve static files with proper security headers
const serveStatic = (directory, options = {}) => {
  return express.static(directory, {
    ...staticOptions,
    ...options,
    setHeaders: (res, path) => {
      // Set security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Apply cache headers from staticOptions
      if (staticOptions.setHeaders) {
        staticOptions.setHeaders(res, path);
      }
    }
  });
};

// Serve static files from the root directory (exclude specific files)
app.use(serveStatic(path.join(__dirname), {
  index: false, // Don't serve index.html for directories
  extensions: ['html', 'htm', 'js', 'css', 'json', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot']
}));

// Serve images from the images directory with higher priority
app.use('/images', serveStatic(path.join(__dirname, 'images')));

// Serve static files from node_modules (if needed)
app.use('/node_modules', serveStatic(path.join(__dirname, 'node_modules')));

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    cors: 'Configured for allowed origins',
    images: {
      testImage: '/images/admin.png',
      testSvg: '/images/bugs/placeholder.svg'
    }
  });
});

// Test image endpoint
app.get('/test-image', (req, res) => {
  const imagePath = path.join(__dirname, 'images', 'admin.png');
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({
      status: 'error',
      message: 'Test image not found',
      path: imagePath
    });
  }
});

// Handle SPA routing - serve index.html for all other GET requests
app.get('*', (req, res, next) => {
  // List of file extensions that should be served as static files
  const staticFileExtensions = ['.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  const isStaticFile = staticFileExtensions.some(ext => req.path.endsWith(ext));
  
  // If it's a static file, let the static middleware handle it
  if (isStaticFile) {
    return next();
  }
  
  // For API routes, let them be handled by their specific routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // For all other routes, serve the game.html for SPA routing
  res.sendFile(path.join(__dirname, 'game.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Internal Server Error');
});

// Create HTTP server
const server = http.createServer(app);

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  const host = address.address === '::' ? '0.0.0.0' : address.address;
  
  console.log(`\n=== Server Information ===`);
  console.log(`Server is running on http://${host}:${address.port}`);
  console.log(`Server is listening on all network interfaces (0.0.0.0:${PORT})`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Node.js version: ${process.version}`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`CORS is configured for: ${allowedOrigins.join(', ')}`);
  
  // Log available routes
  console.log('\n=== Available Routes ===');
  console.log(`- GET / (serves game.html)`);
  console.log(`- GET /health (health check)`);
  console.log(`- GET /api/health (API health check)`);
  console.log(`- GET /images/* (serves static images)`);
  
  // Log network interfaces
  const interfaces = require('os').networkInterfaces();
  console.log('\n=== Network Interfaces ===');
  let hasExternalInterface = false;
  
  Object.keys(interfaces).forEach(iface => {
    interfaces[iface].forEach(details => {
      if (details.family === 'IPv4' && !details.internal) {
        console.log(`- ${iface}: http://${details.address}:${PORT}`);
        hasExternalInterface = true;
      }
    });
  });
  
  if (!hasExternalInterface) {
    console.log('No external network interfaces found!');
  }
  
  console.log('\n=== Server Ready ===');
});

// Handle server errors
server.on('error', (error) => {
  console.error('\n=== Server Error ===');
  console.error(`Error code: ${error.code}`);
  console.error(`Error message: ${error.message}`);
  
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use.`);
    console.error('Please check if another instance of the server is running.');
    console.error('You can find and kill the process using this port with:');
    console.error(`> lsof -i :${PORT}  # On macOS/Linux`);
    console.error(`> netstat -ano | findstr :${PORT}  # On Windows`);
  } else if (error.code === 'EACCES') {
    console.error(`\nPermission denied when trying to use port ${PORT}.`);
    console.error('On Unix-like systems, ports below 1024 require root privileges.');
    console.error('Try running the server on a port above 1024 or use sudo.');
  }
  
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received. Gracefully shutting down...');
  server.close(() => {
    console.log('Server has been closed.');
    process.exit(0);
  });
  
  // Force shutdown after 5 seconds if server doesn't close gracefully
  setTimeout(() => {
    console.error('Forcing shutdown...');
    process.exit(1);
  }, 5000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n=== Uncaught Exception ===');
  console.error(error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n=== Unhandled Rejection ===');
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Log when the server is closing
process.on('exit', (code) => {
  console.log(`\nProcess is about to exit with code: ${code}`);
});
