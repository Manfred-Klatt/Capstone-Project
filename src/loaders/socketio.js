const { Server } = require('socket.io');
const config = require('../config');

let io;

const setupSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      methods: config.cors.methods,
      credentials: config.cors.credentials,
    },
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle joining a game room
    socket.on('joinGame', (gameId) => {
      socket.join(gameId);
      console.log(`User ${socket.id} joined game ${gameId}`);
    });

    // Handle leaving a game room
    socket.on('leaveGame', (gameId) => {
      socket.leave(gameId);
      console.log(`User ${socket.id} left game ${gameId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Make io available to other modules
  return io;
};

// Get the io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  setupSocketIO,
  getIO,
};
