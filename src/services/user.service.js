const User = require('../models/User');
const AppError = require('../utils/appError');

// Get all users (admin only)
exports.getAllUsers = async (filter = {}) => {
  try {
    const users = await User.find(filter).select('-__v -passwordChangedAt');
    return users;
  } catch (error) {
    throw error;
  }
};

// Get user by ID
exports.getUserById = async (userId) => {
  try {
    const user = await User.findById(userId).select('-__v -passwordChangedAt');
    if (!user) {
      throw new AppError('No user found with that ID', 404);
    }
    return user;
  } catch (error) {
    throw error;
  }
};

// Update user
exports.updateUser = async (userId, updateData) => {
  try {
    // 1) Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('No user found with that ID', 404);
    }

    // 2) Filter out unwanted fields that are not allowed to be updated
    const filteredBody = {};
    const allowedFields = ['username', 'email', 'avatar'];
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = updateData[key];
      }
    });

    // 3) Update user
    const updatedUser = await User.findByIdAndUpdate(userId, filteredBody, {
      new: true,
      runValidators: true,
    }).select('-__v -passwordChangedAt');

    return updatedUser;
  } catch (error) {
    throw error;
  }
};

// Delete user (mark as inactive)
exports.deleteUser = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { active: false },
      { new: true }
    );

    if (!user) {
      throw new AppError('No user found with that ID', 404);
    }

    return null;
  } catch (error) {
    throw error;
  }
};

// Get user stats
exports.getUserStats = async (userId) => {
  try {
    const stats = await User.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: 'games',
          localField: '_id',
          foreignField: 'user',
          as: 'games',
        },
      },
      {
        $addFields: {
          totalGames: { $size: '$games' },
          avgScore: { $avg: '$games.score' },
          bestScore: { $max: '$games.score' },
          totalScore: { $sum: '$games.score' },
          categories: { $setUnion: ['$games.category'] },
        },
      },
      {
        $project: {
          username: 1,
          email: 1,
          avatar: 1,
          highScore: 1,
          gamesPlayed: 1,
          totalGames: 1,
          avgScore: { $round: ['$avgScore', 1] },
          bestScore: 1,
          totalScore: 1,
          categories: 1,
        },
      },
    ]);

    if (!stats.length) {
      throw new AppError('No user found with that ID', 404);
    }

    return stats[0];
  } catch (error) {
    throw error;
  }
};

// Get user game history
exports.getUserGameHistory = async (userId, limit = 10, page = 1) => {
  try {
    const skip = (page - 1) * limit;
    
    const [games, total] = await Promise.all([
      Game.find({ user: userId })
        .sort('-completedAt')
        .skip(skip)
        .limit(limit)
        .select('-__v -user')
        .lean(),
      Game.countDocuments({ user: userId }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      results: games.length,
      total,
      totalPages,
      currentPage: page,
      games,
    };
  } catch (error) {
    throw error;
  }
};

// Update user avatar
exports.updateUserAvatar = async (userId, avatarUrl) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('-__v -passwordChangedAt');

    if (!user) {
      throw new AppError('No user found with that ID', 404);
    }

    return user;
  } catch (error) {
    throw error;
  }
};
