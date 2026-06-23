import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Vip() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [totalWagered, setTotalWagered] = useState(1622); // Default mock matching mockup
  const [activeTab, setActiveTab] = useState('history'); // history, rules
  const [selectedLevel, setSelectedLevel] = useState(1); // 1, 2, 3, 4, 5

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/wallet/bets');
        if (res.data.success) {
          const bets = res.data.bets || [];
          let wagered = 0;
          bets.forEach(b => {
            wagered += b.betAmount;
          });
          // If the user has wagered money, use it as EXP, otherwise fallback to mock 1622
          if (wagered > 0) {
            setTotalWagered(wagered);
          }
        }
      } catch (e) {
        console.warn('Failed to load user stats, using mock EXP:', e.message);
      }
    };
    fetchUserStats();
  }, []);

  // VIP levels configuration
  const vipLevels = [
    {
      level: 1,
      requiredExp: 3000,
      rewardUp: 60,
      rewardMonth: 5,
      rebate: '0.05%',
      badgeColor: 'from-[#475569] to-[#64748b]'
    },
    {
      level: 2,
      requiredExp: 10000,
      rewardUp: 200,
      rewardMonth: 15,
      rebate: '0.10%',
      badgeColor: 'from-amber-600 to-yellow-500'
    },
    {
      level: 3,
      requiredExp: 30000,
      rewardUp: 500,
      rewardMonth: 40,
      rebate: '0.15%',
      badgeColor: 'from-emerald-600 to-teal-500'
    },
    {
      level: 4,
      requiredExp: 100000,
      rewardUp: 1500,
      rewardMonth: 100,
      rebate: '0.20%',
      badgeColor: 'from-blue-600 to-cyan-500'
    },
    {
      level: 5,
      requiredExp: 300000,
      rewardUp: 5000,
      rewardMonth: 300,
      rebate: '0.30%',
      badgeColor: 'from-purple-600 to-indigo-500'
    }
  ];

  const currentLevelInfo = vipLevels.find(l => l.level === selectedLevel) || vipLevels[0];
  const isLeveledUp = totalWagered >= currentLevelInfo.requiredExp;
  const expNeeded = Math.max(0, currentLevelInfo.requiredExp - totalWagered);
  const progressPercent = Math.min(100, (totalWagered / currentLevelInfo.requiredExp) * 100);

  return (
    <div class="w-full min-h-screen bg-[#131418] text-white flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#2d303b]/50 pb-6 select-none overflow-x-hidden">
      
      {/* 1. HEADER */}
      <header class="bg-[#1a1c22] px-4 py-4 flex items-center justify-between border-b border-[#2d303b] sticky top-0 z-30">
        <button onClick={() => navigate('/profile')} class="text-gray-400 hover:text-white transition cursor-pointer">
          <i class="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <span class="text-base font-bold text-white tracking-wider">VIP</span>
        <div class="w-6"></div>
      </header>

      {/* MAIN CONTENT */}
      <main class="flex-grow overflow-y-auto no-scrollbar px-4 py-4 space-y-5">
        
        {/* 2. USER PROFILE INFO */}
        <section class="flex items-center gap-4.5 px-1 py-1">
          <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 border-2 border-white/10 flex items-center justify-center text-white shadow-xl overflow-hidden shrink-0">
            <i class={`fa-solid ${user?.avatar || 'fa-user-astronaut'} text-2xl`}></i>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="bg-[#2d303b] border border-white/10 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider w-max flex items-center gap-1">
              <i class="fa-solid fa-crown text-[8px] text-red-500 animate-pulse"></i> VIP0
            </span>
            <span class="text-sm font-black tracking-tight text-white mt-1">{user?.username || 'Mr_India'}</span>
          </div>
        </section>

        {/* 3. EXPERIENCE CARDS GRID */}
        <section class="grid grid-cols-2 gap-3.5">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 text-center shadow-lg relative overflow-hidden flex flex-col gap-1">
            <span class="text-lg font-black font-mono-val text-red-500">{totalWagered.toLocaleString()} EXP</span>
            <span class="text-[10px] text-gray-500 uppercase tracking-wider font-bold">My experience</span>
          </div>
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 text-center shadow-lg relative overflow-hidden flex flex-col gap-1">
            <span class="text-lg font-black font-mono-val text-red-500">8 Days</span>
            <span class="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Payout time</span>
          </div>
        </section>

        {/* 4. SETTLEMENT NOTICE */}
        <div class="bg-[#1a1c22]/40 border border-[#2d303b]/60 rounded-xl p-3 text-center text-[10px] text-gray-400 font-semibold tracking-wide">
          VIP level rewards are settled at 2:00 am on the 1st of every month
        </div>

        {/* 5. HORIZONTAL VIP CARDS SCROLLER */}
        <section class="space-y-2">
          <div class="flex items-center justify-between px-1">
            <span class="text-[10px] text-gray-500 font-black uppercase tracking-wider">Select VIP level</span>
            <span class="text-[10px] text-red-400 font-bold">Slide/Tap to view</span>
          </div>

          <div class="flex gap-3 overflow-x-auto no-scrollbar py-1 px-0.5 snap-x snap-mandatory">
            {vipLevels.map((lvl) => {
              const isSelected = selectedLevel === lvl.level;
              const hasUnlocked = totalWagered >= lvl.requiredExp;
              return (
                <button
                  key={lvl.level}
                  onClick={() => setSelectedLevel(lvl.level)}
                  class={`snap-center shrink-0 w-72 rounded-2xl p-5 border text-left flex flex-col justify-between transition-all relative overflow-hidden h-40 ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#2a1318] via-[#1a1c22] to-[#131418] border-red-500/80 shadow-xl shadow-red-550/5'
                      : 'bg-[#1a1c22]/70 border-[#2d303b]/60 opacity-60'
                  }`}
                >
                  {/* Decorative background shapes */}
                  <div class="absolute -top-12 -right-12 w-28 h-28 bg-red-650/5 rounded-full blur-[25px] pointer-events-none"></div>

                  <div class="w-full flex justify-between items-start">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="text-xl font-black italic tracking-wide text-white uppercase">VIP{lvl.level}</span>
                        {!hasUnlocked && (
                          <span class="bg-rose-500/10 text-rose-455 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 uppercase border border-rose-500/10">
                            <i class="fa-solid fa-lock text-[6px]"></i> Not open yet
                          </span>
                        )}
                      </div>
                      <p class="text-[10px] text-gray-400 leading-tight mt-0.5">
                        {hasUnlocked 
                          ? 'Congratulations! Level Unlocked' 
                          : `Upgrading VIP${lvl.level} requires ${expNeeded.toLocaleString()} EXP`}
                      </p>
                    </div>
                    <div class={`w-10 h-10 rounded-full bg-gradient-to-tr ${lvl.badgeColor} border border-white/10 flex items-center justify-center text-white shadow-lg shrink-0`}>
                      <i class="fa-solid fa-crown text-base"></i>
                    </div>
                  </div>

                  <div class="w-full space-y-2 mt-4">
                    <div class="flex justify-between items-center text-[9px] font-bold text-gray-400">
                      <span class="bg-[#131418] px-2 py-0.5 rounded-full text-red-400 border border-red-500/10">Bet ₹1 = 1 EXP</span>
                      <span class="uppercase tracking-wider">VIP{lvl.level}</span>
                    </div>

                    {/* Progress Bar */}
                    <div class="space-y-1">
                      <div class="h-2 w-full bg-[#131418] rounded-full overflow-hidden border border-[#2d303b]">
                        <div 
                          class="h-full bg-gradient-to-r from-red-600 to-rose-600 transition-all"
                          style={{ width: `${lvl.level === selectedLevel ? progressPercent : (totalWagered >= lvl.requiredExp ? 100 : 0)}%` }}
                        ></div>
                      </div>
                      <div class="flex justify-between text-[8px] text-gray-500 font-bold">
                        <span>{totalWagered.toLocaleString()}/{lvl.requiredExp.toLocaleString()}</span>
                        <span>{lvl.requiredExp.toLocaleString()} EXP can be leveled up</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 6. VIP BENEFITS LEVEL LIST */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-5 shadow-lg space-y-4">
          <div class="flex items-center gap-2 border-b border-[#2d303b]/40 pb-3">
            <i class="fa-solid fa-gem text-red-500 text-sm"></i>
            <h3 class="text-xs font-black uppercase tracking-wider text-white">VIP{selectedLevel} Benefits level</h3>
          </div>

          <div class="space-y-4 text-xs">
            {/* Benefit 1 */}
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 text-base shrink-0 shadow-inner">
                  <i class="fa-solid fa-gift"></i>
                </div>
                <div class="space-y-0.5 min-w-0">
                  <span class="font-bold text-gray-300 block truncate">Level up rewards</span>
                  <span class="text-[9px] text-gray-500 leading-tight block">Each account can only receive 1 time</span>
                </div>
              </div>
              <div class="flex flex-col gap-1 shrink-0 text-right">
                <span class="bg-[#131418] border border-[#2d303b] text-red-500 font-bold px-2.5 py-1 rounded-lg text-[9px] flex items-center gap-1">
                  <i class="fa-solid fa-coins text-[8px]"></i> {currentLevelInfo.rewardUp}
                </span>
                <span class="bg-[#131418] border border-[#2d303b] text-gray-500 font-bold px-2.5 py-1 rounded-lg text-[9px] flex items-center gap-1">
                  <i class="fa-solid fa-shield text-[8px]"></i> 0
                </span>
              </div>
            </div>

            {/* Benefit 2 */}
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 text-base shrink-0 shadow-inner">
                  <i class="fa-solid fa-medal"></i>
                </div>
                <div class="space-y-0.5 min-w-0">
                  <span class="font-bold text-gray-300 block truncate">Monthly reward</span>
                  <span class="text-[9px] text-gray-500 leading-tight block">Each account can only receive 1 time per month</span>
                </div>
              </div>
              <div class="flex flex-col gap-1 shrink-0 text-right">
                <span class="bg-[#131418] border border-[#2d303b] text-red-500 font-bold px-2.5 py-1 rounded-lg text-[9px] flex items-center gap-1">
                  <i class="fa-solid fa-coins text-[8px]"></i> {currentLevelInfo.rewardMonth}
                </span>
                <span class="bg-[#131418] border border-[#2d303b] text-gray-500 font-bold px-2.5 py-1 rounded-lg text-[9px] flex items-center gap-1">
                  <i class="fa-solid fa-shield text-[8px]"></i> 0
                </span>
              </div>
            </div>

            {/* Benefit 3 */}
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 text-base shrink-0 shadow-inner">
                  <i class="fa-solid fa-coins"></i>
                </div>
                <div class="space-y-0.5 min-w-0">
                  <span class="font-bold text-gray-300 block truncate">Rebate rate</span>
                  <span class="text-[9px] text-gray-500 leading-tight block">Increase income of rebate</span>
                </div>
              </div>
              <span class="bg-[#131418] border border-[#2d303b] text-red-500 font-bold px-3 py-1.5 rounded-lg text-[9px] flex items-center gap-1 shrink-0 font-mono-val">
                <i class="fa-solid fa-sack-dollar text-[8px]"></i> {currentLevelInfo.rebate}
              </span>
            </div>

          </div>
        </section>

        {/* 7. HISTORY / RULES TABS */}
        <section class="space-y-4">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-xl overflow-hidden flex text-xs">
            <button
              onClick={() => setActiveTab('history')}
              class={`flex-1 py-3 font-black uppercase text-center tracking-wider transition ${
                activeTab === 'history' ? 'bg-[#131418] text-red-500 border-b-2 border-red-550' : 'text-gray-400 hover:text-white'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              class={`flex-1 py-3 font-black uppercase text-center tracking-wider transition ${
                activeTab === 'rules' ? 'bg-[#131418] text-red-500 border-b-2 border-red-555' : 'text-gray-400 hover:text-white'
              }`}
            >
              Rules
            </button>
          </div>

          {activeTab === 'history' ? (
            <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-6 text-center space-y-4 min-h-[160px] flex flex-col justify-center items-center shadow-lg">
              {/* Scroll SVG empty state */}
              <svg class="w-14 h-14 text-gray-700 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span class="text-xs text-gray-500 font-bold uppercase tracking-wider">No reward claim records</span>
            </div>
          ) : (
            <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-5 text-xs text-gray-300 space-y-3 leading-relaxed shadow-lg">
              <p><strong class="text-red-500">Rule 1:</strong> Experience Points (EXP) accumulate based on the total betting wagers. Bet ₹1 = 1 EXP point.</p>
              <p><strong class="text-red-500">Rule 2:</strong> Upgrades trigger instantly upon reaching the required EXP threshold.</p>
              <p><strong class="text-red-500">Rule 3:</strong> Level up reward packages are credited instantly on activation. Limit 1 claim per account per VIP level tier.</p>
              <p><strong class="text-red-500">Rule 4:</strong> Monthly salaries are available for claiming starting on the 1st of every month.</p>
            </div>
          )}
        </section>

        {/* 8. ACTION BOTTOM VIEW ALL BUTTON */}
        <button
          onClick={() => {
            alert('VIP features are fully simulated. No real cash rewards.');
          }}
          class="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3.5 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 cursor-pointer text-center block hover:opacity-90 active:scale-98"
        >
          View All Benefits
        </button>

      </main>

      {/* FOOTER */}
      <footer class="text-center py-4 text-[10px] text-gray-600 font-semibold border-t border-[#2d303b]/40">
        &copy; 2026 BDG Pilot Engine. Simulated Sandbox.
      </footer>
    </div>
  );
}
