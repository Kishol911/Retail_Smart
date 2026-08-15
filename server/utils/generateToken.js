const jwt = require('jsonwebtoken');

// Generates a signed JWT containing the user's id.
// This token is sent to the client and used to authenticate future requests.
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
