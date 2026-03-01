const express = require('express');
const router = express.Router();
const Alumni = require('../models/Alumni');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @route   GET /api/alumni
// @desc    Get all alumni (with optional search/filter)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { name, department, graduationYear, company } = req.query;

    let filter = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (graduationYear) filter.graduationYear = graduationYear;
    if (company) filter.company = { $regex: company, $options: 'i' };

    const alumni = await Alumni.find(filter).select('-password');
    res.json(alumni);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/alumni/:id
// @desc    Get single alumni profile
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id).select('-password');
    if (!alumni) return res.status(404).json({ message: 'Alumni not found' });
    res.json(alumni);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/alumni/:id
// @desc    Update alumni profile (own profile or admin)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id);
    if (!alumni) return res.status(404).json({ message: 'Alumni not found' });

    // Only the alumni themselves or admin can update
    if (alumni._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { name, department, graduationYear, currentJobTitle, company, location, linkedin, phone, bio } = req.body;

    alumni.name = name || alumni.name;
    alumni.department = department || alumni.department;
    alumni.graduationYear = graduationYear || alumni.graduationYear;
    alumni.currentJobTitle = currentJobTitle || alumni.currentJobTitle;
    alumni.company = company || alumni.company;
    alumni.location = location || alumni.location;
    alumni.linkedin = linkedin || alumni.linkedin;
    alumni.phone = phone || alumni.phone;
    alumni.bio = bio || alumni.bio;

    const updated = await alumni.save();
    const result = updated.toObject();
    delete result.password;

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/alumni/:id
// @desc    Delete alumni (admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id);
    if (!alumni) return res.status(404).json({ message: 'Alumni not found' });

    await alumni.deleteOne();
    res.json({ message: 'Alumni deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/alumni/profile/me
// @desc    Get logged in alumni's own profile
// @access  Private
router.get('/profile/me', protect, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.user._id).select('-password');
    res.json(alumni);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
