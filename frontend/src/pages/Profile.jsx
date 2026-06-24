import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const { user, syncBalance, updateProfile, logout } = useContext(AuthContext);

  // States for stats and histories
  const [stats, setStats] = useState({
    totalCount: 0,
    totalWagered: 0,
    totalWon: 0,
    netProfit: 0,
    winRate: 0
  });
  const [personalBets, setPersonalBets] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'gameHistory', 'txHistory', 'settings', 'gifts', 'guide', 'about', 'notice'
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');



  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchTransactionHistory();
    }
  }, [user]);

  const handleRefreshBalance = async () => {
    setBalanceRefreshing(true);
    try {
      const res = await axios.get('/auth/profile');
      if (res.data.success) {
        syncBalance(res.data.user.balance);
      }
    } catch (e) {
      console.warn('Failed to refresh balance:', e.message);
    } finally {
      setTimeout(() => setBalanceRefreshing(false), 500);
    }
  };

  const fetchUserStats = async () => {
    try {
      const res = await axios.get('/wallet/bets');
      if (res.data.success) {
        const bets = res.data.bets || [];
        setPersonalBets(bets);
        let wagered = 0;
        let won = 0;
        let winCount = 0;
        
        bets.forEach(b => {
          wagered += b.betAmount;
          if (b.status === 'won') {
            won += b.payoutAmount;
            winCount++;
          }
        });

        setStats({
          totalCount: bets.length,
          totalWagered: wagered,
          totalWon: won,
          netProfit: won - wagered,
          winRate: bets.length > 0 ? Math.round((winCount / bets.length) * 100) : 0
        });
      }
    } catch (e) {
      console.warn('Failed to load user stats:', e.message);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const res = await axios.get('/wallet/transactions');
      if (res.data.success) {
        setTransactionHistory(res.data.transactions || []);
      }
    } catch (e) {
      console.warn('Failed to load transaction history:', e.message);
    }
  };



  const copyUserId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id);
      setSuccessMsg('UID copied to clipboard!');
      setTimeout(() => setSuccessMsg(''), 1000);
    }
  };

  return (
    <div class="h-screen bg-[#131418] text-white flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#2d303b]/50 select-none overflow-hidden">
      
      {/* Toast Notification */}
      {successMsg && (
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-full shadow-lg text-center whitespace-nowrap animate-bounce">
          {successMsg}
        </div>
      )}

      {/* 1. TOP PROFILE HERO BANNER */}
      <section class="bg-gradient-to-br from-red-500/25 via-rose-500/5 to-transparent px-5 pt-8 pb-5 flex flex-col gap-4 relative overflow-hidden shrink-0">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-[30px] pointer-events-none"></div>
        
        {/* User identification row */}
        <div class="flex items-center gap-4.5">
          <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 border border-white/10 flex items-center justify-center text-white shadow-xl">
            <i class={`fa-solid ${user?.avatar || 'fa-user-astronaut'} text-2xl`}></i>
          </div>
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-2">
              <span class="text-sm font-black tracking-tight text-white">{user?.username}</span>
              {user?.role === 'admin' ? (
                <span class="bg-gradient-to-r from-purple-650 to-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 shadow-sm shadow-purple-950/25">
                  <i class="fa-solid fa-user-shield text-[7px]"></i> Admin
                </span>
              ) : (
                <span class="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                  VIP0
                </span>
              )}
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-400">
              <span>UID | {user?._id?.substring(0, 8) || '7876928'}</span>
              <button onClick={copyUserId} class="text-gray-500 hover:text-white transition cursor-pointer">
                <i class="fa-regular fa-copy text-xs"></i>
              </button>
            </div>
            <span class="text-[10px] text-gray-550">Last login: {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Total Balance Card */}
        <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-xl relative overflow-hidden flex flex-col gap-4">
          <div class="flex justify-between items-start">
            <div class="flex flex-col gap-3">
              {/* Wallet Balance */}
              <div class="flex flex-col gap-0.5">
                <span class="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Cockpit Wallet</span>
                <div class="flex items-center gap-2">
                  <span class="text-xl font-black font-mono-val text-emerald-400">₹{user?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  <button onClick={handleRefreshBalance} class="text-gray-500 hover:text-white transition cursor-pointer p-0.5">
                    <i class={`fa-solid fa-rotate text-xs ${balanceRefreshing ? 'animate-spin text-red-500' : ''}`}></i>
                  </button>
                </div>
              </div>
              
              {/* Virtual Bank Balance */}
              <div class="flex flex-col gap-0.5">
                <span class="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Virtual Bank Account</span>
                <span class="text-lg font-black font-mono-val text-white">₹{(user?.bankBalance ?? 100000.00).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <button onClick={() => navigate('/deposit')} class="bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black px-4 py-2.5 rounded-xl transition shadow-md shadow-red-500/10 cursor-pointer uppercase tracking-wider self-center">
              Enter Wallet
            </button>
          </div>

          <div class="border-t border-[#2d303b]/40 pt-3.5 grid grid-cols-4 gap-2 text-center text-xs">
            <button onClick={() => setActiveModal('bankDetails')} class="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition cursor-pointer">
              <i class="fa-solid fa-building-columns text-base text-red-400"></i>
              <span>Bank A/C</span>
            </button>
            <Link to="/deposit" class="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition cursor-pointer">
              <i class="fa-solid fa-circle-plus text-base text-red-500"></i>
              <span>Deposit</span>
            </Link>
            <Link to="/withdraw" class="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition cursor-pointer">
              <i class="fa-solid fa-circle-minus text-base text-rose-400"></i>
              <span>Withdraw</span>
            </Link>
            <Link to="/vip" class="flex flex-col items-center gap-1.5 text-gray-400 hover:text-white transition cursor-pointer">
              <i class="fa-solid fa-crown text-base text-red-500"></i>
              <span>VIP</span>
            </Link>
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER LINKS LIST */}
      <main class="flex-grow overflow-y-auto no-scrollbar px-4 pb-28 space-y-4">

        {/* 2. QUICK ACTIONS GRID */}
        <section class="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setActiveModal('gameHistory')}
            class="bg-[#1a1c22] border border-[#2d303b] p-4 rounded-xl shadow-lg flex items-center justify-between text-left cursor-pointer active:scale-98 transition group"
          >
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-extrabold text-white uppercase group-hover:text-red-500 transition">Game History</span>
              <span class="text-[10px] text-gray-500">My flight game history</span>
            </div>
            <i class="fa-solid fa-plane-departure text-red-500/30 text-lg group-hover:text-red-500 transition"></i>
          </button>
          
          <button 
            onClick={() => setActiveModal('txHistory')}
            class="bg-[#1a1c22] border border-[#2d303b] p-4 rounded-xl shadow-lg flex items-center justify-between text-left cursor-pointer active:scale-98 transition group"
          >
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-extrabold text-white uppercase group-hover:text-red-500 transition">Transaction</span>
              <span class="text-[10px] text-gray-500">Deposit & Payout records</span>
            </div>
            <i class="fa-solid fa-receipt text-red-500/30 text-lg group-hover:text-red-500 transition"></i>
          </button>

          <Link 
            to="/deposit"
            class="bg-[#1a1c22] border border-[#2d303b] p-4 rounded-xl shadow-lg flex items-center justify-between text-left cursor-pointer active:scale-98 transition group"
          >
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-extrabold text-white uppercase group-hover:text-red-500 transition">Deposit History</span>
              <span class="text-[10px] text-gray-500">Instant UPI/Card deposits</span>
            </div>
            <i class="fa-solid fa-file-invoice-dollar text-red-500/30 text-lg group-hover:text-red-500 transition"></i>
          </Link>
          
          <Link 
            to="/withdraw"
            class="bg-[#1a1c22] border border-[#2d303b] p-4 rounded-xl shadow-lg flex items-center justify-between text-left cursor-pointer active:scale-98 transition group"
          >
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-extrabold text-white uppercase group-hover:text-red-500 transition">Withdraw History</span>
              <span class="text-[10px] text-gray-500">My withdrawal logs</span>
            </div>
            <i class="fa-solid fa-money-check-dollar text-red-500/30 text-lg group-hover:text-red-500 transition"></i>
          </Link>
        </section>

        {/* 3. DIRECT ACTION LISTS */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl divide-y divide-[#2d303b]/50 shadow-lg">
          <button onClick={() => setActiveModal('gifts')} class="w-full px-4 py-3 flex items-center justify-between text-xs cursor-pointer text-left hover:bg-white/[0.02] transition">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-gift text-red-500 w-4 text-center"></i>
              <span class="font-bold text-gray-300">Gifts & Redemptions</span>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-600 text-[10px]"></i>
          </button>

          <button onClick={() => setActiveModal('gameHistory')} class="w-full px-4 py-3 flex items-center justify-between text-xs cursor-pointer text-left hover:bg-white/[0.02] transition">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-chart-line text-red-500 w-4 text-center"></i>
              <span class="font-bold text-gray-300">Game statistics</span>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-600 text-[10px]"></i>
          </button>
        </section>

        {/* 4. SERVICE CENTER GRID */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg space-y-3.5">
          <span class="text-xs font-black text-gray-500 uppercase tracking-widest block">Service Center</span>
          
          <div class="grid grid-cols-4 gap-y-4 gap-x-1.5 text-center text-xs">
            <Link to="/settings" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition cursor-pointer">
              <div class="w-8 h-8 rounded-full bg-[#131418] flex items-center justify-center text-red-500 shadow-inner">
                <i class="fa-solid fa-gear"></i>
              </div>
              <span class="font-semibold text-[11px] truncate max-w-full">Settings</span>
            </Link>
            <Link to="/guide" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition cursor-pointer">
              <div class="w-8 h-8 rounded-full bg-[#131418] flex items-center justify-center text-red-500 shadow-inner">
                <i class="fa-solid fa-book-open"></i>
              </div>
              <span class="font-semibold text-[11px] truncate max-w-full">Guide</span>
            </Link>
            <Link to="/about-us" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition cursor-pointer">
              <div class="w-8 h-8 rounded-full bg-[#131418] flex items-center justify-center text-red-500 shadow-inner">
                <i class="fa-solid fa-circle-info"></i>
              </div>
              <span class="font-semibold text-[11px] truncate max-w-full">About us</span>
            </Link>
            <Link to="/notice" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition cursor-pointer">
              <div class="w-8 h-8 rounded-full bg-[#131418] flex items-center justify-center text-red-500 shadow-inner">
                <i class="fa-solid fa-circle-exclamation animate-pulse"></i>
              </div>
              <span class="font-semibold text-[11px] truncate max-w-full">Notice</span>
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition cursor-pointer animate-pulse">
                <div class="w-8 h-8 rounded-full bg-[#131418] flex items-center justify-center text-red-500 shadow-inner border border-red-500/10">
                  <i class="fa-solid fa-user-shield"></i>
                </div>
                <span class="font-semibold text-[11px] truncate max-w-full text-red-400">Admin</span>
              </Link>
            )}
          </div>
        </section>

        {/* 5. LOGOUT BUTTON */}
        <button 
          onClick={() => setLogoutConfirmOpen(true)}
          class="w-full border border-rose-500/30 hover:bg-rose-500/5 text-rose-400 hover:text-rose-350 font-black py-3 rounded-xl transition cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-4 shadow-sm shadow-rose-950/20 active:scale-98"
        >
          <i class="fa-solid fa-power-off text-sm"></i> Log Out
        </button>

      </main>

      {/* 6. BOTTOM MOBILE FOOTER NAVIGATION */}
      {user?.role === 'admin' ? (
        <footer class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1a1c22]/95 border-t border-[#2d303b] py-1 px-2 flex justify-around items-center z-40 shadow-[0_-5px_25px_rgba(0,0,0,0.6)] backdrop-blur-lg">
          {/* Tab 1: Cockpit */}
          <Link to="/play" class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer transition">
            <i class="fa-solid fa-paper-plane text-base"></i>
            <span class="text-[9px] font-bold uppercase tracking-wider">Cockpit</span>
          </Link>
          
          {/* Tab 2: Dashboard */}
          <Link to="/admin" state={{ activeView: 'stats' }} class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer transition">
            <i class="fa-solid fa-chart-pie text-base"></i>
            <span class="text-[9px] font-bold uppercase tracking-wider">Dashboard</span>
          </Link>

          {/* Tab 3: Cashouts */}
          <Link to="/admin" state={{ activeView: 'cashouts' }} class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer transition">
            <i class="fa-solid fa-money-bill-transfer text-base"></i>
            <span class="text-[9px] font-bold uppercase tracking-wider">Cashouts</span>
          </Link>

          {/* Tab 4: Users */}
          <Link to="/admin" state={{ activeView: 'users' }} class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer transition">
            <i class="fa-solid fa-users-gear text-base"></i>
            <span class="text-[9px] font-bold uppercase tracking-wider">Users</span>
          </Link>

          {/* Tab 5: Profile (Highlighted) */}
          <Link to="/admin" state={{ activeView: 'profile' }} class="flex flex-col items-center gap-0.5 text-red-500 py-1 cursor-pointer transition">
            <i class="fa-solid fa-user-shield text-base"></i>
            <span class="text-[9px] font-bold uppercase tracking-wider">Profile</span>
          </Link>
        </footer>
      ) : (
        <footer class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1a1c22]/95 border-t border-[#2d303b] py-1 px-2 flex justify-around items-center z-40 shadow-[0_-5px_25px_rgba(0,0,0,0.6)] backdrop-blur-lg">
          {/* Tab 1: Home */}
          <Link to="/" class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer">
            <i class="fa-solid fa-house-chimney text-base"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </Link>

          {/* Tab 2: Activity */}
          <Link to="/guide" class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer">
            <i class="fa-solid fa-calendar-check text-base"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider">Activity</span>
          </Link>

          {/* Tab 3: Get 500 (glowing center button) */}
          <button onClick={() => setActiveModal('gifts')} class="relative -top-4 w-12 h-12 rounded-full bg-gradient-to-tr from-red-500 via-rose-400 to-rose-600 text-white flex flex-col items-center justify-center shadow-lg shadow-red-500/20 active:scale-95 transition border-2 border-[#131418] cursor-pointer">
            <i class="fa-solid fa-dharmachakra text-lg animate-spin" style={{ animationDuration: '6s' }}></i>
            <span class="text-[7px] font-black uppercase mt-0.5">GO</span>
          </button>

          {/* Tab 4: Promotion */}
          <button onClick={() => setActiveModal('support')} class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer">
            <i class="fa-solid fa-bullhorn text-base"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider">Promo</span>
          </button>

          {/* Tab 5: Account (Highlighted) */}
          <Link to="/profile" class="flex flex-col items-center gap-0.5 text-red-500 py-1 cursor-pointer">
            <i class="fa-solid fa-user-astronaut text-base"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider">Account</span>
          </Link>
        </footer>
      )}

      {/* MODALS */}
      {/* LOGOUT CONFIRMATION MODAL */}
      {logoutConfirmOpen && (
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in p-6 text-center space-y-4">
            <i class="fa-solid fa-triangle-exclamation text-5xl text-red-500 block animate-pulse"></i>
            <div class="space-y-1">
              <h4 class="text-sm font-bold text-white uppercase">Exit Cockpit?</h4>
              <p class="text-xs text-gray-400">Are you sure you want to sign out of your pilot account?</p>
            </div>
            <div class="flex gap-3">
              <button onClick={() => setLogoutConfirmOpen(false)} class="flex-1 bg-[#131418] hover:bg-[#22242b] border border-[#2d303b] text-gray-300 font-bold py-3 rounded-xl transition text-xs uppercase cursor-pointer">
                Cancel
              </button>
              <button onClick={logout} class="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 cursor-pointer">
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. GAME HISTORY MODAL */}
      {activeModal === 'gameHistory' && (
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in flex flex-col max-h-[80vh]">
            <div class="px-5 py-4 bg-[#131418] border-b border-[#2d303b] flex justify-between items-center shrink-0">
              <h3 class="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-2">
                <i class="fa-solid fa-plane-departure animate-pulse"></i> Flight Game History
              </h3>
              <button onClick={() => setActiveModal(null)} class="text-gray-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-sm"></i></button>
            </div>
            <div class="p-4 overflow-y-auto no-scrollbar space-y-2.5 flex-grow">
              {personalBets.length === 0 ? (
                <div class="text-center text-gray-505 text-xs py-10">No flight wagers found.</div>
              ) : (
                personalBets.map((item, idx) => {
                  const didWin = item.status === 'won';
                  return (
                    <div key={idx} class="bg-[#131418] border border-[#2d303b] rounded-2xl p-3.5 text-xs flex flex-col gap-2">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-400 font-bold">{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        <span class={`border px-1.5 py-0.5 rounded-lg font-bold text-[10px] ${didWin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-450 border-rose-500/10'}`}>
                          {didWin ? 'WON' : 'CRASHED'}
                        </span>
                      </div>
                      <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-555 font-mono-val">Wager: ₹{item.betAmount}</span>
                        {didWin && <span class="text-red-500 font-bold font-mono-val">Multiplier: {item.cashoutMultiplier.toFixed(2)}x</span>}
                        <span class={`font-mono-val font-black ${didWin ? 'text-emerald-400 text-sm' : 'text-rose-400'}`}>
                          {didWin ? '+' : ''}₹{item.payoutAmount.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. TRANSACTION HISTORY MODAL */}
      {activeModal === 'txHistory' && (
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in flex flex-col max-h-[80vh]">
            <div class="px-5 py-4 bg-[#131418] border-b border-[#2d303b] flex justify-between items-center shrink-0">
              <h3 class="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-2">
                <i class="fa-solid fa-receipt text-red-500"></i> Transaction Records
              </h3>
              <button onClick={() => setActiveModal(null)} class="text-gray-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-sm"></i></button>
            </div>
            <div class="p-4 overflow-y-auto no-scrollbar space-y-2.5 flex-grow">
              {transactionHistory.length === 0 ? (
                <div class="text-center text-gray-505 text-xs py-10">No recent deposits or withdrawals.</div>
              ) : (
                transactionHistory.map((t, idx) => {
                  const isDeposit = t.type === 'deposit';
                  let statusColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                  if (t.status === 'completed' || t.status === 'approved') statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  if (t.status === 'rejected') statusColor = 'bg-rose-500/10 text-rose-455 border-rose-500/20';

                  return (
                    <div key={idx} class="bg-[#131418] border border-[#2d303b] rounded-2xl p-3.5 text-xs flex justify-between items-center">
                      <div class="flex flex-col gap-0.5">
                        <span class="text-gray-250 font-bold uppercase">{t.type} via {t.paymentGateway}</span>
                        <span class="text-gray-550 text-[10px]">{new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class={`font-mono-val font-black text-xs ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isDeposit ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                        </span>
                        <span class={`border px-1.5 py-0.5 rounded-lg font-bold text-[8px] uppercase tracking-wide ${statusColor}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 10. GIFTS MODAL */}
      {activeModal === 'gifts' && (
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in">
            <div class="px-5 py-4 bg-[#131418] border-b border-[#2d303b] flex justify-between items-center">
              <h3 class="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-2">
                <i class="fa-solid fa-gift"></i> Redeem Gift Codes
              </h3>
              <button onClick={() => setActiveModal(null)} class="text-gray-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-sm"></i></button>
            </div>
            <div class="p-6 space-y-4 text-center">
              <i class="fa-solid fa-sack-dollar text-5xl text-red-500 block animate-bounce"></i>
              <div class="space-y-1">
                <h4 class="text-sm font-bold text-white uppercase">Redeem Promotional Code</h4>
                <p class="text-xs text-gray-400">Enter a valid pilot gift code to receive free Rupee balance credits!</p>
              </div>
              <input type="text" placeholder="Enter Gift Code" class="w-full bg-[#131418] border border-[#2d303b] focus:border-red-500/50 rounded-xl px-4 py-2.5 text-center text-white focus:outline-none text-xs font-mono-val uppercase tracking-widest"/>
              <button onClick={() => { setActiveModal(null); setSuccessMsg('Invalid or expired gift code!'); setTimeout(() => setSuccessMsg(''), 1000); }} class="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-red-500/10">
                Redeem Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. BANK DETAILS MODAL */}
      {activeModal === 'bankDetails' && (
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-gradient-to-b from-[#1b1c25] to-[#0f1015] border border-[#2d303b]/80 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in">
            {/* Header */}
            <div class="px-5 py-4 bg-[#131418] border-b border-[#2d303b]/60 flex justify-between items-center">
              <h3 class="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-2">
                <i class="fa-solid fa-building-columns text-sm"></i> Virtual Bank Details
              </h3>
              <button onClick={() => setActiveModal(null)} class="text-gray-400 hover:text-white cursor-pointer transition">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            
            {/* Body */}
            <div class="p-6 space-y-6">
              {/* Simulated Passbook Card */}
              <div class="bg-gradient-to-tr from-[#58051a] via-[#881337] to-[#fb7185] border border-red-500/20 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden flex flex-col gap-4">
                {/* Chip and logo */}
                <div class="flex justify-between items-center">
                  <i class="fa-solid fa-microchip text-2xl opacity-90"></i>
                  <span class="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">DEMO ONLY</span>
                </div>
                
                {/* Card Number */}
                <div class="space-y-1">
                  <span class="text-[9px] uppercase font-bold opacity-75 tracking-wider block">Account Number</span>
                  <span class="text-lg font-mono-val font-black tracking-widest block">1234 5678 2828</span>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <span class="text-[8px] uppercase font-bold opacity-75 tracking-wider block">IFSC Code</span>
                    <span class="text-xs font-mono-val font-bold">VDBK0002828</span>
                  </div>
                  <div class="text-right">
                    <span class="text-[8px] uppercase font-bold opacity-75 tracking-wider block">Account Holder</span>
                    <span class="text-xs font-bold truncate max-w-full block">{user?.username || 'Suraj Manani'}</span>
                  </div>
                </div>
              </div>

              {/* Balance & Status details */}
              <div class="space-y-3.5">
                <div class="bg-[#131418]/80 border border-[#2d303b]/60 rounded-2xl p-4 space-y-3">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-400">Account Status</span>
                    <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">ACTIVE</span>
                  </div>
                  <div class="border-t border-[#2d303b]/40 my-2"></div>
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-405">Available Balance</span>
                    <span class="text-base font-black font-mono-val text-red-400">
                      ₹{(user?.bankBalance ?? 100000.00).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Quick actions buttons */}
                <div class="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => { setActiveModal(null); navigate('/deposit'); }}
                    class="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-[11px] font-black py-2.5 rounded-xl transition uppercase tracking-wider cursor-pointer text-center"
                  >
                    Transfer to Wallet
                  </button>
                  <button 
                    onClick={() => { setActiveModal(null); navigate('/withdraw'); }}
                    class="bg-[#1a1c22] hover:bg-[#22242b] border border-[#2d303b] text-gray-350 text-[11px] font-black py-2.5 rounded-xl transition uppercase tracking-wider cursor-pointer text-center"
                  >
                    Withdraw to Bank
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}






    </div>
  );
}
