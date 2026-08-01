const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const Job = require('../models/Job');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/referrals
// @desc    Submit a referral request (students or alumni)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { jobId, resumeLink, message } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if request already exists
    const existing = await Referral.findOne({ jobId, studentId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already requested a referral for this job' });
    }

    const referral = await Referral.create({
      jobId,
      studentId: req.user._id,
      alumniId: job.postedBy, // the alumnus who posted the job
      resumeLink,
      message,
    });

    res.status(201).json(referral);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/referrals/my-requests
// @desc    Get referral requests submitted by the logged-in student
// @access  Private
router.get('/my-requests', protect, async (req, res) => {
  try {
    const referrals = await Referral.find({ studentId: req.user._id })
      .populate('jobId', 'title company location')
      .populate('alumniId', 'name email')
      .sort({ createdAt: -1 });
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/referrals/for-me
// @desc    Get referral requests received by the logged-in alumnus (for jobs they posted)
// @access  Private
router.get('/for-me', protect, async (req, res) => {
  try {
    const referrals = await Referral.find({ alumniId: req.user._id })
      .populate('jobId', 'title company location')
      .populate('studentId', 'name email department graduationYear')
      .sort({ createdAt: -1 });
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/referrals/:id
// @desc    Update referral request status (alumni only)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const referral = await Referral.findById(req.params.id);
    if (!referral) {
      return res.status(404).json({ message: 'Referral request not found' });
    }

    // Verify the logged-in user is the one who posted the job
    if (referral.alumniId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this referral request' });
    }

    referral.status = status || referral.status;
    referral.notes = notes !== undefined ? notes : referral.notes;

    const updated = await referral.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
