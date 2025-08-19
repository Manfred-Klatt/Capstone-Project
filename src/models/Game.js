const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: false, // Allow guest players
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['villagers', 'fish', 'bugs', 'fossils', 'art', 'mixed'],
    },
    difficulty: {
      type: String,
      required: [true, 'Please provide a difficulty level'],
      enum: ['easy', 'medium', 'hard'],
    },
    score: {
      type: Number,
      required: [true, 'A game must have a score'],
      min: [0, 'Score must be above 0'],
    },
    correctAnswers: {
      type: Number,
      required: [true, 'Please provide number of correct answers'],
    },
    totalQuestions: {
      type: Number,
      required: [true, 'Please provide total number of questions'],
    },
    timeSpent: {
      type: Number, // in seconds
      required: [true, 'Please provide time spent on the game'],
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        userAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        timeSpent: Number, // in seconds
      },
    ],
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
gameSchema.index({ user: 1, completedAt: -1 });
gameSchema.index({ category: 1, difficulty: 1, score: -1 });

// Populate user data when querying games (only if user exists)
gameSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'username avatar',
  });
  next();
});

// Static method to get leaderboard
gameSchema.statics.getLeaderboard = async function (category, difficulty, limit = 10) {
  return this.aggregate([
    {
      $match: {
        ...(category && { category }),
        ...(difficulty && { difficulty }),
      },
    },
    {
      $sort: { score: -1, timeSpent: 1 },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true, // Allow games without users (guest players)
      },
    },
    {
      $project: {
        'user.password': 0,
        'user.email': 0,
        'user.active': 0,
        'user.role': 0,
        'user.createdAt': 0,
        'user.updatedAt': 0,
      },
    },
  ]);
};

// Static method to get user stats
gameSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    {
      $match: { user: mongoose.Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: null,
        totalGames: { $sum: 1 },
        totalScore: { $sum: '$score' },
        avgScore: { $avg: '$score' },
        bestScore: { $max: '$score' },
        categories: { $addToSet: '$category' },
        difficulties: { $addToSet: '$difficulty' },
        totalCorrect: { $sum: '$correctAnswers' },
        totalQuestions: { $sum: '$totalQuestions' },
        avgTimePerGame: { $avg: '$timeSpent' },
      },
    },
    {
      $project: {
        _id: 0,
        totalGames: 1,
        totalScore: 1,
        avgScore: { $round: ['$avgScore', 1] },
        bestScore: 1,
        accuracy: {
          $multiply: [
            { $divide: ['$totalCorrect', '$totalQuestions'] },
            100,
          ],
        },
        categories: 1,
        difficulties: 1,
        avgTimePerGame: { $round: ['$avgTimePerGame', 1] },
      },
    },
  ]);

  return stats[0] || null;
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
