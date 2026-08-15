const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protects routes by verifying the JWT sent in the Authorization header.
// Usage: router.get('/protected', protect, handler)
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user (without password) to the request for downstream handlers
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }

      return next();
    } catch (error) {
      res.status(401);
      return next(new Error('Not authorized, token failed'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }
};

module.exports = { protect };
