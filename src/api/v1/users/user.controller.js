const userService = require('../../../services/user.service');
const { catchAsync } = require('../../../utils');

// Get current user
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// Get all users (admin only)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await userService.getAllUsers();
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

// Get user by ID
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.params.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// Update user
exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await userService.updateUser(req.params.id, req.body);
  
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// Delete user (mark as inactive)
exports.deleteUser = catchAsync(async (req, res, next) => {
  await userService.deleteUser(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Get user stats
exports.getUserStats = catchAsync(async (req, res, next) => {
  const stats = await userService.getUserStats(req.params.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// Get user game history
exports.getUserGameHistory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const history = await userService.getUserGameHistory(
    id,
    parseInt(limit),
    parseInt(page)
  );
  
  res.status(200).json({
    status: 'success',
    data: history,
  });
});

// Update user avatar
exports.updateUserAvatar = catchAsync(async (req, res, next) => {
  const user = await userService.updateUserAvatar(
    req.params.id,
    req.file ? req.file.path : req.body.avatar
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
