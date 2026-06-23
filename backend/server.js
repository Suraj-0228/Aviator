import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Import Routes
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import adminRoutes from './routes/admin.js';

// Import Game Controller
import GameController from './socket/gameLoop.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS allowance
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev simplicity
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Bind API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('MERN Aviator Engine Server Running...');
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aviator_db';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('[Database] MongoDB connected successfully.');
    
    // Start game controller after database connects
    const gameController = new GameController(io);
    gameController.start();

    // Socket auth middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          next();
        } catch (err) {
          console.warn('[Socket] Connection auth failed:', err.message);
          next(new Error('Authentication failed'));
        }
      } else {
        // Guests can watch game ticks
        next();
      }
    });

    // Socket Event listeners
    io.on('connection', (socket) => {
      console.log(`[Socket] Client connected: ${socket.id} (User: ${socket.userId || 'Guest'})`);

      // 0. Request Game State Sync Event
      socket.on('request_game_state', (data, callback) => {
        if (typeof callback === 'function') {
          callback({
            success: true,
            ...gameController.getCurrentState()
          });
        }
      });

      // 1. Place Bet Event
      socket.on('place_bet', async (data, callback) => {
        if (!socket.userId) {
          return callback({ success: false, error: 'Unauthorized login required' });
        }
        
        const { betAmount, panelIndex } = data;
        const result = await gameController.handlePlaceBet(
          socket.userId,
          parseFloat(betAmount),
          parseInt(panelIndex || 1)
        );
        
        callback(result);
      });

      // 2. Cashout Event
      socket.on('cashout', async (data, callback) => {
        if (!socket.userId) {
          return callback({ success: false, error: 'Unauthorized login required' });
        }
        
        const { panelIndex } = data;
        const result = await gameController.handleCashout(
          socket.userId,
          parseInt(panelIndex || 1)
        );
        
        callback(result);
      });

      socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
      });
    });

    // Start Server Listener
    server.listen(PORT, () => {
      console.log(`[Server] Aviator backend running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[Database] MongoDB connection failed:', err.message);
    process.exit(1);
  });
