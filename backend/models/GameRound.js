import mongoose from 'mongoose';

const GameRoundSchema = new mongoose.Schema({
  serverSeed: {
    type: String,
    required: true
  },
  serverSeedHash: {
    type: String,
    required: true
  },
  clientSeed: {
    type: String,
    required: true
  },
  combinedHash: {
    type: String,
    required: true
  },
  crashPoint: {
    type: Number,
    required: true
  },
  totalWagered: {
    type: Number,
    default: 0
  },
  totalPayout: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('GameRound', GameRoundSchema);
