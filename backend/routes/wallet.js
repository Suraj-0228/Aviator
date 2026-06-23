import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Bet from '../models/Bet.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Deposit funds (auto-completed for demo purposes)
// @route   POST /api/wallet/deposit
router.post('/deposit', protect, async (req, res) => {
  const { amount, method } = req.body;
  
  const depositAmt = parseFloat(amount);
  if (isNaN(depositAmt) || depositAmt <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid deposit amount' });
  }

  try {
    const user = await User.findById(req.user._id);
    
    // Increment wallet balance
    user.balance += depositAmt;
    await user.save();

    // Create completed Transaction log
    await Transaction.create({
      userId: user._id,
      type: 'deposit',
      amount: depositAmt,
      status: 'completed',
      paymentGateway: method || 'mock_gateway'
    });

    return res.status(200).json({
      success: true,
      newBalance: user.balance,
      message: 'Deposit successful'
    });
  } catch (err) {
    console.error('Deposit error:', err);
    return res.status(500).json({ success: false, error: 'Server error processing deposit' });
  }
});

// @desc    Request withdrawal (starts as pending)
// @route   POST /api/wallet/withdraw
router.post('/withdraw', protect, async (req, res) => {
  const { amount, method, destination } = req.body;
  
  const withdrawAmt = parseFloat(amount);
  if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid withdrawal amount' });
  }

  try {
    const user = await User.findById(req.user._id);
    
    if (user.balance < withdrawAmt) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Deduct balance immediately upon request
    user.balance -= withdrawAmt;
    await user.save();

    // Create pending Transaction log (requires admin approval)
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'withdrawal',
      amount: withdrawAmt,
      status: 'pending',
      paymentGateway: method || 'bank_transfer',
      paymentDetails: { destination }
    });

    return res.status(200).json({
      success: true,
      newBalance: user.balance,
      transaction,
      message: 'Withdrawal request submitted for approval'
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    return res.status(500).json({ success: false, error: 'Server error processing withdrawal' });
  }
});

// @desc    Get user's ledger logs
// @route   GET /api/wallet/transactions
router.get('/transactions', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, transactions });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error listing transactions' });
  }
});

// @desc    Get personal betting history
// @route   GET /api/wallet/bets
router.get('/bets', protect, async (req, res) => {
  try {
    const bets = await Bet.find({ userId: req.user._id })
      .populate('roundId', 'serverSeedHash crashPoint')
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({ success: true, bets });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error listing wagers' });
  }
});

export default router;
