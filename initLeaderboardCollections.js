const mongoose = require('mongoose');
require('dotenv').config();

console.log('Starting leaderboard collections initialization...');

// MongoDB connection string from .env file
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://manfredjklatt:ZLjT2en0MjBgjnkF@cluster0.vswiduv.mongodb.net/acnh-quiz?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

console.log('Using MongoDB URI:', MONGODB_URI.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1$2:****@'));

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');

// Define the score schema
const scoreSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    maxlength: [20, 'Username cannot be longer than 20 characters'],
    minlength: [3, 'Username must be at least 3 characters long']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['fish', 'bugs', 'sea', 'villagers'],
      message: 'Invalid category. Must be one of: fish, bugs, sea, villagers'
    }
  },
  date: {
    type: Date,
    default: Date.now
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  deviceId: {
    type: String,
    required: function() {
      return this.isGuest;
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for better query performance
scoreSchema.index({ category: 1, score: -1, date: 1 });
scoreSchema.index({ username: 1, category: 1 }, { unique: true });

// Create the model
const Score = mongoose.model('Score', scoreSchema);

// Function to initialize collections
async function initializeCollections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('Connected to MongoDB');
    
    // Create collections for each category
    const categories = ['fish', 'bugs', 'sea', 'villagers'];
    
    for (const category of categories) {
      // This will create the collection if it doesn't exist
      await Score.createCollection();
      console.log(`Verified/created collection for ${category} scores`);
      
      // Create indexes
      await Score.syncIndexes();
      console.log(`Ensured indexes for ${category} scores`);
    }
    
    console.log('\n✅ Successfully initialized all leaderboard collections');
    console.log('\nCollections created:');
    console.log('- scores (contains all leaderboard entries)');
    
    // Show example of how to use the model
    console.log('\nExample usage:');
    console.log(`// Get top 10 scores for fish`);
    console.log(`const topScores = await Score.find({ category: 'fish' })
  .sort({ score: -1, date: 1 })
  .limit(10);`);
    
  } catch (error) {
    console.error('Error initializing collections:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

// Run the initialization
initializeCollections();
