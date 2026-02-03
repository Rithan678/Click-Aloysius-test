// Quick diagnostic script to check photo status
import mongoose from 'mongoose';
import Photo from './src/models/Photo.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/click-aloysius';

async function checkPhotos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const totalPhotos = await Photo.countDocuments();
    const approvedPhotos = await Photo.countDocuments({ status: 'approved' });
    const photosWithEmbeddings = await Photo.countDocuments({ 
      status: 'approved',
      faceEmbeddings: { $exists: true, $ne: [] }
    });
    const photosWithoutEmbeddings = await Photo.countDocuments({ 
      status: 'approved',
      faceEmbeddings: { $exists: false }
    }) + await Photo.countDocuments({ 
      status: 'approved',
      faceEmbeddings: { $size: 0 }
    });

    console.log('\n📊 Database Status:');
    console.log(`   Total photos: ${totalPhotos}`);
    console.log(`   Approved photos: ${approvedPhotos}`);
    console.log(`   ✅ With embeddings: ${photosWithEmbeddings}`);
    console.log(`   ❌ Missing embeddings: ${photosWithoutEmbeddings}`);

    if (photosWithEmbeddings > 0) {
      console.log('\n🔍 Sample photo with embedding:');
      const sample = await Photo.findOne({ 
        status: 'approved',
        faceEmbeddings: { $exists: true, $ne: [] }
      });
      console.log(`   ID: ${sample._id}`);
      console.log(`   Embeddings count: ${sample.faceEmbeddings.length}`);
      console.log(`   Embedding vector length: ${sample.faceEmbeddings[0]?.vector?.length || 0}`);
    }

    if (photosWithoutEmbeddings > 0) {
      console.log('\n⚠️  Photos missing embeddings:');
      const missing = await Photo.find({ 
        status: 'approved',
        $or: [
          { faceEmbeddings: { $exists: false } },
          { faceEmbeddings: { $size: 0 } }
        ]
      }).limit(5);
      missing.forEach(p => {
        console.log(`   - ${p._id}: ${p.storagePath}`);
      });
      console.log('\n💡 Use "Generate Missing Face Embeddings" button in Staff Dashboard');
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPhotos();
