const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const Alumni = require('../models/Alumni');
const { protect } = require('../middleware/authMiddleware');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

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
    
    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const alumni = await Alumni.create({
      name,
      email,
      password,
      graduationYear,
      department,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Send verification email (don't block registration if email fails)
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    const token = generateToken(alumni._id);

    res.status(201).json({
      token,
      user: {
        _id: alumni._id,
        name: alumni.name,
        email: alumni.email,
        role: alumni.role,
        profilePicture: alumni.profilePicture,
        isEmailVerified: alumni.isEmailVerified,
      },
      message: 'Registration successful. Please check your email to verify your account.',
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

    if (!alumni) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Account was created via Google OAuth — has no usable password
    if (alumni.googleId && !alumni.password) {
      return res.status(401).json({ message: 'This account uses Google Sign In. Please click "Continue with Google".' });
    }

    // Even if googleId exists, they may have linked it later; still check the password
    if (!(await alumni.matchPassword(password))) {
      return alumni.googleId
        ? res.status(401).json({ message: 'This account was created with Google. Please use "Continue with Google" to sign in.' })
        : res.status(401).json({ message: 'Invalid email or password' });
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
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
  }),
  (req, res) => {
    // passport callback returns { alumni, token } from passport.js config
    const token = req.user.token || generateToken(req.user._id || req.user.alumni?._id);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  }
);

// @route   POST /api/auth/verify-email
// @desc    Verify email with token
// @access  Public
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;

  try {
    const alumni = await Alumni.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!alumni) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    alumni.isEmailVerified = true;
    alumni.emailVerificationToken = undefined;
    alumni.emailVerificationExpires = undefined;
    await alumni.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Private
router.post('/resend-verification', protect, async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.user._id);

    if (!alumni) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (alumni.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    alumni.emailVerificationToken = verificationToken;
    alumni.emailVerificationExpires = verificationExpires;
    await alumni.save();

    await sendVerificationEmail(alumni.email, verificationToken);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const alumni = await Alumni.findOne({ email });

    if (!alumni) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If an account exists, a password reset link has been sent' });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    alumni.passwordResetToken = resetToken;
    alumni.passwordResetExpires = resetExpires;
    await alumni.save();

    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'If an account exists, a password reset link has been sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const alumni = await Alumni.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!alumni) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password (will be hashed by pre-save hook)
    alumni.password = newPassword;
    alumni.passwordResetToken = undefined;
    alumni.passwordResetExpires = undefined;
    await alumni.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
