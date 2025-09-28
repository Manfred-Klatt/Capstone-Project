const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10
  },
  category: {
    type: String,
    required: true,
    enum: ['fish', 'bugs', 'sea', 'villagers'],
    index: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  gameData: {
    correctAnswers: {
      type: Number,
      required: true,
      min: 0
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1
    },
    timeTaken: {
      type: Number, // in seconds
      required: true,
      min: 1
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  isPersonalBest: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add indexes for common queries
leaderboardEntrySchema.index({ category: 1, score: -1, timestamp: -1 }); // For leaderboard queries
leaderboardEntrySchema.index({ userId: 1, category: 1, score: -1 }); // For user's best score queries

// Add compound index for better performance on leaderboard queries
leaderboardEntrySchema.index(
  { category: 1, score: -1, timestamp: -1 },
  { name: 'leaderboard_ranking' }
);

// Static method to get top scores for a category
leaderboardEntrySchema.statics.getTopScores = async function(category, limit = 10) {
  try {
    return await this.find({ category })
      .sort({ score: -1, timestamp: 1 }) // Higher score first, earlier timestamp as tiebreaker
      .limit(limit)
      .select('username score gameData timestamp')
      .lean();
  } catch (error) {
    console.error('Error in getTopScores:', error);
    // Return empty array as fallback
    return [];
  }
};

// Static method to get user's best score for a category
leaderboardEntrySchema.statics.getUserBestScore = async function(userId, category) {
  return this.findOne({ userId, category })
    .sort({ score: -1 })
    .lean();
};

// Static method to get user's rank in a category
leaderboardEntrySchema.statics.getUserRank = async function(userId, category) {
  const userBest = await this.getUserBestScore(userId, category);
  if (!userBest) return null;
  
  const rank = await this.countDocuments({
    category,
    $or: [
      { score: { $gt: userBest.score } },
      { 
        score: userBest.score, 
        timestamp: { $lt: userBest.timestamp } 
      }
    ]
  });
  
  return rank + 1;
};

// Method to check if this is a personal best
leaderboardEntrySchema.methods.checkPersonalBest = async function() {
  const existingBest = await this.constructor.getUserBestScore(this.userId, this.category);
  
  if (!existingBest || this.score > existingBest.score) {
    // Update all previous entries for this user/category to not be personal best
    await this.constructor.updateMany(
      { userId: this.userId, category: this.category, _id: { $ne: this._id } },
      { isPersonalBest: false }
    );
    
    this.isPersonalBest = true;
    return true;
  }
  
  return false;
};

// Pre-save hook to check personal best
leaderboardEntrySchema.pre('save', async function(next) {
  if (this.isNew) {
    await this.checkPersonalBest();
  }
  next();
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardEntrySchema);

module.exports = Leaderboard;
