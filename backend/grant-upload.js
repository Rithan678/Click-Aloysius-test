import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';

async function grantUploadPermission() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Update staff@college.edu to have upload permission
    const result = await User.updateOne(
      { email: 'staff@college.edu' },
      { $set: { canUpload: true } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Upload permission granted to staff@college.edu');
    } else {
      console.log('ℹ️  User already has upload permission or does not exist');
    }

    const user = await User.findOne({ email: 'staff@college.edu' });
    console.log('Current user:', user);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

grantUploadPermission();
