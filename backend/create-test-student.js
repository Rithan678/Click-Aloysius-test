import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';

async function createTestStudent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Create test student
    console.log('📝 Creating test student...');
    const student = await User.create({
      supabaseId: 'test-student-001',
      email: 'student@college.edu',
      name: 'Test Student',
      regno: '2353056',
      role: 'student',
      canUpload: false,
      approvedEvents: [],
    });

    console.log('✅ Test student created:');
    console.log(`   ID: ${student._id}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   Registration No: ${student.regno}`);
    console.log(`   Role: ${student.role}`);
    console.log(`   CanUpload: ${student.canUpload}`);

    // List all students
    console.log('\n📊 All students in MongoDB:');
    const students = await User.find({ role: 'student' });
    students.forEach(s => console.log(`   - ${s.name} (${s.regno}) - canUpload: ${s.canUpload}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

createTestStudent();
