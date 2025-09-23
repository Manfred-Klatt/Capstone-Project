/**
 * This file is a re-export of the main User model from ../../models/userModel.js
 * to maintain backward compatibility with existing imports.
 * 
 * IMPORTANT: Do not modify this file. Make all changes to the main model at:
 * ../../models/userModel.js
 */

const User = require('../../models/userModel');

module.exports = User;
