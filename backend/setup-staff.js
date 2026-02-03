import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';

async function setupStaffUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Create or update staff user
    const staffUser = await User.findOneAndUpdate(
      { email: 'staff@college.edu' },
      {
        email: 'staff@college.edu',
        name: 'Staff Member',
        role: 'staff',
        canUpload: true,
        supabaseId: 'staff-user-id-placeholder' // Will be updated when they log in
      },
      { upsert: true, new: true }
    );

    console.log('\n✅ Staff User Configuration:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${staffUser.email}`);
    console.log(`Name: ${staffUser.name}`);
    console.log(`Role: ${staffUser.role}`);
    console.log(`Can Upload: ${staffUser.canUpload}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n📝 Login Instructions:');
    console.log('1. Go to http://localhost:5173/login');
    console.log('2. Email: staff@college.edu');
    console.log('3. Password: staff123');
    console.log('\n✅ After login, you will have STAFF access with upload permissions!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

setupStaffUser();
