// Script to check if the test user exists and has a valid password
require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    console.log('Connection string:', uri.replace(/(\/\/[^:]+:)[^@]+(@)/, '$1*****$2'));
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000
    });
    
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Define a simplified User schema for this script
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  active: Boolean
});

// Add the correctPassword method to the schema
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if a user exists and test password
const checkUserPassword = async (email, password) => {
  try {
    const User = mongoose.model('User', userSchema);
    
    // Check if user exists
    console.log(`Checking if user with email ${email} exists...`);
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.error(`❌ User with email ${email} not found in database`);
      return false;
    }
    
    console.log('✅ User found in database:');
    console.log({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });
    
    // Check if the user has a password field
    if (!user.password) {
      console.error('❌ User exists but has no password field!');
      return false;
    }
    
    // Test password
    console.log(`Testing password for user ${email}...`);
    try {
      const isPasswordCorrect = await user.correctPassword(password, user.password);
      
      if (isPasswordCorrect) {
        console.log('✅ Password is correct!');
        return true;
      } else {
        console.error('❌ Password is incorrect!');
        
        // Check if password is hashed
        if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
          console.error('❌ Password does not appear to be hashed with bcrypt!');
        }
        
        return false;
      }
    } catch (passwordError) {
      console.error('❌ Error testing password:', passwordError.message);
      console.error('This could indicate that the password is not properly hashed or stored');
      return false;
    }
  } catch (err) {
    console.error('Error checking user password:', err);
    throw err;
  }
};

// Create a test user with a properly hashed password
const createOrUpdateTestUser = async (email, password) => {
  try {
    const User = mongoose.model('User', userSchema);
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    if (existingUser) {
      console.log(`Updating existing user ${email} with new password...`);
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log('✅ User password updated successfully');
      return existingUser;
    } else {
      console.log(`Creating new user ${email}...`);
      const newUser = await User.create({
        username: email.split('@')[0],
        email,
        password: hashedPassword,
        role: 'user',
        active: true
      });
      console.log('✅ New user created successfully');
      return newUser;
    }
  } catch (err) {
    console.error('Error creating/updating user:', err);
    throw err;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    
    // Test credentials
    const testEmail = 'test@example.com';
    const testPassword = 'Test1234!';
    
    // Check if user exists and password is correct
    const isPasswordCorrect = await checkUserPassword(testEmail, testPassword);
    
    if (!isPasswordCorrect) {
      console.log('\nCreating or updating test user with correct password...');
      await createOrUpdateTestUser(testEmail, testPassword);
      
      // Verify the password again
      console.log('\nVerifying password after update...');
      const isPasswordCorrectAfterUpdate = await checkUserPassword(testEmail, testPassword);
      
      if (isPasswordCorrectAfterUpdate) {
        console.log('\n✅ Test user is now set up correctly!');
      } else {
        console.error('\n❌ Failed to set up test user correctly!');
      }
    } else {
      console.log('\n✅ Test user is already set up correctly!');
    }
  } catch (err) {
    console.error('Script failed:', err);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
};

// Run the script
main();
