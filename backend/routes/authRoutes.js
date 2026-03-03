const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const Alumni = require('../models/Alumni');
const { protect } = require('../middleware/authMiddleware');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new alumni
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, graduationYear, department } = req.body;

  try {
    const existingUser = await Alumni.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const alumni = await Alumni.create({
      name,
      email,
      password,
      graduationYear,
      department
    });

    const token = generateToken(alumni._id);

    res.status(201).json({
      token,
      user: {
        _id: alumni._id,
        name: alumni.name,
        email: alumni.email,
        role: alumni.role,
        profilePicture: alumni.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login alumni
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const alumni = await Alumni.findOne({ email });

    if (!alumni || !(await alumni.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(alumni._id);

    res.json({
      token,
      user: {
        _id: alumni._id,
        name: alumni.name,
        email: alumni.email,
        role: alumni.role,
        profilePicture: alumni.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.user._id).select('-password');
    if (!alumni) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        _id: alumni._id,
        name: alumni.name,
        email: alumni.email,
        role: alumni.role,
        profilePicture: alumni.profilePicture,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`
  }),
  (req, res) => {
    try {
      // Get token from passport callback
      const { token, alumni } = req.user;
      
      // Redirect to frontend with token in URL
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=server_error`);
    }
  }
);

module.exports = router;
