import express from 'express';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Bet from '../models/Bet.js';
import { protect, adminProtect } from '../middleware/auth.js';

const router = express.Router();

// Apply admin protection to all routes
router.use(protect, adminProtect);

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Ledger aggregation sums
    const transactions = await Transaction.find({});
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    
    transactions.forEach(t => {
      if (t.status === 'completed') {
        if (t.type === 'deposit') totalDeposits += t.amount;
        if (t.type === 'withdrawal') totalWithdrawals += t.amount;
      }
    });

    const bets = await Bet.find({});
    let totalWagered = 0;
    let totalPayout = 0;
    
    bets.forEach(b => {
      totalWagered += b.betAmount;
      totalPayout += b.payoutAmount;
    });

    const netProfit = totalWagered - totalPayout; // house earnings

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalDeposits,
        totalWithdrawals,
        totalWagered,
        totalPayout,
        netProfit
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ success: false, error: 'Server error compiling dashboard' });
  }
});

// @desc    List all users
// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error listing users' });
  }
});

// @desc    Update a user's balance manually
// @route   POST /api/admin/users/:id/balance
router.post('/users/:id/balance', async (req, res) => {
  const { amount } = req.body;
  const newBalance = parseFloat(amount);
  
  if (isNaN(newBalance) || newBalance < 0) {
    return res.status(400).json({ success: false, error: 'Invalid balance amount' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    user.balance = newBalance;
    await user.save();
    
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error modifying wallet' });
  }
});

// @desc    List all pending withdrawals
// @route   GET /api/admin/withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: 'withdrawal', status: 'pending' })
      .populate('userId', 'username email balance')
      .sort({ createdAt: 1 });
    return res.status(200).json({ success: true, withdrawals });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error listing withdrawals' });
  }
});

// @desc    Approve a withdrawal request
// @route   POST /api/admin/withdrawals/:id/approve
router.post('/withdrawals/:id/approve', async (req, res) => {
  try {
    const trans = await Transaction.findById(req.params.id);
    if (!trans) return res.status(404).json({ success: false, error: 'Transaction not found' });
    if (trans.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Transaction is already processed' });
    }

    trans.status = 'completed';
    await trans.save();

    // Credit user's virtual bank balance on approval
    const user = await User.findById(trans.userId);
    if (user) {
      if (user.bankBalance === undefined || user.bankBalance === null) {
        user.bankBalance = 100000.00;
      }
      user.bankBalance += trans.amount;
      await user.save();
    }

    return res.status(200).json({ success: true, transaction: trans, message: 'Withdrawal approved and credited to player bank' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error approving withdrawal' });
  }
});

// @desc    Reject a withdrawal request (refund user balance)
// @route   POST /api/admin/withdrawals/:id/reject
router.post('/withdrawals/:id/reject', async (req, res) => {
  try {
    const trans = await Transaction.findById(req.params.id);
    if (!trans) return res.status(404).json({ success: false, error: 'Transaction not found' });
    if (trans.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Transaction is already processed' });
    }

    trans.status = 'rejected';
    await trans.save();

    // Refund user balance
    const user = await User.findById(trans.userId);
    if (user) {
      user.balance += trans.amount;
      await user.save();
    }

    return res.status(200).json({ success: true, transaction: trans, message: 'Withdrawal rejected and refunded' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error rejecting withdrawal' });
  }
});

export default router;
