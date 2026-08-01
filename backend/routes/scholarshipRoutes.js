const express = require('express');
const router = express.Router();
const Scholarship = require('../models/Scholarship');
const Donation = require('../models/Donation');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/scholarships
// @desc    Create a scholarship request (students only)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, amountNeeded } = req.body;

    const request = await Scholarship.create({
      studentId: req.user._id,
      title,
      description,
      amountNeeded,
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/scholarships
// @desc    Get all active scholarship requests
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const requests = await Scholarship.find()
      .populate('studentId', 'name email department graduationYear profilePicture')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/scholarships/my-requests
// @desc    Get scholarship requests created by the current student
// @access  Private
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await Scholarship.find({ studentId: req.user._id })
      .populate('studentId', 'name email department graduationYear')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/scholarships/:id/fund
// @desc    Fund a scholarship request (record a donation against a scholarship request)
// @access  Private
router.put('/:id/fund', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const fundAmount = Number(amount);

    if (isNaN(fundAmount) || fundAmount <= 0) {
      return res.status(400).json({ message: 'Please provide a valid funding amount' });
    }

    const request = await Scholarship.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Scholarship request not found' });
    }

    if (request.status === 'funded' || request.status === 'closed') {
      return res.status(400).json({ message: 'This request is no longer open for funding' });
    }

    // Add raised amount
    request.amountRaised += fundAmount;
    if (request.amountRaised >= request.amountNeeded) {
      request.status = 'funded';
    }

    await request.save();

    // Create a corresponding Donation record in the system
    await Donation.create({
      donatedBy: req.user._id,
      amount: fundAmount,
      currency: 'INR',
      purpose: 'Scholarship Aid',
      status: 'completed',
      message: `Funded Scholarship Campaign: "${request.title}"`,
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
