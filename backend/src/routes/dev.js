import express from 'express';
import Photo from '../models/Photo.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Seed test event + photos for demo (PUBLIC FOR TESTING)
router.get('/seed-test-data', async (req, res) => {
  try {
    // Create test event
    let event = await Event.findOne({ name: 'Test Event - Face Recognition' });
    if (!event) {
      event = await Event.create({
        name: 'Test Event - Face Recognition',
        description: 'Test event for face recognition demo',
        date: new Date(),
        status: 'completed',
        createdBy: 'test-system',
      });
    }

    // Create test photos with mock embeddings
    const testPhotos = [
      { name: 'Photo 1', embedding: Array(128).fill(0).map(() => Math.random()) },
      { name: 'Photo 2', embedding: Array(128).fill(0).map(() => Math.random()) },
      { name: 'Photo 3', embedding: Array(128).fill(0).map(() => Math.random()) },
    ];

    const createdPhotos = [];
    for (const testPhoto of testPhotos) {
      const existing = await Photo.findOne({ 
        eventId: event._id, 
        description: testPhoto.name 
      });
      
      if (!existing) {
        const photo = await Photo.create({
          eventId: event._id,
          uploaderSupabaseId: 'test-user',
          uploaderName: 'Test User',
          description: testPhoto.name,
          storagePath: `test/${testPhoto.name.toLowerCase().replace(' ', '-')}.jpg`,
          bucket: 'event-photos',
          publicUrl: `/event-photos/WhatsApp Image 2026-01-02 at 10.25.22 PM.jpeg`,
          status: 'approved',
          approvedBy: 'test-system',
          approvedAt: new Date(),
          faceEmbeddings: [{ vector: testPhoto.embedding, source: 'test_seed' }],
        });
        createdPhotos.push(photo);
      }
    }

    res.json({ 
      message: 'Test data seeded', 
      event, 
      photosCreated: createdPhotos.length,
      totalPhotosWithEmbeddings: await Photo.countDocuments({ 
        eventId: event._id, 
        'faceEmbeddings.0': { $exists: true } 
      })
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check how many photos have embeddings
router.get('/stats', async (req, res) => {
  const total = await Photo.countDocuments();
  const withEmbeddings = await Photo.countDocuments({ 'faceEmbeddings.0': { $exists: true } });
  const approved = await Photo.countDocuments({ status: 'approved' });
  const rejected = await Photo.countDocuments({ status: 'rejected' });
  
  res.json({ 
    totalPhotos: total, 
    photosWithEmbeddings: withEmbeddings, 
    approvedPhotos: approved,
    rejectedPhotos: rejected,
    readyForFaceSearch: await Photo.countDocuments({ 
      status: 'approved', 
      'faceEmbeddings.0': { $exists: true } 
    })
  });
});

// Set user role (for testing) - requires email and role
router.post('/set-user-role', async (req, res) => {
  try {
    const { email, role } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({ message: 'email and role are required' });
    }

    if (!['admin', 'staff', 'student'].includes(role)) {
      return res.status(400).json({ message: 'role must be admin, staff, or student' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. They need to login once first.' });
    }

    user.role = role;
    user.canUpload = (role === 'admin' || role === 'staff');
    await user.save();

    res.json({ 
      message: `User ${email} updated to ${role}`, 
      user: { email: user.email, role: user.role, canUpload: user.canUpload }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending staff approvals
router.get('/pending-staff', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const pendingStaff = await User.find({ role: 'staff', canUpload: false });
    res.json(pendingStaff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get('/all-users', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-supabaseId');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve staff member
router.post('/approve-staff/:userId', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { canUpload: true },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `Staff ${user.email} approved`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject staff member
router.post('/reject-staff/:userId', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role: 'student', canUpload: false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `Staff ${user.email} rejected and reverted to student`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Staff: Grant upload access to student by registration number for a specific event
router.post('/grant-upload-access', requireAuth, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const { registrationNo, eventId } = req.body;
    
    if (!registrationNo) {
      return res.status(400).json({ message: 'Registration number is required' });
    }

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const student = await User.findOne({ regno: registrationNo, role: 'student' });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found with this registration number' });
    }

    // Initialize approvedEvents array if it doesn't exist
    if (!student.approvedEvents) {
      student.approvedEvents = [];
    }

    // Check if student already approved for this event
    if (student.approvedEvents.some(id => id.toString() === eventId)) {
      return res.status(400).json({ message: `Student already approved for ${event.name}` });
    }

    // Add event to approved list and enable upload
    student.approvedEvents.push(eventId);
    student.canUpload = true;
    await student.save();

    res.json({ 
      message: `${student.name} approved for ${event.name}`, 
      student: { name: student.name, email: student.email, approvedEvents: student.approvedEvents, canUpload: student.canUpload }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
