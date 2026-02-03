import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  supabaseId: { type: String, index: true, unique: true },
  email: { type: String, index: true },
  name: { type: String },
  regno: { type: String, unique: true, sparse: true, index: true }, // Registration number
  role: { type: String, enum: ['admin', 'staff', 'student'], default: 'student', index: true },
  canUpload: { type: Boolean, default: false },
  approvedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
