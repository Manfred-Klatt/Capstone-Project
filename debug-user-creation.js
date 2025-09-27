/**
 * Debug User Creation Issue
 * 
 * This script tests user creation to see when accounts get deactivated
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');

async function debugUserCreation() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/acnh-quiz';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const testEmail = `test-debug-${Date.now()}@example.com`;
    const testUsername = `testuser${Date.now()}`;

    console.log(`\n🧪 Testing user creation with:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Username: ${testUsername}`);

    // Step 1: Create user
    console.log('\n📝 Step 1: Creating user...');
    const newUser = await User.create({
      username: testUsername,
      email: testEmail,
      password: 'Test1234!',
      passwordConfirm: 'Test1234!'
    });

    console.log('✅ User created successfully');
    console.log(`   ID: ${newUser._id}`);
    console.log(`   Active: ${newUser.active}`);
    console.log(`   Created: ${newUser.createdAt}`);

    // Step 2: Immediate verification
    console.log('\n🔍 Step 2: Immediate verification...');
    const immediateCheck = await User.findById(newUser._id).setOptions({ skipMiddleware: true });
    console.log(`   Active status: ${immediateCheck.active}`);
    console.log(`   Updated: ${immediateCheck.updatedAt}`);

    // Step 3: Wait and check again
    console.log('\n⏳ Step 3: Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const delayedCheck = await User.findById(newUser._id).setOptions({ skipMiddleware: true });
    console.log(`   Active status after 3s: ${delayedCheck.active}`);
    console.log(`   Updated: ${delayedCheck.updatedAt}`);

    // Step 4: Wait longer and check again
    console.log('\n⏳ Step 4: Waiting 7 more seconds (10s total)...');
    await new Promise(resolve => setTimeout(resolve, 7000));

    const finalCheck = await User.findById(newUser._id).setOptions({ skipMiddleware: true });
    console.log(`   Active status after 10s: ${finalCheck.active}`);
    console.log(`   Updated: ${finalCheck.updatedAt}`);

    // Step 5: Check if there are any duplicate users
    console.log('\n🔍 Step 5: Checking for duplicate users...');
    const duplicates = await User.find({ 
      $or: [
        { email: testEmail },
        { username: testUsername }
      ]
    }).setOptions({ skipMiddleware: true });

    console.log(`   Found ${duplicates.length} users with this email/username:`);
    duplicates.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user._id}, Active: ${user.active}, Created: ${user.createdAt}`);
    });

    // Cleanup
    console.log('\n🧹 Cleaning up test user...');
    await User.findByIdAndDelete(newUser._id);
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
debugUserCreation();
