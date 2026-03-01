const jwt = require('jsonwebtoken');
const Alumni = require('../models/Alumni');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1) Header must exist and start with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized: no Bearer token in header' });
    }

    // 2) Extract the token part
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Not authorized: token missing after Bearer' });
    }

    // 3) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4) Load user
    const user = await Alumni.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized: user not found' });
    }

    req.user = user;

    // 5) All good
    return next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Not authorized: token invalid or expired' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Admins only' });
};

module.exports = { protect, adminOnly };