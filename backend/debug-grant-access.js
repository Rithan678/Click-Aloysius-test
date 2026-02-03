import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Event from './src/models/Event.js';

async function debugGrantAccess() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const registrationNo = '2353056';
    const eventId = '6979021cdb294731e27e509d';

    // Check student
    console.log('📊 Checking student with regno:', registrationNo);
    const student = await User.findOne({ regno: registrationNo, role: 'student' });
    if (student) {
      console.log('✅ Student found:');
      console.log(`   ID: ${student._id}`);
      console.log(`   Name: ${student.name}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   CanUpload: ${student.canUpload}`);
      console.log(`   ApprovedEvents: ${student.approvedEvents?.length || 0}`);
    } else {
      console.log('❌ Student NOT found');
      console.log('\n📝 Students in MongoDB:');
      const allStudents = await User.find({ role: 'student' }).select('name email regno canUpload approvedEvents');
      allStudents.forEach(s => console.log(`   - ${s.name} (${s.email}) [regno: ${s.regno}]`));
    }

    // Check event
    console.log('\n📊 Checking event:', eventId);
    const event = await Event.findById(eventId);
    if (event) {
      console.log('✅ Event found:');
      console.log(`   Name: ${event.name}`);
      console.log(`   Date: ${event.date}`);
      console.log(`   Status: ${event.status}`);
    } else {
      console.log('❌ Event NOT found');
      console.log('\n📝 Events in MongoDB:');
      const allEvents = await Event.find().select('name date status createdBy');
      allEvents.forEach(e => console.log(`   - ${e.name} (${e.status})`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

debugGrantAccess();
