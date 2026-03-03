const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Alumni = require('../models/Alumni');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @route   GET /api/events
// @desc    Get all events (upcoming first)
// @access  Private (any logged-in user)
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('attendees', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/events
// @desc    Create event (admin only)
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, location, mode, maxAttendees, isPublic, guests } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      mode,
      maxAttendees,
      isPublic,
      guests: guests || [],
      createdBy: req.user._id,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event (admin only)
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, location, mode, maxAttendees, isPublic, guests } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.startTime = startTime || event.startTime;
    event.endTime = endTime || event.endTime;
    event.location = location || event.location;
    event.mode = mode || event.mode;
    event.maxAttendees = maxAttendees || event.maxAttendees;
    event.isPublic = typeof isPublic === 'boolean' ? isPublic : event.isPublic;
    if (guests) event.guests = guests;

    const updated = await event.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event (admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/events/:id/rsvp
// @desc    RSVP / join event
// @access  Private
router.post('/:id/rsvp', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Prevent duplicate RSVP
    if (event.attendees.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already RSVPed for this event' });
    }

    // Check capacity
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }

    event.attendees.push(req.user._id);
    await event.save();

    res.json({ message: 'RSVP successful', eventId: event._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/events/:id/unrsvp
// @desc    Cancel RSVP
// @access  Private
router.post('/:id/unrsvp', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.attendees = event.attendees.filter(
      (attId) => attId.toString() !== req.user._id.toString()
    );

    await event.save();
    res.json({ message: 'RSVP cancelled', eventId: event._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/events/:id/guests
// @desc    Add guest to event by email (admin only)
// @access  Private/Admin
router.post('/:id/guests', protect, adminOnly, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if guest already added
    const existingGuest = event.guests.find(g => g.email.toLowerCase() === email.toLowerCase());
    if (existingGuest) {
      return res.status(400).json({ message: 'Guest already added' });
    }

    // Look up alumni by email
    const alumni = await Alumni.findOne({ email: email.toLowerCase() });
    
    const guestData = {
      email: email.toLowerCase(),
      name: alumni ? alumni.name : null,
      profilePicture: alumni ? alumni.profilePicture : null,
      alumniId: alumni ? alumni._id : null,
    };

    event.guests.push(guestData);
    await event.save();

    res.json({ message: 'Guest added successfully', guest: guestData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/events/:id/guests/:guestId
// @desc    Remove guest from event (admin only)
// @access  Private/Admin
router.delete('/:id/guests/:guestId', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.guests = event.guests.filter(g => g._id.toString() !== req.params.guestId);
    await event.save();

    res.json({ message: 'Guest removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
