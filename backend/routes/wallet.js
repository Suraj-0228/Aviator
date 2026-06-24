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
    
    // Ensure bankBalance exists (fallback for existing users)
    if (user.bankBalance === undefined || user.bankBalance === null) {
      user.bankBalance = 100000.00;
    }
    
    // Validate bank balance limit
    if (user.bankBalance < depositAmt) {
      return res.status(400).json({ success: false, error: 'Insufficient bank account balance' });
    }
    
    // Deduct from bank balance, credit to game wallet balance
    user.bankBalance -= depositAmt;
    user.balance += depositAmt;
    await user.save();

    // Create completed Transaction log
    await Transaction.create({
      userId: user._id,
      type: 'deposit',
      amount: depositAmt,
      status: 'completed',
      paymentGateway: method || 'bank_transfer'
    });

    return res.status(200).json({
      success: true,
      newBalance: user.balance,
      newBankBalance: user.bankBalance,
      message: 'Deposit successful'
    });
  } catch (err) {
    console.error('Deposit error:', err);
    return res.status(500).json({ success: false, error: 'Server error processing deposit' });
  }
});

// @desc    Daily check-in (Option B: credits virtual bank balance)
// @route   POST /api/wallet/check-in
router.post('/check-in', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (user.lastCheckIn) {
      const lastDate = new Date(user.lastCheckIn);
      const lastCheckInDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      
      if (today.getTime() === lastCheckInDay.getTime()) {
        return res.status(400).json({ success: false, error: 'You have already checked in today!' });
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastCheckInDay.getTime() === yesterday.getTime()) {
        user.checkInStreak = (user.checkInStreak % 7) + 1;
      } else {
        user.checkInStreak = 1; // streak broken
      }
    } else {
      user.checkInStreak = 1;
    }

    // Streak rewards: Day 1 (+100) -> Day 7 (+1000)
    const rewards = [100, 200, 300, 400, 500, 600, 1000];
    const rewardAmt = rewards[user.checkInStreak - 1];

    if (user.bankBalance === undefined || user.bankBalance === null) {
      user.bankBalance = 100000.00;
    }
    user.bankBalance += rewardAmt;
    user.lastCheckIn = now;
    await user.save();

    // Create completed Transaction log
    await Transaction.create({
      userId: user._id,
      type: 'deposit',
      amount: rewardAmt,
      status: 'completed',
      paymentGateway: 'daily_checkin'
    });

    return res.status(200).json({
      success: true,
      newBalance: user.balance,
      newBankBalance: user.bankBalance,
      streak: user.checkInStreak,
      reward: rewardAmt,
      message: `Checked in successfully! +₹${rewardAmt} added to virtual bank balance.`
    });
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ success: false, error: 'Server error processing check-in' });
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
