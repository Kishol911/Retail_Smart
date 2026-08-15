const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      // Not required for users who sign in with Google (they have no local password).
      required: function () {
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return password by default in queries
    },
    googleId: {
      type: String,
      default: null,
      unique: true,
      sparse: true, // allows many docs with no googleId, but no two with the same one
    },
    avatar: {
      type: String,
      default: null,
    },
    // Personal & shop profile — editable from Settings > User & Access Control
    phone: { type: String, default: '' },
    shopName: { type: String, default: '' },
    shopAddress: { type: String, default: '' },
    shopGST: { type: String, default: '' },
    // Advanced settings
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
    },
  },
  { timestamps: true }
);

// Hash the password before saving, only if it was modified (or is new) and actually set.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare entered password with the hashed one in DB.
// Google-only accounts have no password, so they can never match.
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
