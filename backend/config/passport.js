const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Alumni = require('../models/Alumni');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

module.exports = function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with Google ID
          let alumni = await Alumni.findOne({ googleId: profile.id });

          if (alumni) {
            // User exists, return user with token
            const token = generateToken(alumni._id);
            return done(null, { alumni, token });
          }

          // Check if email already exists (user registered with email/password)
          alumni = await Alumni.findOne({ email: profile.emails[0].value });

          if (alumni) {
            // Link Google ID to existing account
            alumni.googleId = profile.id;
            alumni.profilePicture = alumni.profilePicture || profile.photos[0]?.value;
            await alumni.save();
            const token = generateToken(alumni._id);
            return done(null, { alumni, token });
          }

          // Create new user
          alumni = await Alumni.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0]?.value,
            password: Math.random().toString(36).slice(-8) + 'Google!', // Random password for Google users
          });

          const token = generateToken(alumni._id);
          return done(null, { alumni, token });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};
