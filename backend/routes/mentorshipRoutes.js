const express = require('express');
const router = express.Router();
const Mentorship = require('../models/Mentorship');
const Alumni = require('../models/Alumni');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/mentorship
// @desc    Request a 1-on-1 mentorship session
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { mentorId, topic, message } = req.body;

    const mentor = await Alumni.findById(mentorId);
    if (!mentor || !mentor.isMentor) {
      return res.status(400).json({ message: 'Selected alumnus is not registered as a mentor' });
    }

    if (mentorId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot request a mentorship session with yourself' });
    }

    const mentorship = await Mentorship.create({
      studentId: req.user._id,
      mentorId,
      topic,
      message,
    });

    res.status(201).json(mentorship);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/mentorship/sessions
// @desc    Get all mentorship sessions (requests sent or received) for the current user
// @access  Private
router.get('/sessions', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    // Find sessions where the user is either the student or the mentor
    const sessions = await Mentorship.find({
      $or: [{ studentId: userId }, { mentorId: userId }]
    })
      .populate('studentId', 'name email department graduationYear profilePicture')
      .populate('mentorId', 'name email company currentJobTitle profilePicture')
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/mentorship/:id
// @desc    Accept or decline session request, and add a meeting link (mentor only)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, meetingLink } = req.body;

    const session = await Mentorship.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Mentorship request not found' });
    }

    // Verify logged-in user is the mentor
    if (session.mentorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this session request' });
    }

    session.status = status || session.status;
    session.meetingLink = meetingLink !== undefined ? meetingLink : session.meetingLink;

    const updated = await session.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
