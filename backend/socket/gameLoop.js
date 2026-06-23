import crypto from 'crypto';
import GameRound from '../models/GameRound.js';
import Bet from '../models/Bet.js';
import User from '../models/User.js';

class GameController {
  constructor(io) {
    this.io = io;
    
    // Core game state
    this.gameState = 'PRE_ROUND'; // PRE_ROUND, PLAYING, CRASHED
    this.currentMultiplier = 1.00;
    this.crashPoint = 1.00;
    this.roundStartTime = null;
    this.countdownDuration = 6000; // 6 seconds
    this.preRoundStartTime = null;
    this.history = [];
    this.lobbyBets = [];
    
    // DB Round references
    this.currentRoundId = null;
    this.serverSeed = '';
    this.serverSeedHash = '';
    this.clientSeed = 'default_aviator_global_seed';
    this.combinedHash = '';
    
    // Connected active bets in memory for quick loop access
    // Format: userId -> { betId, betAmount, status, panelIndex }
    this.activeBets = new Map();
  }

  sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  generateRandomHex(length) {
    return crypto.randomBytes(length / 2).toString('hex');
  }

  calculateCrashPoint(hash) {
    const hex = hash.substring(0, 13);
    const dec = parseInt(hex, 16);
    
    // 3% house edge (instant crash at 1.00x)
    if (dec % 33 === 0) {
      return 1.00;
    }
    
    const h = Math.pow(2, 52);
    const multiplier = Math.floor(((100 * h - dec) / (h - dec)) * 100) / 100;
    return Math.max(1.00, Number((multiplier / 100).toFixed(2)));
  }

  async start() {
    await this.loadHistory();
    this.startPreRound();
  }

  async loadHistory() {
    try {
      const recentRounds = await GameRound.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(15);
      this.history = recentRounds.map(r => r.crashPoint);
    } catch (e) {
      console.error('[GameEngine] Failed to load history from DB:', e);
      this.history = [1.24, 3.66, 13.79, 1.01, 4.87, 112.74, 1.54, 9.95, 1.38, 2.45];
    }
  }

