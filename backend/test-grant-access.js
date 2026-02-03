import 'dotenv/config';
import mongoose from 'mongoose';
import Event from './src/models/Event.js';
import User from './src/models/User.js';

async function testGrantAccess() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Get the actual event
    console.log('📊 Getting events...');
    const event = await Event.findOne({ name: 'College Event 2026' });
    if (!event) {
      console.log('❌ No events found');
      return;
    }

    console.log(`✅ Event found: ${event.name}`);
    console.log(`   ID: ${event._id}`);
    console.log(`   Status: ${event.status}\n`);

    // Get student
    const student = await User.findOne({ regno: '2353056' });
    console.log(`✅ Student found: ${student.name}`);
    console.log(`   Before - CanUpload: ${student.canUpload}`);
    console.log(`   Before - ApprovedEvents: ${student.approvedEvents?.length || 0}\n`);

    // Simulate grant-upload-access
    console.log('🔄 Granting access...');
    if (!student.approvedEvents) {
      student.approvedEvents = [];
    }

    if (student.approvedEvents.some(id => id.toString() === event._id.toString())) {
      console.log('❌ Student already approved for this event');
    } else {
      student.approvedEvents.push(event._id);
      student.canUpload = true;
      await student.save();
      console.log('✅ Access granted!');
      console.log(`   After - CanUpload: ${student.canUpload}`);
      console.log(`   After - ApprovedEvents: ${student.approvedEvents.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testGrantAccess();
