import 'dotenv/config';
import mongoose from 'mongoose';
import Event from './src/models/Event.js';
import Photo from './src/models/Photo.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importPhotos() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Create or get event
    let event = await Event.findOne({ name: 'College Event 2026' });
    if (!event) {
      event = await Event.create({
        name: 'College Event 2026',
        description: 'College event photos',
        date: new Date(),
        status: 'completed',
        createdBy: 'admin',
      });
      console.log('✅ Event created:', event.name);
    } else {
      console.log('✅ Using existing event:', event.name);
    }

    // List all files in event-photos bucket
    const { data: files, error } = await supabase.storage
      .from('event-photos')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error('❌ Error listing files:', error);
      return;
    }

    console.log(`\n📁 Found ${files.length} files in bucket`);

    // Import each photo
    let imported = 0;
    for (const file of files) {
      // Skip folders
      if (!file.name || file.name.endsWith('/')) continue;

      // Check if already imported
      const existing = await Photo.findOne({ storagePath: file.name });
      if (existing) {
        console.log(`⏭️  Skipped (already exists): ${file.name}`);
        continue;
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('event-photos')
        .getPublicUrl(file.name);

      const publicUrl = publicData.publicUrl;

      // Create photo document
      await Photo.create({
        eventId: event._id,
        uploaderSupabaseId: 'admin',
        uploaderName: 'Admin',
        description: file.name.replace(/\.(jpg|jpeg|png)$/i, '').replace(/_/g, ' '),
        storagePath: file.name,
        bucket: 'event-photos',
        publicUrl: publicUrl,
        status: 'approved',
        approvedBy: 'admin',
        approvedAt: new Date(),
      });

      console.log(`✅ Imported: ${file.name}`);
      imported++;
    }

    console.log(`\n🎉 Import complete! Imported ${imported} photos`);

    // Show stats
    const totalPhotos = await Photo.countDocuments({ eventId: event._id });
    console.log(`📊 Total photos in event: ${totalPhotos}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

importPhotos();
