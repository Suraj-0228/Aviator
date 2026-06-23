import { useNavigate } from 'react-router-dom';

export default function Notice() {
  const navigate = useNavigate();

  return (
    <div class="min-h-screen bg-[#131418] text-white flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#2d303b]/50 pb-10 select-none">
      {/* HEADER */}
      <header class="bg-[#1a1c22] px-4 py-4 flex items-center justify-between border-b border-[#2d303b] sticky top-0 z-30">
        <button onClick={() => navigate('/profile')} class="text-gray-400 hover:text-white transition cursor-pointer">
          <i class="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <span class="text-base font-bold text-white tracking-wider">Important Notice</span>
        <div class="w-6"></div> {/* Spacer to center the title */}
      </header>

      {/* CONTENT */}
      <main class="flex-grow overflow-y-auto no-scrollbar px-4 py-6 space-y-6">
        <div class="text-center space-y-3">
          <div class="w-16 h-16 bg-gradient-to-tr from-red-600 to-rose-600 rounded-full flex items-center justify-center mx-auto text-white text-2xl shadow-lg shadow-red-500/20">
            <i class="fa-solid fa-triangle-exclamation animate-pulse"></i>
          </div>
          <h2 class="text-lg font-black uppercase tracking-wider text-red-500">Notice & Disclaimer</h2>
          <p class="text-xs text-gray-400">Please read the following details carefully before playing.</p>
        </div>

        <div class="space-y-4">
          {/* Card 1 */}
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg flex gap-4">
            <div class="text-red-500 text-lg shrink-0 mt-0.5">
              <i class="fa-solid fa-gamepad"></i>
            </div>
            <div class="space-y-1">
              <h4 class="text-xs font-black uppercase text-white tracking-wide">1. Purely Simulated Game</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                This game is a flight crash multiplier simulation created strictly for entertainment, amusement, and educational demo purposes. It is not a real gambling platform.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg flex gap-4">
            <div class="text-red-500 text-lg shrink-0 mt-0.5">
              <i class="fa-solid fa-circle-dollar-to-slot"></i>
            </div>
            <div class="space-y-1">
              <h4 class="text-xs font-black uppercase text-white tracking-wide">2. No Real Value / Money</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                All deposits, withdrawals, promotions, and virtual balances in this app are 100% simulated. There is no real-world monetary value, and no real currency is processed, stored, or paid out.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg flex gap-4">
            <div class="text-red-500 text-lg shrink-0 mt-0.5">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div class="space-y-1">
              <h4 class="text-xs font-black uppercase text-white tracking-wide">3. Zero Financial Risk</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                Since all transactions are simulated, there is zero financial risk. Outcomes are determined by simulated client-server math for fun and do not mirror any real casino odds.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg flex gap-4">
            <div class="text-red-500 text-lg shrink-0 mt-0.5">
              <i class="fa-solid fa-handshake-angle"></i>
            </div>
            <div class="space-y-1">
              <h4 class="text-xs font-black uppercase text-white tracking-wide">4. User Agreement</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                By accessing this simulation, you agree that you understand it is a demo application. Any simulated deposit or withdrawal request is purely virtual and will not involve real-world funds.
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
