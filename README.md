# Aviator Game - MERN Stack Flight Cockpit

A real-time, mobile-first multiplayer crash flight simulation game built on the MERN stack (MongoDB, Express, React, Node.js) with real-time WebSockets (Socket.io) and cryptographically verifiable Provably Fair crash points.

---

## 🚀 Key Features

### 🎮 Player Experience (Game Mode)
- **Real-Time Flight Cockpit Canvas**: A fully reactive custom canvas animation engine that tracks the flight path and multiplier curve in real time.
- **Dual Betting Panels**: Supports two simultaneous active wagers per player round, complete with instant preset buttons, automatic bet placing, and customizable auto-cashout values.
- **Real-Time Multiplier Strip**: A scrollable history header showing colors categorized by multiplier levels (cyan, purple, fuchsia, and glowing pink for jackpot 100x+ runs).
- **Provably Fair Verification Modal**: A cryptographic validation console displaying the pre-round server seed SHA-256 hash, enabling players to customize their client seed and verify the mathematical crash point generation formula.
- **Interactive Service Center**: Links to pilot settings (change password, delete account), a step-by-step game guide, an "About us" page, and a notice board explaining that the game is built purely for fun.
- **Virtual Bank Balance & Transfers**: A starting virtual bank account balance (₹1,00,000.00 default) where players can transfer funds to their game wallet. Withdrawal requests are deducted from the cockpit balance and credited back to the bank balance upon administrative approval.
- **Virtual Bank Account Details Modal**: A passbook-like visual card (replacing the generic ARWallet button) in the pilot profile containing account card numbers, holder details, IFSC codes, status, and quick links to deposit/withdraw.
- **7-Day Streak Daily Check-in Grid**: An interactive daily check-in streak calendar (Day 1-6: ₹100-₹600, Day 7: ₹1000 jackpot) where players click on today's active pulsing card to claim rewards, playing sound chimes upon successful claims.

### 🛡️ Admin Dashboard (Control Cabin)
- **Real-Time Stats Grid**: Displays total registered pilots, house margin calculations, aggregate deposits, and approved payouts.
- **Control Cabin Status Logs**: Monitors database links, system uptime, and server tick loops.
- **Pending Cashouts Console**: Administrators can review bank/UPI payout details to either approve or reject (approvals instantly credit the player's virtual bank account; rejections refund the game wallet).
- **Player Balance Ledger**: A searchable pilot database displaying both cockpit game balances and virtual bank balances, allowing manual wallet balance adjustments.
- **Unified Navigation Bar**: An admin-specific bottom footer that transitions seamlessly across pages (Stats, Cashouts, Users, Admin Profile, and the Cockpit game screen).

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Axios, Socket.io-client.
- **Backend**: Node.js, Express, Socket.io, Mongoose.
- **Database**: MongoDB (Community / Atlas).

---

## 📂 Project Structure

```text
Aviator/
├── backend/
│   ├── middleware/        # JWT Authentication checks
│   ├── models/            # MongoDB Schemas (User, Bet, Transaction, GameRound)
│   ├── routes/            # REST API endpoints (Auth, Admin, Wallet)
│   ├── socket/            # Real-time WebSocket game loop and ticks
│   ├── .env               # Server environment configurations
│   └── server.js          # Express server entry point
└── frontend/
    ├── src/
    │   ├── context/       # React Contexts (AuthContext, SocketContext)
    │   ├── pages/         # Screen views (Lobby, Play, Profile, Admin, etc.)
    │   ├── utils/         # Canvas graphics engine and sound engine
    │   ├── App.jsx        # Routing structure & Protected Route Wrapper
    │   └── index.css      # Core styles & Tailwind directives
    └── package.json       # Frontend scripts and dependencies
```

---

## 💻 Running Locally

### Prerequisites
- Install **Node.js** (v16+)
- Install **MongoDB** (Ensure local MongoDB is running on port `27017` to enable fast local databases and offline capabilities).
  *Note: In development mode, the server automatically prioritizes local MongoDB, falling back to the Atlas connection string if local is offline, ensuring a smooth experience in both local and deployed environments.*

### 1. Run the Backend Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *The backend will boot up at `http://localhost:5000`.*

### 2. Run the Frontend Client
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   *(Ensure Vite, Tailwind, and FontAwesome dependencies load correctly)*
3. Start the development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser to play.*

---

## ⚙️ Production Deployment Variables

When deploying the project, make sure to set up the following environment variables:

### Backend Environment Settings
- `MONGO_URI`: Production database link (e.g. MongoDB Atlas connection URL).
- `JWT_SECRET`: A secure secret string used to sign token keys.
- `HOUSE_EDGE`: `0.03` (Sets the house margin to 3%).

### Frontend Environment Settings
- `VITE_API_URL`: The URL of your deployed backend service API (e.g., `https://api.yourdomain.com/api`).
- `VITE_SOCKET_URL`: The base URL of your deployed backend socket connection (e.g., `https://api.yourdomain.com`).
