import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing in environment variables');
  }

  mongoose.set('strictQuery', false);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      dbName: uri.split('/').pop(),
    });
    // eslint-disable-next-line no-console
    console.log('✅ MongoDB connected');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ MongoDB connection error', err.message);
    throw err;
  }
}