  generateVirtualLobby() {
    const names = ['TurboBet', 'BitPilot', 'MaxRider', 'CashOutKing', 'AltFlyer', 'SonicBoom', 'Zephyr', 'Falcon'];
    const count = 15 + Math.floor(Math.random() * 15);
    
    this.lobbyBets = Array.from({ length: count }, () => {
      const name = names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random() * 100);
      const bet = Number((50 + Math.random() * 2000).toFixed(0));
      const rand = Math.random();
      let target;
      if (rand < 0.2) target = 1.05 + Math.random() * 0.3;
      else if (rand < 0.7) target = 1.3 + Math.random() * 1.5;
      else if (rand < 0.9) target = 2.8 + Math.random() * 6.0;
      else target = 8.8 + Math.random() * 30.0;

      return {
        name,
        bet,
        cashoutTarget: Number(target.toFixed(2)),
        cashedOut: false,
        cashoutMult: null,
        payout: null,
        isReal: false
      };
    });
  }

  updateVirtualLobbyCashouts() {
    this.lobbyBets.forEach(p => {
      if (!p.isReal && !p.cashedOut && this.currentMultiplier >= p.cashoutTarget) {
        p.cashedOut = true;
        p.cashoutMult = p.cashoutTarget;
        p.payout = Number((p.bet * p.cashoutMult).toFixed(2));
        
        this.io.emit('lobby_cashout', {
          username: p.name,
          cashoutMult: p.cashoutMult,
          payout: p.payout,
          isReal: false
        });
      }
    });
  }

  async startPreRound() {
    this.gameState = 'PRE_ROUND';
    this.currentMultiplier = 1.00;
    this.activeBets.clear();
    this.preRoundStartTime = Date.now();

    // Clear and generate virtual lobby bets
    this.lobbyBets = [];
    this.generateVirtualLobby();
    
    // Generate seeds
    this.serverSeed = this.generateRandomHex(64);
    this.serverSeedHash = this.sha256(this.serverSeed);
    
    // Combined hash
    const combinedString = `${this.serverSeed}-${this.clientSeed}`;
    this.combinedHash = this.sha256(combinedString);
    this.crashPoint = this.calculateCrashPoint(this.combinedHash);
    
    console.log(`[GameEngine] Preparing next round. Crash Point: ${this.crashPoint}x`);
    
    try {
      // Save round template to database
      const round = await GameRound.create({
        serverSeed: this.serverSeed,
        serverSeedHash: this.serverSeedHash,
        clientSeed: this.clientSeed,
        combinedHash: this.combinedHash,
        crashPoint: this.crashPoint
      });
      this.currentRoundId = round._id;
    } catch (e) {
      console.error('[GameEngine] Database error saving round:', e);
    }
    
    // Broadcast countdown start to all clients with lobby bets included
    this.io.emit('round_prepare', {
      countdownDuration: this.countdownDuration,
      serverSeedHash: this.serverSeedHash,
      roundId: this.currentRoundId,
      lobbyBets: this.lobbyBets
    });
    
    // Set timer for flight takeoff
    setTimeout(() => {
      this.startFlight();
    }, this.countdownDuration);
  }

  startFlight() {
    this.gameState = 'PLAYING';
    this.roundStartTime = Date.now();
    
    this.io.emit('round_start', {
      roundId: this.currentRoundId,
      startTime: this.roundStartTime
    });
    
    // Start interval loop
    this.loopInterval = setInterval(() => {
      this.tickFlight();
    }, 50);
  }

  async tickFlight() {
    if (this.gameState !== 'PLAYING') return;
    
    const elapsed = Date.now() - this.roundStartTime;
    const tSeconds = elapsed / 1000;
    
    // Growth formula: 1.00 * e^(0.065 * t)
    this.currentMultiplier = Math.pow(Math.E, 0.065 * tSeconds);
    
    // Update virtual lobby cashouts
    this.updateVirtualLobbyCashouts();
    
    // Broadcast current multiplier
    this.io.emit('multiplier_update', {
      multiplier: this.currentMultiplier
    });
    
    // Check for crash
    if (this.currentMultiplier >= this.crashPoint) {
      clearInterval(this.loopInterval);
      this.triggerCrash();
    }
  }

  async triggerCrash() {
    this.gameState = 'CRASHED';
    console.log(`[GameEngine] Round crashed at: ${this.crashPoint}x`);
    
    // Add to history
    this.history.unshift(this.crashPoint);
    if (this.history.length > 15) this.history.pop();
    
    // Broadcast crash details
    this.io.emit('round_crash', {
      crashPoint: this.crashPoint
    });
    
    // Resolve all unpaid (lost) wagers
    const userBetsToLose = [];
    const dbBetIdsToLose = [];
    
    for (const [userId, activeBetList] of this.activeBets.entries()) {
      activeBetList.forEach(bet => {
        if (bet.status === 'pending') {
          bet.status = 'lost';
          dbBetIdsToLose.push(bet.betId);
          userBetsToLose.push(userId);
        }
      });
    }

    try {
      // Bulk update bets to 'lost' in DB
      if (dbBetIdsToLose.length > 0) {
        await Bet.updateMany(
          { _id: { $in: dbBetIdsToLose } },
          { $set: { status: 'lost' } }
        );
      }
      
      // Update GameRound stats
      let totalWager = 0;
      let totalPay = 0;
      
      const allBetsInRound = await Bet.find({ roundId: this.currentRoundId });
      allBetsInRound.forEach(b => {
        totalWager += b.betAmount;
        totalPay += b.payoutAmount;
      });
      
      await GameRound.updateOne(
        { _id: this.currentRoundId },
        { 
          $set: { 
            totalWagered: totalWager,
            totalPayout: totalPay
          } 
        }
      );
    } catch (e) {
      console.error('[GameEngine] Database error during crash resolution:', e);
    }
    
    // Wait 4.5 seconds and start next round
    setTimeout(() => {
      this.startPreRound();
    }, 4500);
  }

  getCurrentState() {
    const elapsed = this.preRoundStartTime ? (Date.now() - this.preRoundStartTime) : 0;
    const countdownRemaining = Math.max(0, this.countdownDuration - elapsed);

    return {
      gameState: this.gameState,
      multiplier: this.currentMultiplier,
      serverSeedHash: this.serverSeedHash,
      roundId: this.currentRoundId,
      history: this.history,
      countdownRemaining,
      lobbyBets: this.lobbyBets
    };
  }

  // Handle a user placing a bet
  async handlePlaceBet(userId, betAmount, panelIndex) {
    if (this.gameState !== 'PRE_ROUND') {
      return { success: false, error: 'Round already started or crashed' };
    }

    if (betAmount < 10 || betAmount > 8000) {
      return { success: false, error: 'Bet amount must be between ₹10 and ₹8,000' };
    }
    
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };
      if (user.balance < betAmount) return { success: false, error: 'Insufficient balance' };
      
      // Deduct user balance
      user.balance -= betAmount;
      await user.save();
      
      // Create Bet in DB
      const bet = await Bet.create({
        userId: user._id,
        roundId: this.currentRoundId,
        betAmount,
        panelIndex
      });
      
      // Store in activeBets Map
      if (!this.activeBets.has(userId.toString())) {
        this.activeBets.set(userId.toString(), []);
      }
      
      this.activeBets.get(userId.toString()).push({
        betId: bet._id,
        betAmount,
        status: 'pending',
        panelIndex
      });

      // Add to lobbyBets array
      this.lobbyBets.push({
        name: user.username,
        bet: betAmount,
        cashedOut: false,
        cashoutMult: null,
        payout: null,
        isReal: true,
        userId: user._id,
        panelIndex
      });
      
      // Broadcast new bet to lobby
      this.io.emit('lobby_new_bet', {
        username: user.username,
        betAmount,
        panelIndex,
        userId: user._id
      });
      
      return { success: true, newBalance: user.balance, betId: bet._id };
    } catch (e) {
      console.error('[GameEngine] Error placing bet:', e);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Handle a user cashing out
  async handleCashout(userId, panelIndex) {
    if (this.gameState !== 'PLAYING') {
      return { success: false, error: 'Game not currently in flight' };
    }
    
    const activeList = this.activeBets.get(userId.toString());
    if (!activeList) return { success: false, error: 'No active bets found' };
    
    const activeBet = activeList.find(b => b.panelIndex === panelIndex && b.status === 'pending');
    if (!activeBet) return { success: false, error: 'Active bet not found for this panel' };
    
    // Capture current multiplier
    const cashoutMult = this.currentMultiplier;
    const payout = activeBet.betAmount * cashoutMult;
    
    try {
      // Update User Balance
      const user = await User.findById(userId);
      user.balance += payout;
      await user.save();
      
      // Update Bet in DB
      const dbBet = await Bet.findById(activeBet.betId);
      dbBet.status = 'won';
      dbBet.cashoutMultiplier = cashoutMult;
      dbBet.payoutAmount = payout;
      await dbBet.save();
      
      // Mark as cashed out in memory
      activeBet.status = 'won';

      // Update in lobbyBets array
      const lbBet = this.lobbyBets.find(
        b => b.isReal && b.userId.toString() === userId.toString() && b.panelIndex === panelIndex && !b.cashedOut
      );
      if (lbBet) {
        lbBet.cashedOut = true;
        lbBet.cashoutMult = cashoutMult;
        lbBet.payout = payout;
      }
      
      // Broadcast cashout to lobby
      this.io.emit('lobby_cashout', {
        userId,
        username: user.username,
        cashoutMult,
        payout,
        panelIndex,
        isReal: true
      });
      
      return { success: true, payout, cashoutMult, newBalance: user.balance };
    } catch (e) {
      console.error('[GameEngine] Cashout error:', e);
      return { success: false, error: 'Internal server error' };
    }
  }
}

export default GameController;
