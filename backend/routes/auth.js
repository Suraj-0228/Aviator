import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide all details' });
    }

    const usernameExists = await User.findOne({ username });
    const emailExists = await User.findOne({ email });

    if (usernameExists) {
      return res.status(400).json({ success: false, error: 'Username already taken' });
    }
    if (emailExists) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User (default demo balance is 10000)
    const user = await User.create({
      username,
      email,
      passwordHash
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, error: 'Server error during registration' });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  try {
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, error: 'Please provide username/email and password' });
    }

    // User can login by username or email
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    }).select('+passwordHash'); // include password hash manually if hidden

    if (!user) {
      // Find again (some schemas hide by default, check if we need to select)
      // Actually we didn't specify select: false in schema, so it returns by default.
      // But let's check manually:
      const checkUser = await User.findOne({
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
      });
      if (!checkUser) {
        return res.status(400).json({ success: false, error: 'Invalid credentials' });
      }
      
      const isMatch = await bcrypt.compare(password, checkUser.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Invalid credentials' });
      }

      const token = generateToken(checkUser._id);
      return res.status(200).json({
        success: true,
        token,
        user: checkUser
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
});

// @desc    Update client seed
// @route   POST /api/auth/seed
router.post('/seed', protect, async (req, res) => {
  const { clientSeed } = req.body;
  if (!clientSeed || clientSeed.trim() === '') {
    return res.status(400).json({ success: false, error: 'Client seed cannot be empty' });
  }

  try {
    req.user.clientSeed = clientSeed.trim();
    await req.user.save();
    return res.status(200).json({ success: true, user: req.user });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error updating seed' });
  }
});

// @desc    Update user profile (avatar, password)
// @route   POST /api/auth/update
router.post('/update', protect, async (req, res) => {
  const { avatar, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (avatar) {
      user.avatar = avatar;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: 'Current password is required' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Incorrect current password' });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    
    const updatedUser = user.toObject();
    delete updatedUser.passwordHash;

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, error: 'Server error updating profile' });
  }
});

// @desc    Delete user account
// @route   DELETE /api/auth/delete
router.delete('/delete', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    await User.findByIdAndDelete(req.user._id);
    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ success: false, error: 'Server error deleting account' });
  }
});

export default router;
