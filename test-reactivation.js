const mongoose = require('mongoose');
const User = require('./models/userModel');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/acnh-quiz');
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const testReactivation = async () => {
  try {
    await connectDB();
    
    const email = 'manfredjklatt@gmail.com';
    console.log(`\n🔍 Testing reactivation for: ${email}`);
    
    // Find user bypassing active filter
    const user = await User.findOne({ email: email.toLowerCase() })
      .setOptions({ skipMiddleware: true });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`📊 Current user status:`);
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Username: ${user.username}`);
    console.log(`   - Active: ${user.active}`);
    console.log(`   - Created: ${user.createdAt}`);
    console.log(`   - Updated: ${user.updatedAt}`);
    
    if (user.active) {
      console.log('✅ Account is already active');
    } else {
      console.log('🔄 Reactivating account...');
      user.active = true;
      await user.save({ validateBeforeSave: false });
      console.log('✅ Account reactivated successfully');
    }
    
    // Wait a few seconds and check again
    console.log('\n⏳ Waiting 5 seconds to check if status persists...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const userAfter = await User.findOne({ email: email.toLowerCase() })
      .setOptions({ skipMiddleware: true });
    
    console.log(`📊 Status after 5 seconds:`);
    console.log(`   - Active: ${userAfter.active}`);
    console.log(`   - Updated: ${userAfter.updatedAt}`);
    
    if (userAfter.active) {
      console.log('✅ Account status persisted - reactivation working correctly');
    } else {
      console.log('❌ Account was deactivated again - there might be a process deactivating accounts');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test
testReactivation();
