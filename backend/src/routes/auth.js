import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  console.log('🔐 /auth/me called for:', req.user.email, 'Role:', req.user.role);
  res.json({
    id: req.user._id,
    supabaseId: req.user.supabaseId,
    email: req.user.email,
    name: req.user.name,
    regno: req.user.regno,
    role: req.user.role,
    canUpload: req.user.canUpload,
    approvedEvents: req.user.approvedEvents,
  });
});

// Check if registration number is available
router.post('/check-regno', async (req, res) => {
  try {
    const { regno } = req.body;
    
    if (!regno) {
      return res.status(400).json({ message: 'Registration number is required' });
    }

    const existingUser = await User.findOne({ regno });
    
    if (existingUser) {
      return res.json({ available: false, message: 'Registration number already registered' });
    }

    res.json({ available: true, message: 'Registration number available' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile with regno
router.post('/update-profile', requireAuth, async (req, res) => {
  try {
    const { name, regno } = req.body;
    
    if (regno && regno !== req.user.regno) {
      // Check if regno is already taken
      const existingUser = await User.findOne({ regno });
      if (existingUser) {
        return res.status(400).json({ message: 'Registration number already in use' });
      }
    }

    if (name) req.user.name = name;
    if (regno) req.user.regno = regno;
    
    await req.user.save();
    
    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        regno: req.user.regno,
        role: req.user.role
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Registration number already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

export default router;
