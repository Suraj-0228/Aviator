import { useNavigate } from 'react-router-dom';

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div class="min-h-screen bg-[#131418] text-white flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#2d303b]/50 pb-10 select-none">
      
      {/* HEADER */}
      <header class="bg-[#1a1c22] px-4 py-4 flex items-center justify-between border-b border-[#2d303b] sticky top-0 z-30">
        <button onClick={() => navigate('/profile')} class="text-gray-400 hover:text-white transition cursor-pointer">
          <i class="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <span class="text-base font-bold text-white tracking-wider">About Us</span>
        <div class="w-6"></div>
      </header>

      {/* CONTENT */}
      <main class="flex-grow overflow-y-auto no-scrollbar px-4 py-6 space-y-6">
        
        {/* Intro */}
        <div class="text-center space-y-3">
          <div class="w-16 h-16 bg-gradient-to-tr from-red-600 to-rose-600 rounded-full flex items-center justify-center mx-auto text-white text-2xl shadow-lg shadow-red-500/20">
            <i class="fa-solid fa-paper-plane animate-pulse"></i>
          </div>
          <h2 class="text-lg font-black uppercase tracking-wider text-red-500">BDG Pilot Aviator</h2>
          <p class="text-xs text-gray-405">Engine Version 1.1 (Stable Release)</p>
        </div>

        {/* Introduction block */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-5 shadow-lg space-y-3 text-xs leading-relaxed">
          <h3 class="text-xs font-black uppercase tracking-wide text-white flex items-center gap-2">
            <i class="fa-solid fa-circle-info text-red-500"></i> Project Overview
          </h3>
          <p class="text-gray-400">
            The **BDG Pilot Aviator Engine** is a state-of-the-art, multiplayer crash game simulator. Built as a MERN stack application, it demonstrates real-time state synchronization, socket communication, and cryptographic fairness algorithms.
          </p>
        </section>

        {/* Core Game Loop Mechanics */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-5 shadow-lg space-y-3.5 text-xs">
          <h3 class="text-xs font-black uppercase tracking-wide text-white flex items-center gap-2 border-b border-[#2d303b]/40 pb-2">
            <i class="fa-solid fa-arrows-spin text-red-500"></i> Gameplay Mechanics
          </h3>
          <div class="space-y-3 text-gray-450 leading-relaxed">
            <div>
              <span class="text-red-500 font-bold block mb-0.5">1. Pre-Round Countdown</span>
              Before takeoff, players are given a 5-second countdown to place one or two separate wagers.
            </div>
            <div>
              <span class="text-red-500 font-bold block mb-0.5">2. Flight Progression</span>
              As the plane takes off, the bezier curve climbs, and the cashout multiplier starts ticking upwards from 1.00x.
            </div>
            <div>
              <span class="text-red-500 font-bold block mb-0.5">3. Escape / Crash Event</span>
              At a cryptographically pre-determined point, the plane flies away (crashes). Wagers not cashed out before this moment are lost.
            </div>
            <div>
              <span class="text-red-500 font-bold block mb-0.5">4. Auto Control Options</span>
              Players can configure Auto-Betting (to auto place wagers each round) or Auto-Cashout (to secure winnings automatically at target multipliers).
            </div>
          </div>
        </section>

        {/* Provably Fair Cryptographic Details */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-5 shadow-lg space-y-3 text-xs leading-relaxed">
          <h3 class="text-xs font-black uppercase tracking-wide text-white flex items-center gap-2 border-b border-[#2d303b]/40 pb-2">
            <i class="fa-solid fa-shield-halved text-red-500"></i> Provably Fair System
          </h3>
          <p class="text-gray-400">
            Outcomes are 100% transparent and tamper-proof. The flight duration is pre-determined using a cryptographic formula before each round begins:
          </p>
          <div class="bg-[#131418] border border-[#2d303b]/80 rounded-xl p-3 font-mono text-[10px] text-red-400/90 select-text overflow-x-auto whitespace-pre">
            SHA256(ServerSeed + ClientSeed)
          </div>
          <p class="text-gray-400">
            The server seed is hashed and presented to players *before* the round starts. Once the round completes, players can rotate their seeds and verify that the multiplier matched the math hash, making outcome manipulation impossible.
          </p>
        </section>

        {/* Technical Architecture */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-5 shadow-lg space-y-3 text-xs leading-relaxed">
          <h3 class="text-xs font-black uppercase tracking-wide text-white flex items-center gap-2 border-b border-[#2d303b]/40 pb-2">
            <i class="fa-solid fa-code text-red-500"></i> Technical Architecture
          </h3>
          <div class="grid grid-cols-2 gap-4 text-[11px] pt-1">
            <div class="bg-[#131418] border border-[#2d303b] p-3 rounded-xl">
              <span class="font-bold text-red-500 block mb-1">Backend</span>
              Node.js, Express, Socket.io, MongoDB Community, JWT Security.
            </div>
            <div class="bg-[#131418] border border-[#2d303b] p-3 rounded-xl">
              <span class="font-bold text-red-500 block mb-1">Frontend</span>
              React 19, Tailwind CSS, HTML5 Canvas Engine, Web Audio API.
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section class="bg-[#e11d48]/5 border border-[#e11d48]/20 rounded-2xl p-4.5 space-y-2 text-xs leading-relaxed">
          <span class="text-[#fb7185] font-black uppercase tracking-wide flex items-center gap-1.5 text-[10px]">
            <i class="fa-solid fa-triangle-exclamation"></i> Simulated Environment
          </span>
          <p class="text-gray-400 text-[11px]">
            BDG Pilot Aviator is an educational developer showcase. All currencies, transactions (deposits/payouts), check-in bonuses, and wagers are purely virtual with zero real-world monetary value.
          </p>
        </section>

      </main>

      {/* FOOTER */}
      <footer class="text-center py-4 text-[10px] text-gray-600 font-semibold border-t border-[#2d303b]/40">
        &copy; 2026 BDG Pilot Engine. Simulated Sandbox.
      </footer>
    </div>
  );
}
