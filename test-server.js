const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Test auth routes
app.post('/api/v1/auth/signup', (req, res) => {
  console.log('Signup attempt:', req.body);
  res.json({
    status: 'success',
    message: 'Test signup endpoint working',
    data: { user: { username: 'test' } }
  });
});

app.post('/api/v1/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  res.json({
    status: 'success',
    message: 'Test login endpoint working',
    token: 'test-token',
    data: { user: { username: 'test' } }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});
