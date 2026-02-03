import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: { type: String },
  date: { type: Date },
  uploadWindowEnd: { type: Date },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming', index: true },
  createdBy: { type: String },
  allowedEmails: [{ type: String, lowercase: true, trim: true }],
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
export default Event;
