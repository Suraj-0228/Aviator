import mongoose from 'mongoose';

const BetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameRound',
    required: true
  },
  betAmount: {
    type: Number,
    required: true
  },
  cashoutMultiplier: {
    type: Number,
    default: null // null if lost
  },
  payoutAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost'],
    default: 'pending'
  },
  panelIndex: {
    type: Number,
    default: 1 // Support dual bet (panel 1 or 2)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Bet', BetSchema);
