const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new admin user
// @route   POST /api/auth/register
// @access  Public (in production you may want to restrict/disable this after first admin is created)
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email and password');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User with this email already exists');
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Explicitly select password since schema excludes it by default
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

// @desc    Login (or auto-register) using a Google ID token from the frontend
// @route   POST /api/auth/google
// @access  Public
// The frontend uses Google Identity Services to get an "idToken" for the signed-in
// Gmail account, then sends it here. We verify it directly with Google's servers —
// we never see or store the user's Google password.
const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body; // ID token from @react-oauth/google

    if (!credential) {
      res.status(400);
      throw new Error('Missing Google credential');
    }

    // Verifies the token's signature, audience, and expiry with Google.
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      res.status(400);
      throw new Error('Google account has no email');
    }

    // Match an existing account either by googleId or by email (so a user who
    // registered manually with the same Gmail address can also use "Sign in with Google").
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = user.avatar || picture;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(401);
    next(new Error('Google sign-in failed. Please try again.'));
  }
};

// @desc    Update the logged-in user's personal + shop profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { name, phone, shopName, shopAddress, shopGST, theme } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (shopName !== undefined) user.shopName = shopName;
    if (shopAddress !== undefined) user.shopAddress = shopAddress;
    if (shopGST !== undefined) user.shopGST = shopGST;
    if (theme !== undefined) user.theme = theme;

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      shopName: updated.shopName,
      shopAddress: updated.shopAddress,
      shopGST: updated.shopGST,
      theme: updated.theme,
      avatar: updated.avatar,
      role: updated.role,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change the logged-in user's password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400);
      throw new Error('Please fill in all password fields');
    }
    if (newPassword !== confirmPassword) {
      res.status(400);
      throw new Error('New password and confirmation do not match');
    }
    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    if (!user.password) {
      res.status(400);
      throw new Error('This account signs in with Google and has no password to change');
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword; // pre('save') hook re-hashes it
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  googleLogin,
  updateProfile,
  changePassword,
};
