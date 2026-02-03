import express from 'express';
import Event from '../models/Event.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const events = await Event.find().sort({ date: -1 });
  res.json(events);
});

router.post('/', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { name, description, date, uploadWindowEnd, status, allowedEmails = [] } = req.body;
    const event = await Event.create({
      name,
      description,
      date,
      uploadWindowEnd,
      status: status || 'upcoming',
      allowedEmails,
      createdBy: req.authUser.id,
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', requireAuth, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
