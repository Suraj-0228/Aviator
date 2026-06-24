import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import logo from '../assets/logo.png';
import { soundEngine } from '../utils/soundEngine.js';

export default function Lobby() {
  const { user, syncBalances } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [activeModal, setActiveModal] = useState(null); // 'activity', 'promo', 'wheel'
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      handleRefreshBalance();
    }
    
    // Check if user just logged in
    if (location.state?.justLoggedIn) {
      setWelcomeOpen(true);
      // Clean up location state so popup doesn't re-trigger on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleRefreshBalance = async () => {
    setBalanceRefreshing(true);
    try {
      const res = await axios.get('/auth/profile');
      if (res.data.success) {
        syncBalances(res.data.user.balance, res.data.user.bankBalance);
      }
    } catch (e) {
      console.warn('Failed to refresh balance:', e.message);
    } finally {
      setTimeout(() => setBalanceRefreshing(false), 500);
    }
  };

  const isCheckedInToday = () => {
    if (!user?.lastCheckIn) return false;
    const lastDate = new Date(user.lastCheckIn);
    const today = new Date();
    return lastDate.getDate() === today.getDate() &&
           lastDate.getMonth() === today.getMonth() &&
           lastDate.getFullYear() === today.getFullYear();
  };

  const getDayState = (dayNum) => {
    if (!user) return 'locked';
    
    const checkInToday = isCheckedInToday();
    
    if (checkInToday) {
      if (dayNum <= user.checkInStreak) {
        return 'claimed';
      } else {
        return 'locked';
      }
    } else {
      let claimableDayIdx = 1;
      if (user.lastCheckIn) {
        const lastDate = new Date(user.lastCheckIn);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isYesterday = lastDate.getDate() === yesterday.getDate() &&
                            lastDate.getMonth() === yesterday.getMonth() &&
                            lastDate.getFullYear() === yesterday.getFullYear();
        if (isYesterday) {
          claimableDayIdx = (user.checkInStreak % 7) + 1;
        }
      }
      
      if (dayNum < claimableDayIdx) {
        return 'claimed';
      } else if (dayNum === claimableDayIdx) {
        return 'active';
      } else {
        return 'locked';
      }
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await axios.post('/wallet/check-in');
      if (res.data.success) {
        syncBalances(res.data.newBalance, res.data.newBankBalance);
        
        try {
          soundEngine.init();
          soundEngine.isMuted = false;
          soundEngine.playCashoutChime();
        } catch (soundErr) {
          console.warn('Audio play failed:', soundErr);
        }

        setSuccessMsg(res.data.message || `Reward of ₹${res.data.reward} claimed!`);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Check-in failed');
    }
  };

  return (
    <div class="h-screen bg-[#131418] text-white flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#2d303b]/50 select-none overflow-hidden">
      
      {/* Toast notifications */}
      {successMsg && (
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white font-bold text-xs uppercase px-5 py-3 rounded-full shadow-lg text-center whitespace-nowrap animate-bounce">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white font-bold text-xs uppercase px-5 py-3 rounded-full shadow-lg text-center whitespace-nowrap animate-bounce">
          {errorMsg}
        </div>
      )}

      {/* 1. TOP HEADER BRANDING */}
      <header class="bg-[#1a1c22] px-4 py-3 flex items-center justify-between border-b border-[#2d303b] shrink-0">
        <div class="flex items-center gap-2.5">
          <img src={logo} alt="Aviator Logo" class="h-9 w-auto rounded-lg object-contain shadow shadow-red-500/10 border border-white/5" />
          <div class="flex flex-col">
            <span class="text-base font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-[#ef4444] to-[#f43f5e] uppercase leading-none">
              Aviator Game
            </span>
            <div class="flex items-center gap-1 mt-0.5">
              <span class="text-[11px]">🇮🇳</span>
              <span class="text-[9px] text-red-500 font-bold uppercase tracking-wider">Welcome to Aviator Game</span>
            </div>
          </div>
        </div>
        {user?.role === 'admin' && (
          <Link to="/admin" class="bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 text-white text-[10px] font-black px-3 py-1.5 rounded-full border border-white/10 shadow uppercase tracking-wider transition active:scale-95 flex items-center gap-1 cursor-pointer">
            <i class="fa-solid fa-user-shield text-[9px]"></i> Admin
          </Link>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main class="flex-grow overflow-y-auto no-scrollbar px-4 py-3 pb-24 space-y-4">
        
        {/* 2. DAILY CHECK-IN HERO BANNER */}
        <section 
          onClick={() => setActiveModal('activity')}
          class="bg-gradient-to-br from-[#1b1c25] to-[#0f1015] border border-white/5 rounded-2xl p-4 shadow-xl relative overflow-hidden cursor-pointer active:scale-[0.98] transition duration-150"
        >
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-[30px]"></div>
          <div class="absolute -bottom-10 -left-10 w-24 h-24 bg-rose-500/10 rounded-full blur-[30px]"></div>
          
          <div class="flex justify-between items-center relative z-10">
            <div class="space-y-1.5 max-w-[70%]">
              <span class="text-[10px] text-red-500 font-extrabold uppercase tracking-widest block">Limited Offer</span>
              <h2 class="text-base font-black tracking-tight text-white leading-tight uppercase">
                DAILY CHECK-IN BONUS
              </h2>
              <p class="text-xs text-gray-405 leading-normal">Recharge everyday & claim customized pilot bonuses!</p>
            </div>
            
            <div class="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 shadow-inner">
              <i class="fa-solid fa-gift text-3xl animate-bounce"></i>
            </div>
          </div>
        </section>

        {/* 3. USER QUICK BAR */}
        <section class="bg-gradient-to-r from-red-500/10 to-rose-500/5 border border-red-500/20 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-inner">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <i class="fa-solid fa-user-astronaut text-xs"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-extrabold text-white">{user?.username}</span>
              <div class="flex items-center gap-1 mt-0.5">
                <span class="text-lg font-bold text-emerald-400">₹{user?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <button onClick={handleRefreshBalance} class="text-gray-500 hover:text-white transition cursor-pointer p-0.5">
                  <i class={`fa-solid fa-rotate text-sm ${balanceRefreshing ? 'animate-spin text-red-500' : ''}`}></i>
                </button>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/profile')} class="text-gray-400 hover:text-white cursor-pointer p-1">
            <i class="fa-solid fa-envelope text-xs"></i>
          </button>
        </section>

        {/* 5. FEATURED GAME CARDS */}
        <section class="space-y-3">
          <span class="text-xs font-black text-gray-500 uppercase tracking-widest block">Featured Cockpit Games</span>
          
          <div class="grid grid-cols-2 gap-3">
            {/* ACTIVE GAME CARD: AVIATOR */}
            <div 
              onClick={() => navigate('/play')}
              class="col-span-2 bg-gradient-to-br from-[#2c131a] to-[#12080d] border border-rose-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden cursor-pointer active:scale-[0.98] hover:border-rose-500/50 transition group flex flex-col justify-between min-h-[140px]"
            >
              {/* Glow filter background */}
              <div class="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/20 rounded-full blur-[40px] group-hover:bg-rose-500/30 transition duration-300"></div>
              
              <div class="flex justify-between items-start relative z-10">
                <div class="space-y-1">
                  <span class="bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md shadow-rose-500/20">
                    Active Hot
                  </span>
                  <h3 class="text-lg font-black tracking-tight text-white mt-1.5 uppercase italic">
                    <i class="fa-solid fa-paper-plane text-rose-500 mr-1 animate-pulse"></i> Aviator Original
                  </h3>
                  <p class="text-xs text-gray-405">MULTIPLY YOUR INR FUNDS UP TO 10,000x</p>
                </div>
                
                <div class="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500 shadow-inner group-hover:scale-110 transition duration-300">
                  <i class="fa-solid fa-plane-departure text-xl"></i>
                </div>
              </div>

              <div class="flex items-center justify-between pt-4 relative z-10 border-t border-rose-500/10">
                <span class="text-[10px] text-gray-500 uppercase font-black tracking-wider">Provably Fair Verified</span>
                <span class="text-xs text-rose-400 font-bold flex items-center gap-1">
                  Fly & Cashout <i class="fa-solid fa-arrow-right text-[10px] animate-pulse"></i>
                </span>
              </div>
            </div>

            {/* COMING SOON: LOTTERY */}
            <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-xl flex flex-col justify-between opacity-50 relative overflow-hidden min-h-[100px]">
              <div class="space-y-1">
                <h4 class="text-xs font-extrabold text-white uppercase"><i class="fa-solid fa-ticket text-red-500/80 mr-1"></i> Wingo Lottery</h4>
                <p class="text-[10px] text-gray-500 leading-tight">1 Min, 3 Min, 5 Min Wingo Draws</p>
              </div>
              <span class="text-xs text-red-500/70 uppercase font-bold tracking-wider mt-2 block">Coming Soon</span>
            </div>

            {/* COMING SOON: SLOTS */}
            <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-xl flex flex-col justify-between opacity-50 relative overflow-hidden min-h-[100px]">
              <div class="space-y-1">
                <h4 class="text-xs font-extrabold text-white uppercase"><i class="fa-solid fa-gamepad text-fuchsia-500/80 mr-1"></i> Slots Engine</h4>
                <p class="text-[10px] text-gray-500 leading-tight">Spin & win big jackpots</p>
              </div>
              <span class="text-xs text-fuchsia-500/70 uppercase font-bold tracking-wider mt-2 block">Coming Soon</span>
            </div>

            {/* COMING SOON: CASINO */}
            <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-xl flex flex-col justify-between opacity-50 relative overflow-hidden min-h-[100px]">
              <div class="space-y-1">
                <h4 class="text-xs font-extrabold text-white uppercase"><i class="fa-solid fa-dice text-cyan-500/80 mr-1"></i> Live Casino</h4>
                <p class="text-[10px] text-gray-500 leading-tight">Live dealer roulette & baccarat</p>
              </div>
              <span class="text-xs text-cyan-500/70 uppercase font-bold tracking-wider mt-2 block">Coming Soon</span>
            </div>

            {/* COMING SOON: SPORTS */}
            <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-xl flex flex-col justify-between opacity-50 relative overflow-hidden min-h-[100px]">
              <div class="space-y-1">
                <h4 class="text-xs font-extrabold text-white uppercase"><i class="fa-solid fa-volleyball text-emerald-500/80 mr-1"></i> Sportsbook</h4>
                <p class="text-[10px] text-gray-500 leading-tight">Live cricket & football exchanges</p>
              </div>
              <span class="text-xs text-emerald-500/70 uppercase font-bold tracking-wider mt-2 block">Coming Soon</span>
            </div>
          </div>
        </section>

      </main>

      {/* 6. BOTTOM MOBILE FOOTER NAVIGATION */}
      {user?.role === 'admin' ? (
        <footer class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1a1c22]/95 border-t border-[#2d303b] py-1 px-2 flex justify-around items-center z-40 shadow-[0_-5px_25px_rgba(0,0,0,0.6)] backdrop-blur-lg">
          {/* Tab 1: Cockpit */}
          <Link to="/play" class="flex flex-col items-center gap-0.5 text-red-500 py-1 cursor-pointer transition">
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

          {/* Tab 5: Profile */}
          <Link to="/admin" state={{ activeView: 'profile' }} class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer transition">
            <i class="fa-solid fa-user-shield text-base"></i>
            <span class="text-[9px] font-bold uppercase tracking-wider">Profile</span>
          </Link>
        </footer>
      ) : (
        <footer class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1a1c22]/95 border-t border-[#2d303b] py-1 px-2 flex justify-around items-center z-40 shadow-[0_-5px_25px_rgba(0,0,0,0.6)] backdrop-blur-lg">
          {/* Tab 1: Home (Highlighted) */}
          <Link to="/" class="flex flex-col items-center gap-0.5 text-red-500 py-1 cursor-pointer">
            <i class="fa-solid fa-house-chimney text-base"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </Link>

          {/* Tab 2: Activity */}
          <button onClick={() => setActiveModal('activity')} class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer">
            <i class="fa-solid fa-calendar-check text-base"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider">Activity</span>
          </button>

          {/* Tab 3: Get 500 (glowing center button) */}
          <button onClick={() => setActiveModal('wheel')} class="relative -top-4 w-12 h-12 rounded-full bg-gradient-to-tr from-red-500 via-rose-400 to-rose-600 text-white flex flex-col items-center justify-center shadow-lg shadow-red-500/20 active:scale-95 transition border-2 border-[#131418] cursor-pointer">
            <i class="fa-solid fa-dharmachakra text-lg animate-spin" style={{ animationDuration: '6s' }}></i>
            <span class="text-[7px] font-black uppercase mt-0.5">GO</span>
          </button>

          {/* Tab 4: Promotion */}
          <button onClick={() => setActiveModal('promo')} class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer">
            <i class="fa-solid fa-bullhorn text-base"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider">Promo</span>
          </button>

          {/* Tab 5: Account */}
          <Link to="/profile" class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer">
            <i class="fa-solid fa-user-astronaut text-base"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider">Account</span>
          </Link>
        </footer>
      )}

      {/* MODALS */}
      {/* WELCOME POPUP MODAL */}
      {welcomeOpen && (
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in p-6 text-center space-y-4">
            <div class="w-16 h-16 bg-gradient-to-tr from-red-600 to-rose-600 rounded-full flex items-center justify-center mx-auto text-white text-3xl shadow-lg animate-bounce">
              <i class="fa-solid fa-paper-plane animate-pulse"></i>
            </div>
            <div class="space-y-1">
              <h4 class="text-sm font-black text-white uppercase tracking-wider">Welcome, Pilot {user?.username}!</h4>
              <p class="text-xs text-gray-400">Ready to take off? Monitor the flight multiplier curve and secure your cashouts in time!</p>
            </div>
            <button onClick={() => { setWelcomeOpen(false); navigate('/'); }} class="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 cursor-pointer">
              Enter Cockpit & Fly
            </button>
          </div>
        </div>
      )}

      {/* 7. ACTIVITY (DAILY CHECK-IN) MODAL */}
      {activeModal === 'activity' && (
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-gradient-to-b from-[#1b1c25] to-[#0f1015] border border-[#2d303b]/80 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in">
            {/* Header */}
            <div class="px-5 py-4 bg-[#131418] border-b border-[#2d303b]/60 flex justify-between items-center">
              <h3 class="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-2">
                <i class="fa-solid fa-calendar-check text-sm animate-pulse"></i> Daily Pilot Check-In
              </h3>
              <button onClick={() => setActiveModal(null)} class="text-gray-400 hover:text-white cursor-pointer transition">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            
            {/* Body */}
            <div class="p-5 space-y-4">
              <div class="text-center space-y-1">
                <h4 class="text-sm font-bold text-white uppercase tracking-wide">Claim Daily Pilot Credits</h4>
                <p class="text-[11px] text-gray-400 leading-normal">
                  Maintain your daily streak to claim bigger rewards. Click on today's active box to claim.
                </p>
              </div>

              {/* 7-Day Grid */}
              <div class="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                  const state = getDayState(dayNum); // 'claimed', 'active', 'locked'
                  const isDay7 = dayNum === 7;
                  const rewardAmt = dayNum === 7 ? 1000 : dayNum * 100;
                  
                  let cardClass = '';
                  let statusIndicator = null;
                  
                  if (state === 'claimed') {
                    cardClass = 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400';
                    statusIndicator = (
                      <div class="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold shadow-md shadow-emerald-500/20 animate-scale-in">
                        <i class="fa-solid fa-check"></i>
                      </div>
                    );
                  } else if (state === 'active') {
                    cardClass = 'bg-red-500/10 border-red-500 text-white cursor-pointer shadow-lg shadow-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all duration-150 relative border-dashed animate-pulse ring-2 ring-red-500/30';
                    statusIndicator = (
                      <div class="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-red-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded shadow uppercase tracking-wider animate-bounce">
                        Active
                      </div>
                    );
                  } else {
                    cardClass = 'bg-[#131418]/60 border-[#2d303b] text-gray-550 opacity-60';
                    statusIndicator = (
                      <div class="absolute top-1.5 right-1.5 text-gray-600 text-[10px]">
                        <i class="fa-solid fa-lock"></i>
                      </div>
                    );
                  }
                  
                  return (
                    <div 
                      key={dayNum}
                      onClick={() => {
                        if (state === 'active') {
                          handleCheckIn();
                        }
                      }}
                      class={`p-3 border rounded-2xl flex flex-col items-center justify-center gap-1.5 min-h-[85px] relative overflow-hidden transition-all duration-150 ${cardClass} ${isDay7 ? 'col-span-3 bg-gradient-to-r from-red-650/10 via-amber-600/10 to-red-650/10 border-amber-500/40' : ''}`}
                    >
                      {/* Top Label */}
                      <span class="text-[9px] uppercase font-extrabold tracking-wider opacity-80 block">Day {dayNum}</span>
                      
                      {/* Reward Amount */}
                      <span class={`font-mono-val font-black ${isDay7 ? 'text-lg text-amber-300' : 'text-sm text-red-450'}`}>
                        ₹{rewardAmt}
                      </span>
                      
                      {statusIndicator}
                      
                      {/* Background Decorator for Day 7 */}
                      {isDay7 && (
                        <div class="absolute -bottom-4 -right-4 w-12 h-12 bg-amber-500/5 rounded-full blur-md pointer-events-none"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status info */}
              <div class="bg-[#131418]/80 border border-[#2d303b]/60 rounded-2xl p-3 flex items-center justify-between text-xs text-left">
                <div class="space-y-0.5">
                  <span class="text-gray-400 block font-medium">Streak Status</span>
                  <span class="text-white font-bold block">
                    {user?.checkInStreak ? `${user.checkInStreak} Days Active` : 'No Active Streak'}
                  </span>
                </div>
                <div class="text-right">
                  <span class="text-gray-400 block font-medium">Virtual Bank Balance</span>
                  <span class="text-amber-300 font-mono-val font-black block">
                    ₹{(user?.bankBalance ?? 100000.00).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. PROMOTION MODAL */}
      {activeModal === 'promo' && (
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in">
            <div class="px-5 py-4 bg-[#131418] border-b border-[#2d303b] flex justify-between items-center">
              <h3 class="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-2">
                <i class="fa-solid fa-bullhorn"></i> Partner & Referrals
              </h3>
              <button onClick={() => setActiveModal(null)} class="text-gray-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-sm"></i></button>
            </div>
            <div class="p-6 space-y-4 text-center">
              <i class="fa-solid fa-users-viewfinder text-5xl text-red-500 block"></i>
              <div class="space-y-1">
                <h4 class="text-sm font-bold text-white uppercase">Invite Friends & Earn Commission</h4>
                <p class="text-xs text-gray-400">Share your referral link and claim commission on all flight takeoff bets!</p>
              </div>
              <div class="bg-[#131418] p-3 rounded-xl border border-[#2d303b] text-xs font-mono-val text-gray-300 break-all select-all">
                http://localhost:5173/register?ref={user?.username}
              </div>
              <button onClick={() => { setActiveModal(null); }} class="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-red-500/10">
                Copy invite link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. SPIN WHEEL (GET 500) MODAL */}
      {activeModal === 'wheel' && (
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in">
            <div class="px-5 py-4 bg-[#131418] border-b border-[#2d303b] flex justify-between items-center">
              <h3 class="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-2">
                <i class="fa-solid fa-dharmachakra animate-spin" style={{ animationDuration: '6s' }}></i> Claim ₹500 Bonus
              </h3>
              <button onClick={() => setActiveModal(null)} class="text-gray-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-sm"></i></button>
            </div>
            <div class="p-6 space-y-4 text-center">
              <i class="fa-solid fa-coins text-5xl text-red-500 block animate-pulse"></i>
              <div class="space-y-1">
                <h4 class="text-sm font-bold text-white uppercase">First Deposit Wheel Bonus</h4>
                <p class="text-xs text-gray-400">Recharge a minimum of ₹500 today and receive a guaranteed ₹500 extra balance instant credit!</p>
              </div>
              <button onClick={() => { setActiveModal(null); navigate('/deposit'); }} class="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-red-500/10">
                Get ₹500 Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
