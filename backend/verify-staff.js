import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import { getSupabaseAdmin } from './src/config/supabaseClient.js';

async function verifyStaff() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Check MongoDB
    console.log('📊 Checking MongoDB...');
    const mongoUser = await User.findOne({ email: 'staff@college.edu' });
    if (mongoUser) {
      console.log('✅ Staff user found in MongoDB:');
      console.log(`   Email: ${mongoUser.email}`);
      console.log(`   Role: ${mongoUser.role}`);
      console.log(`   SupabaseId: ${mongoUser.supabaseId || 'NOT LINKED YET'}`);
      console.log(`   CanUpload: ${mongoUser.canUpload}`);
    } else {
      console.log('❌ Staff user NOT found in MongoDB');
    }

    // Check Supabase
    console.log('\n📊 Checking Supabase...');
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching Supabase users:', error);
    } else {
      const staffUser = users.find(u => u.email === 'staff@college.edu');
      if (staffUser) {
        console.log('✅ Staff user found in Supabase:');
        console.log(`   Email: ${staffUser.email}`);
        console.log(`   UID: ${staffUser.id}`);
        console.log(`   Created: ${staffUser.created_at}`);
      } else {
        console.log('❌ Staff user NOT found in Supabase');
        console.log('📝 Available users in Supabase:');
        users.slice(0, 5).forEach(u => console.log(`   - ${u.email}`));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

verifyStaff();
