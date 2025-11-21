const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.body.token || req.query.token;
  
  if (!token) {
    console.log('❌ Auth failed: No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('❌ Auth failed: User not found for token');
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }
    
    req.user = user;
    console.log('✅ Auth success:', user.email, '(' + user.role + ')');
    next();
  } catch (err) {
    console.error('❌ Auth failed:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalid - please login again' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired - please login again' });
    }
    
    res.status(401).json({ message: 'Authentication failed' });
  }
};

const permit = (...allowed) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (allowed.includes(req.user.role)) return next();
  return res.status(403).json({ message: 'Forbidden' });
};

module.exports = { auth, permit };
