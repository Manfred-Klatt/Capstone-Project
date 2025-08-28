const mongoose = require('mongoose');
const config = require('.');

const connectDB = async () => {
  try {
    // Remove deprecated options - these are default in mongoose 6+
    await mongoose.connect(config.database.url);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
