const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import routes and middleware
const userRoutes = require('./api/routes/users');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://blue-tree-0c9667b0f.2.azurestaticapps.net/'] // Replace with your frontend domain
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static('frontend'));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Frontend route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/frontend/index.html');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/users', userRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MVP Connexa API',
    version: '1.0.0',
    endpoints: {
      'POST /api/users/register': 'Register a new user',
      'POST /api/users/login': 'User login with JWT',
      'POST /api/users/refresh-token': 'Refresh JWT token',
      'GET /api/users/profile': 'Get user profile (protected)',
      'GET /api/users/courses': 'Get all available courses',
      'GET /api/users/groups': 'Get study groups',
      'GET /api/users/groups/:id': 'Get group details',
      'POST /api/users/groups/create': 'Create study group (protected)',
      'POST /api/users/groups/:id/join': 'Join study group (protected)',
      'POST /api/users/groups/:id/leave': 'Leave study group (protected)',
      'DELETE /api/users/groups/:id': 'Delete study group (protected)',
      'GET /health': 'Health check',
      'GET /api': 'API documentation'
    }
  });
});

// 404 handler for undefined routes
app.use('*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});

module.exports = app;