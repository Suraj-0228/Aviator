import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Lobby() {
  const { user, syncBalance } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [activeModal, setActiveModal] = useState(null); // 'activity', 'promo', 'wheel'
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);

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

  return (
    <div class="h-screen bg-[#131418] text-white flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#2d303b]/50 select-none overflow-hidden">
      
      {/* 1. TOP HEADER BRANDING */}
      <header class="bg-[#1a1c22] px-4 py-3 flex items-center justify-between border-b border-[#2d303b] shrink-0">
        <div class="flex flex-col">
          <span class="text-lg font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-[#ef4444] to-[#f43f5e] uppercase">
            Aviator Game
          </span>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="text-[14px]">🇮🇳</span>
            <span class="text-xs text-red-500 font-bold uppercase tracking-wider">Welcome to Aviator Game</span>
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
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in">
            <div class="px-5 py-4 bg-[#131418] border-b border-[#2d303b] flex justify-between items-center">
              <h3 class="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-2">
                <i class="fa-solid fa-calendar-check"></i> Daily check-in rewards
              </h3>
              <button onClick={() => setActiveModal(null)} class="text-gray-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-sm"></i></button>
            </div>
            <div class="p-6 space-y-4 text-center">
              <i class="fa-solid fa-gift text-5xl text-red-500 block animate-bounce"></i>
              <div class="space-y-1">
                <h4 class="text-sm font-bold text-white uppercase">Claim Daily Pilot Credits</h4>
                <p class="text-xs text-gray-400">Recharge everyday to claim direct bonuses. Current level: VIP0.</p>
              </div>
              <div class="grid grid-cols-4 gap-2 text-xs">
                {['Day 1', 'Day 2', 'Day 3', 'Day 4'].map((d, i) => (
                  <div key={i} class="bg-[#131418] border border-[#2d303b] p-2.5 rounded-xl space-y-1">
                    <span class="text-gray-500 block">{d}</span>
                    <span class="text-red-500 font-bold font-mono-val">+₹{10 * (i + 1)}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setActiveModal(null); navigate('/deposit'); }} class="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-red-500/10">
                Deposit to activate rewards
              </button>
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
