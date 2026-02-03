import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';

async function fixStaffSupabaseId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const realSupabaseId = 'e089449c-7eed-4a3d-8754-9c8e01ffe9e9';
    
    const staffUser = await User.findOneAndUpdate(
      { email: 'staff@college.edu' },
      { supabaseId: realSupabaseId },
      { new: true }
    );

    console.log('✅ Staff user updated!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${staffUser.email}`);
    console.log(`Role: ${staffUser.role}`);
    console.log(`SupabaseId: ${staffUser.supabaseId}`);
    console.log(`CanUpload: ${staffUser.canUpload}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

fixStaffSupabaseId();
