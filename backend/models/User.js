import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0.00 // Default demo balance
  },
  clientSeed: {
    type: String,
    default: () => 'seed_' + Math.random().toString(36).substring(2, 9)
  },
  avatar: {
    type: String,
    default: 'fa-user-astronaut'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Remove passwordHash from JSON responses
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  }
});

export default mongoose.model('User', UserSchema);
