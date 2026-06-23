import { useNavigate } from 'react-router-dom';

export default function Guide() {
  const navigate = useNavigate();

  return (
    <div class="min-h-screen bg-[#131418] text-white flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#2d303b]/50 pb-10 select-none">
      
      {/* HEADER */}
      <header class="bg-[#1a1c22] px-4 py-4 flex items-center justify-between border-b border-[#2d303b] sticky top-0 z-30">
        <button onClick={() => navigate('/profile')} class="text-gray-400 hover:text-white transition cursor-pointer">
          <i class="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <span class="text-base font-bold text-white tracking-wider">Beginner's Guide</span>
        <div class="w-6"></div>
      </header>

      {/* CONTENT */}
      <main class="flex-grow overflow-y-auto no-scrollbar px-4 py-6 space-y-6">
        
        {/* Intro */}
        <div class="text-center space-y-3">
          <div class="w-16 h-16 bg-gradient-to-tr from-red-600 to-rose-600 rounded-full flex items-center justify-center mx-auto text-white text-2xl shadow-lg shadow-red-500/20">
            <i class="fa-solid fa-book-open animate-pulse"></i>
          </div>
          <h2 class="text-lg font-black uppercase tracking-wider text-red-500">How to Play Aviator</h2>
          <p class="text-xs text-gray-400">Master the flight simulator and secure your multipliers.</p>
        </div>

        {/* Steps Grid */}
        <div class="space-y-4">
          
          {/* Step 1 */}
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg flex gap-4">
            <div class="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/25 flex items-center justify-center text-red-500 text-lg shrink-0">
              1
            </div>
            <div class="space-y-1">
              <h4 class="text-xs font-black uppercase text-white tracking-wide">Deposit & Fund Wallet</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                Credit your virtual balance in the Deposit page using simulated UPI or Bank transfer channels. The minimum deposit is ₹100.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg flex gap-4">
            <div class="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/25 flex items-center justify-center text-red-500 text-lg shrink-0">
              2
            </div>
            <div class="space-y-1">
              <h4 class="text-xs font-black uppercase text-white tracking-wide">Enter Bet Amount</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                Before takeoff, type your bet size (min ₹10, max ₹8,000) and click <strong>BET</strong>. You can place one or two bets concurrently using the dual consoles.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg flex gap-4">
            <div class="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/25 flex items-center justify-center text-red-500 text-lg shrink-0">
              3
            </div>
            <div class="space-y-1">
              <h4 class="text-xs font-black uppercase text-white tracking-wide">Monitor & Cashout</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                As the plane rises, the multiplier ticks upwards. Click <strong>CASHOUT</strong> at any moment to lock in your payout (Bet x Multiplier).
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg flex gap-4">
            <div class="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/25 flex items-center justify-center text-red-500 text-lg shrink-0">
              4
            </div>
            <div class="space-y-1">
              <h4 class="text-xs font-black uppercase text-white tracking-wide">Avoid the Crash</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                The plane will fly away (crash) at a random moment. If you fail to cash out before takeoff crashes, your wagers for that round are lost.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg flex gap-4">
            <div class="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/25 flex items-center justify-center text-red-500 text-lg shrink-0">
              5
            </div>
            <div class="space-y-1">
              <h4 class="text-xs font-black uppercase text-white tracking-wide">Auto Play Settings</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                Toggle "Auto Bet" to submit wagers automatically every round, or "Auto Cashout" to cash out instantly when a target multiplier is hit.
              </p>
            </div>
          </div>

        </div>

        <button 
          onClick={() => navigate('/profile')} 
          class="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3.5 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 cursor-pointer text-center block hover:opacity-90 active:scale-98"
        >
          Go Back to Profile
        </button>
      </main>

      {/* FOOTER */}
      <footer class="text-center py-4 text-[10px] text-gray-600 font-semibold border-t border-[#2d303b]/40">
        &copy; 2026 BDG Pilot Engine. Simulated Sandbox.
      </footer>
    </div>
  );
}
