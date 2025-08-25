const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('Starting database initialization script...');

// MongoDB connection string from .env file
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://manfredjklatt:manfredjklatt@cluster0.vswiduv.mongodb.net/acnh-quiz?retryWrites=true&w=majority';

console.log('Using MongoDB URI:', MONGODB_URI.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1$2:****@'));

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define User schema (simplified version of your actual schema)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 20,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  highScores: {
    fish: { type: Number, default: 0 },
    bugs: { type: Number, default: 0 },
    sea: { type: Number, default: 0 },
    villagers: { type: Number, default: 0 }
  },
  gamesPlayed: { type: Number, default: 0 },
  lastPlayed: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model('User', userSchema);

// Sample data for leaderboards
const sampleUsers = [
  {
    username: 'TomNook',
    email: 'tom.nook@acnh.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'user',
    highScores: { fish: 95, bugs: 87, sea: 92, villagers: 78 },
    gamesPlayed: 42,
    lastPlayed: new Date()
  },
  {
    username: 'Isabelle',
    email: 'isabelle@acnh.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'user',
    highScores: { fish: 88, bugs: 92, sea: 85, villagers: 98 },
    gamesPlayed: 37,
    lastPlayed: new Date()
  },
  {
    username: 'KKSlider',
    email: 'kk.slider@acnh.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'user',
    highScores: { fish: 75, bugs: 80, sea: 70, villagers: 85 },
    gamesPlayed: 25,
    lastPlayed: new Date()
  },
  {
    username: 'Blathers',
    email: 'blathers@acnh.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'admin',
    highScores: { fish: 100, bugs: 100, sea: 100, villagers: 90 },
    gamesPlayed: 50,
    lastPlayed: new Date()
  },
  {
    username: 'CelesteStar',
    email: 'celeste@acnh.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'user',
    highScores: { fish: 82, bugs: 95, sea: 88, villagers: 79 },
    gamesPlayed: 30,
    lastPlayed: new Date()
  },
  {
    username: 'Gulliver',
    email: 'gulliver@acnh.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'user',
    highScores: { fish: 90, bugs: 75, sea: 97, villagers: 65 },
    gamesPlayed: 28,
    lastPlayed: new Date()
  },
  {
    username: 'DaisyMae',
    email: 'daisy.mae@acnh.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'user',
    highScores: { fish: 70, bugs: 85, sea: 75, villagers: 80 },
    gamesPlayed: 22,
    lastPlayed: new Date()
  },
  {
    username: 'FlickBug',
    email: 'flick@acnh.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'user',
    highScores: { fish: 65, bugs: 99, sea: 60, villagers: 75 },
    gamesPlayed: 35,
    lastPlayed: new Date()
  },
  {
    username: 'CJFisher',
    email: 'cj@acnh.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'user',
    highScores: { fish: 99, bugs: 70, sea: 85, villagers: 60 },
    gamesPlayed: 33,
    lastPlayed: new Date()
  },
  {
    username: 'Pascal',
    email: 'pascal@acnh.com',
    password: 'password123',
    passwordConfirm: 'password123',
    role: 'user',
    highScores: { fish: 85, bugs: 65, sea: 99, villagers: 70 },
    gamesPlayed: 27,
    lastPlayed: new Date()
  }
];

// Function to initialize the database
async function initializeDatabase() {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Insert sample users
    const createdUsers = await User.create(sampleUsers);
    console.log(`Created ${createdUsers.length} sample users with leaderboard data`);

    // Verify leaderboard data for each category
    const categories = ['fish', 'bugs', 'sea', 'villagers'];
    
    for (const category of categories) {
      const leaderboard = await User.aggregate([
        { $match: { active: { $ne: false } } },
        {
          $project: {
            username: 1,
            score: { $ifNull: [`$highScores.${category}`, 0] },
            date: { $ifNull: ["$lastPlayed", "$createdAt"] }
          }
        },
        { $sort: { score: -1, date: -1 } },
        { $limit: 10 }
      ]);
      
      console.log(`\n${category.toUpperCase()} LEADERBOARD:`);
      leaderboard.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.username}: ${entry.score}`);
      });
    }

    console.log('\nDatabase initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
}

// Run the initialization
initializeDatabase()
  .catch(err => {
    console.error('Fatal error during database initialization:', err);
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
});
