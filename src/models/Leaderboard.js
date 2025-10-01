const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema({
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
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Add index for leaderboard queries
leaderboardEntrySchema.index({ category: 1, score: -1, timestamp: -1 });

// Static method to get top scores for a category
leaderboardEntrySchema.statics.getTopScores = async function(category, limit = 10) {
  try {
    return await this.find({ category })
      .sort({ score: -1, timestamp: 1 }) // Higher score first, earlier timestamp as tiebreaker
      .limit(limit)
      .select('username score timestamp')
      .lean();
  } catch (error) {
    console.error('Error in getTopScores:', error);
    // Return empty array as fallback
    return [];
  }
};

const Leaderboard = mongoose.model('Leaderboard', leaderboardEntrySchema);

module.exports = Leaderboard;
