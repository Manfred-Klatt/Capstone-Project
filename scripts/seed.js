require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Game = require('../src/models/Game');
const config = require('../src/config');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database.url, config.database.options);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Game.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      passwordConfirm: 'admin123',
      role: 'admin',
      active: true,
    });

    // Create regular users
    const users = [];
    const userPasswords = [];
    
    for (let i = 1; i <= 5; i++) {
      const password = `user${i}123`;
      const hashedPassword = await bcrypt.hash(password, 12);
      userPasswords.push(password);
      
      const user = await User.create({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        passwordConfirm: password,
        role: 'user',
        active: true,
      });
      
      users.push(user);
    }

    console.log('Created users:', users.map(u => u.username).join(', '));

    // Create sample games
    const categories = ['villagers', 'fish', 'bugs', 'fossils', 'art'];
    const difficulties = ['easy', 'medium', 'hard'];
    
    const games = [];
    
    // Create games for each user
    for (const user of [admin, ...users]) {
      for (let i = 0; i < 5; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        const score = Math.floor(Math.random() * 100) + 1;
        const correctAnswers = Math.ceil((score / 100) * 10);
        
        const game = await Game.create({
          user: user._id,
          category,
          difficulty,
          score,
          correctAnswers,
          totalQuestions: 10,
          timeSpent: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
          answers: Array(10).fill().map((_, i) => ({
            questionId: new mongoose.Types.ObjectId(),
            userAnswer: `Answer ${i + 1}`,
            correctAnswer: `Answer ${i + 1}`,
            isCorrect: i < correctAnswers,
            timeSpent: Math.floor(Math.random() * 30) + 5, // 5-35 seconds
          })),
        });
        
        games.push(game);
        
        // Update user stats
        user.gamesPlayed += 1;
        user.totalPoints += score;
        if (score > user.highScore) {
          user.highScore = score;
        }
      }
      
      await user.save();
    }

    console.log(`Created ${games.length} games`);
    console.log('Database seeded successfully!');
    console.log('\nAdmin credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('\nUser credentials:');
    users.forEach((user, i) => {
      console.log(`User ${i + 1}:`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: user${i + 1}123\n`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
