import mongoose from 'mongoose';

const faceEmbeddingSchema = new mongoose.Schema({
  vector: { type: [Number], default: [] },
  source: { type: String }, // e.g., 'face_service'
}, { _id: false });

const photoSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  uploaderSupabaseId: { type: String, required: true, index: true },
  uploaderName: { type: String },
  description: { type: String },
  storagePath: { type: String, required: true },
  bucket: { type: String, required: true },
  publicUrl: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  faceEmbeddings: { type: [faceEmbeddingSchema], default: [] },
}, { timestamps: true });

photoSchema.index({ status: 1, eventId: 1 });
photoSchema.index({ 'faceEmbeddings.vector': 1 });

const Photo = mongoose.model('Photo', photoSchema);
export default Photo;
