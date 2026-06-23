import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import logo from '../assets/logo.png';
import { SocketContext } from '../context/SocketContext.jsx';
import { AviatorCanvas } from '../utils/canvasEngine.js';
import { soundEngine } from '../utils/soundEngine.js';

export default function Play() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, updateClientSeed, syncBalance } = useContext(AuthContext);
  const { socket, connected } = useContext(SocketContext);

  const [welcomeOpen, setWelcomeOpen] = useState(false);

  // Core Game Loop State
  const [gameState, setGameState] = useState('PRE_ROUND'); // PRE_ROUND, PLAYING, CRASHED
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(6.0);
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [currentRoundId, setCurrentRoundId] = useState(null);
  const [history, setHistory] = useState([
    1.24, 3.66, 13.79, 1.01, 4.87, 112.74, 1.54, 9.95, 1.38, 2.45
  ]);

  // Sidebar Tabs and Toggle states
  const [lobbyTab, setLobbyTab] = useState('all'); // all, my, top
  const [lobbyPage, setLobbyPage] = useState(1);

  // Dual Betting Panel State
  const [p1Tab, setP1Tab] = useState('bet'); // bet, auto
  const [p1Bet, setP1Bet] = useState(100.00); // 100 INR starting bet
  const [p1Active, setP1Active] = useState(false);
  const [p1Cashed, setP1Cashed] = useState(false);
  const [p1AutoBet, setP1AutoBet] = useState(false);
  const [p1AutoCash, setP1AutoCash] = useState(false);
  const [p1AutoCashVal, setP1AutoCashVal] = useState(2.00);

  const [p2Tab, setP2Tab] = useState('bet');
  const [p2Bet, setP2Bet] = useState(100.00);
  const [p2Active, setP2Active] = useState(false);
  const [p2Cashed, setP2Cashed] = useState(false);
  const [p2AutoBet, setP2AutoBet] = useState(false);
  const [p2AutoCash, setP2AutoCash] = useState(false);
  const [p2AutoCashVal, setP2AutoCashVal] = useState(2.00);

  // Simulated Lobby Bets (Merged with real user bets)
  const [lobbyBets, setLobbyBets] = useState([]);
  const [personalBets, setPersonalBets] = useState([]);
  const [topWins, setTopWins] = useState([]);

  // Modals state
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [fairnessOpen, setFairnessOpen] = useState(false);
  const [customSeed, setCustomSeed] = useState(user?.clientSeed || '');
  const [verificationResult, setVerificationResult] = useState(null);

  // Sound state
  const [isMuted, setIsMuted] = useState(true);

  // Toast notifications
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }

  const showToast = (message, type = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 1000);
  };

  // Refs
  const canvasRef = useRef(null);
  const canvasEngineRef = useRef(null);
  
  // Virtual players pool
  const virtualPlayersRef = useRef([]);
  
  // Timer and interval refs for cleanup
  const countdownIntervalRef = useRef(null);
  const historyTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Initialize Canvas
  useEffect(() => {
    if (canvasRef.current) {
      canvasEngineRef.current = new AviatorCanvas(canvasRef.current);
    }
    return () => {
      if (canvasEngineRef.current) {
        canvasEngineRef.current.destroy();
      }
    };
  }, []);

  // Fetch histories and Top Wins on load
  useEffect(() => {
    if (user) {
      setCustomSeed(user.clientSeed);
      fetchLedgerHistory();
    }
    generateInitialTopWins();
  }, [user]);

  // Handle welcome modal trigger on login redirection
  useEffect(() => {
    if (location.state?.justLoggedIn) {
      setWelcomeOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const fetchLedgerHistory = async () => {
    try {
      const betRes = await axios.get('/wallet/bets');
      if (betRes.data.success) {
        setPersonalBets(betRes.data.bets);
      }
    } catch (e) {
      console.warn('Error loading history from DB:', e.message);
    }
  };

  const generateInitialTopWins = () => {
    const names = ['LuckyFlyer', 'CryptoWhale', 'AltFlyer', 'SonicBoom', 'Vortex', 'GoldRush'];
    const mockWins = Array.from({ length: 15 }, () => {
      const name = names[Math.floor(Math.random() * names.length)];
      const bet = (500 + Math.random() * 5000).toFixed(0);
      const mult = (2 + Math.random() * Math.random() * 65).toFixed(2);
      const payout = (bet * mult).toFixed(0);
      return { name, bet, mult, payout, date: 'Today' };
    });
    setTopWins(mockWins.sort((a, b) => b.payout - a.payout));
  };



  // Connect WebSockets game events
  useEffect(() => {
    if (!socket) return;

    // Sync state on component mount/reconnection
    socket.emit('request_game_state', {}, (res) => {
      if (res && res.success) {
        setGameState(res.gameState);
        setMultiplier(res.multiplier);
        if (res.history && res.history.length > 0) {
          setHistory(res.history);
        }
        setServerSeedHash(res.serverSeedHash);
        setCurrentRoundId(res.roundId);
        if (res.lobbyBets) {
          setLobbyBets(res.lobbyBets);
        }
        
        if (canvasEngineRef.current) {
          canvasEngineRef.current.setGameState(res.gameState, res.multiplier);
        }

        if (res.gameState === 'PRE_ROUND') {
          // Sync countdown
          let remaining = res.countdownRemaining / 1000;
          setCountdown(remaining);
          
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          countdownIntervalRef.current = setInterval(() => {
            remaining -= 0.1;
            if (remaining <= 0) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              setCountdown(0);
            } else {
              setCountdown(remaining);
            }
          }, 100);
        } else if (res.gameState === 'PLAYING') {
          soundEngine.startEngine();
          soundEngine.updateEngine(res.multiplier);
        }
      }
    });

    socket.on('round_prepare', (data) => {
      setGameState('PRE_ROUND');
      setServerSeedHash(data.serverSeedHash);
      setCurrentRoundId(data.roundId);
      setMultiplier(1.00);
      setVerificationResult(null);
      setLobbyPage(1);
      setLobbyBets(data.lobbyBets || []);

      // Sync Canvas state
      if (canvasEngineRef.current) {
        canvasEngineRef.current.setGameState('PRE_ROUND');
      }

      // Start client pre-round countdown
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      let remaining = data.countdownDuration / 1000;
      setCountdown(remaining);
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 0.1;
        if (remaining <= 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setCountdown(0);
        } else {
          setCountdown(remaining);
        }
      }, 100);

      // Auto Bet trigger
      if (p1AutoBet) handleBetSubmit('p1');
      if (p2AutoBet) handleBetSubmit('p2');
    });

    socket.on('round_start', () => {
      setGameState('PLAYING');
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      soundEngine.startEngine();
      if (canvasEngineRef.current) {
        canvasEngineRef.current.setGameState('PLAYING', 1.00);
      }
    });

    socket.on('multiplier_update', (data) => {
      setMultiplier(data.multiplier);
      soundEngine.updateEngine(data.multiplier);
      
      setGameState(prev => {
        if (prev !== 'PLAYING' && prev !== 'CRASHED') {
          soundEngine.startEngine();
          if (canvasEngineRef.current) {
            canvasEngineRef.current.setGameState('PLAYING', data.multiplier);
          }
          return 'PLAYING';
        }
        return prev;
      });
      
      if (canvasEngineRef.current) {
        canvasEngineRef.current.updateMultiplier(data.multiplier);
      }

      // Check auto-cashouts
      if (p1Active && !p1Cashed && p1AutoCash && data.multiplier >= p1AutoCashVal) {
        handleCashoutSubmit('p1');
      }
      if (p2Active && !p2Cashed && p2AutoCash && data.multiplier >= p2AutoCashVal) {
        handleCashoutSubmit('p2');
      }
    });

    socket.on('round_crash', (data) => {
      setGameState('CRASHED');
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      soundEngine.stopEngine();
      soundEngine.playCrashExplosion();

      if (canvasEngineRef.current) {
        canvasEngineRef.current.setGameState('CRASHED');
      }

      setHistory(prev => [data.crashPoint, ...prev.slice(0, 14)]);

      setP1Active(false);
      setP1Cashed(false);

      setP2Active(false);
      setP2Cashed(false);

      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
      historyTimeoutRef.current = setTimeout(() => {
        fetchLedgerHistory();
        historyTimeoutRef.current = null;
      }, 1000);
    });

    socket.on('lobby_new_bet', (data) => {
      setLobbyBets(prev => [...prev, {
        name: data.username,
        bet: data.betAmount,
        cashedOut: false,
        cashoutMult: null,
        payout: null,
        isReal: true,
        userId: data.userId,
        panelIndex: data.panelIndex
      }]);
    });

    socket.on('lobby_cashout', (data) => {
      setLobbyBets(prev => prev.map(p => {
        if (data.isReal) {
          if (p.isReal && p.userId === data.userId && p.panelIndex === data.panelIndex) {
            return {
              ...p,
              cashedOut: true,
              cashoutMult: data.cashoutMult,
              payout: data.payout
            };
          }
        } else {
          if (!p.isReal && p.name === data.username) {
            return {
              ...p,
              cashedOut: true,
              cashoutMult: data.cashoutMult,
              payout: data.payout
            };
          }
        }
        return p;
      }));
    });

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
        historyTimeoutRef.current = null;
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
      soundEngine.stopEngine();

      socket.off('round_prepare');
      socket.off('round_start');
      socket.off('multiplier_update');
      socket.off('round_crash');
      socket.off('lobby_new_bet');
      socket.off('lobby_cashout');
    };
  }, [socket, p1Active, p1Cashed, p1AutoBet, p1AutoCash, p1AutoCashVal, p2Active, p2Cashed, p2AutoBet, p2AutoCash, p2AutoCashVal]);

  // Virtual Lobby Mechanics (INR scale: ₹50 - ₹5000)
  const generateVirtualLobby = () => {
    const names = ['TurboBet', 'BitPilot', 'MaxRider', 'CashOutKing', 'AltFlyer', 'SonicBoom', 'Zephyr', 'Falcon'];
    const count = 15 + Math.floor(Math.random() * 15);
    
    const virtuals = Array.from({ length: count }, () => {
      const name = names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random() * 100);
      const bet = Number((50 + Math.random() * 2000).toFixed(0)); // INR Bet limits
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

    virtualPlayersRef.current = virtuals;
    setLobbyBets(virtuals);
  };

  const updateVirtualLobbyCashouts = (currentMult) => {
    let changed = false;
    const updated = virtualPlayersRef.current.map(p => {
      if (!p.cashedOut && currentMult >= p.cashoutTarget) {
        p.cashedOut = true;
        p.cashoutMult = p.cashoutTarget;
        p.payout = Number((p.bet * p.cashoutMult).toFixed(2));
        changed = true;
      }
      return p;
    });

    if (changed) {
      virtualPlayersRef.current = updated;
      setLobbyBets(prev => prev.map(p => {
        if (!p.isReal) {
          const match = updated.find(v => v.name === p.name);
          return match || p;
        }
        return p;
      }));
    }
  };

  // Sound handler
  const handleToggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Submit wagers
  const handleBetSubmit = (panelKey) => {
    if (!socket || !connected) return;
    soundEngine.playBetClick();

    const isP1 = panelKey === 'p1';
    const betVal = Math.max(10, parseFloat(isP1 ? p1Bet : p2Bet) || 10);
    
    if (isP1) setP1Bet(betVal);
    else setP2Bet(betVal);
    
    if (betVal > 8000) {
      showToast('Maximum bet limit is ₹8,000 per round.', 'error');
      return;
    }
    
    if (user.balance < betVal) {
      showToast('Insufficient wallet balance! Please Deposit INR credits.', 'error');
      return;
    }

    socket.emit('place_bet', {
      betAmount: betVal,
      panelIndex: isP1 ? 1 : 2
    }, (res) => {
      if (res.success) {
        syncBalance(res.newBalance);
        if (isP1) {
          setP1Active(true);
        } else {
          setP2Active(true);
        }
      } else {
        showToast(res.error || 'Failed to place bet', 'error');
      }
    });
  };

  // Cashout
  const handleCashoutSubmit = (panelKey) => {
    if (!socket || !connected) return;

    const isP1 = panelKey === 'p1';
    
    socket.emit('cashout', {
      panelIndex: isP1 ? 1 : 2
    }, (res) => {
      if (res.success) {
        syncBalance(res.newBalance);
        soundEngine.playCashoutChime();
        if (isP1) {
          setP1Cashed(true);
        } else {
          setP2Cashed(true);
        }
      } else {
        showToast(res.error || 'Failed to cashout', 'error');
      }
    });
  };



  const handleSaveSeed = async () => {
    const res = await updateClientSeed(customSeed);
    if (res.success) {
      showToast('Client seed updated successfully!', 'success');
    } else {
      showToast(res.error || 'Error updating seed', 'error');
    }
  };

  const handleVerifySeeds = async () => {
    if (!serverSeedHash) return;
    try {
      const combined = `${serverSeedHash}-${customSeed}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const hex = hashHex.substring(0, 13);
      const dec = parseInt(hex, 16);
      const h = Math.pow(2, 52);
      const multVal = Math.max(1.00, Number((Math.floor(((100 * h - dec) / (h - dec)) * 100) / 100 / 100).toFixed(2)));

      setVerificationResult({
        combinedHash: hashHex,
        multiplier: multVal
      });
    } catch(e) {
      console.error(e);
    }
  };

  // Pagination calculations
  const itemsPerPage = 7;
  const totalPages = Math.max(1, Math.ceil(lobbyBets.length / itemsPerPage));
  const paginatedAllBets = lobbyBets.slice((lobbyPage - 1) * itemsPerPage, lobbyPage * itemsPerPage);

  return (
    <div class={`h-full flex flex-col justify-between bg-[#08080d] text-white ${user?.role === 'admin' ? 'pb-16' : ''}`}>
      {/* FLOATING GLASS NAV HEADER */}
      <header class="bg-[#12131a]/85 backdrop-blur-lg border border-white/10 rounded-2xl lg:mx-4 mx-2 lg:mt-4 mt-2 py-2 lg:py-3 px-3 lg:px-6 flex items-center justify-between z-30 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div class="flex items-center gap-3 md:gap-6">
          {/* Back button */}
          <button 
            onClick={() => navigate('/')} 
            class="text-gray-400 hover:text-white transition cursor-pointer flex items-center justify-center p-1.5 bg-[#1b1c25]/80 hover:bg-[#252733] border border-white/5 rounded-xl"
            title="Back to Lobby"
          >
            <i class="fa-solid fa-chevron-left text-sm md:text-base px-1"></i>
          </button>
          
          <Link to="/" class="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-fuchsia-600 font-black italic lg:text-2xl text-lg tracking-wider select-none uppercase hover:opacity-90 transition duration-200">
            <img src={logo} alt="Aviator Logo" class="h-8 w-auto rounded-md object-contain" />
            <span>Aviator</span>
          </Link>
          <button onClick={() => setFairnessOpen(true)} class="hidden md:flex text-xs items-center gap-1.5 bg-[#1b1c25]/80 hover:bg-gray-850 text-2xs text-gray-400 px-3 py-1.5 rounded-full border border-white/5 transition cursor-pointer">
            <i class="fa-solid fa-shield-halved text-emerald-500"></i>
            <span>Fair Play Verified</span>
          </button>
        </div>

        <div class="flex items-center gap-1.5 sm:gap-3">
          {user?.role === 'admin' && (
            <Link to="/admin" class="bg-gradient-to-r from-purple-600 to-indigo-650 hover:opacity-90 text-white text-[10px] font-black px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-full border border-white/10 shadow transition active:scale-95 flex items-center gap-1 cursor-pointer">
              <i class="fa-solid fa-user-shield"></i> <span class="hidden sm:inline">Admin</span>
            </Link>
          )}

          <button onClick={() => setHowToPlayOpen(true)} class="bg-gradient-to-r from-amber-500 to-[#f0a90a] hover:from-amber-600 hover:to-[#d69600] text-black text-xs font-extrabold px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-full transition cursor-pointer flex items-center gap-1 shadow-lg shadow-amber-500/10">
            <i class="fa-regular fa-circle-question"></i> <span class="hidden sm:inline">How to play?</span>
          </button>

          {/* INR Balance Wallet */}
          <div class="flex items-center gap-1 lg:gap-2 bg-[#171822]/90 border border-white/5 px-2 lg:px-4 py-1.5 lg:py-2 rounded-xl text-emerald-400 font-mono-val text-xs lg:text-sm font-bold shadow-inner">
            <i class="fa-solid fa-indian-rupee-sign text-emerald-500 text-[10px] lg:text-xs"></i>
            <span>{user?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
          </div>

          {/* Direct Sound Toggle */}
          <button 
            onClick={handleToggleSound} 
            class="bg-[#1b1c25]/80 hover:bg-[#252733] border border-white/5 text-gray-300 p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            <i class={`fa-solid ${isMuted ? 'fa-volume-xmark text-rose-500 animate-pulse' : 'fa-volume-high text-emerald-400'} text-xs lg:text-sm px-0.5`}></i>
          </button>
        </div>
      </header>

      {/* FLOATING HISTORY BADGES STRIP */}
      <div class="bg-[#0b0c12]/80 border border-white/5 rounded-2xl lg:mx-4 mx-2 mt-2 lg:mt-3 px-3 lg:px-4 py-1.5 lg:py-2 flex items-center justify-between z-10 shadow-lg">
        <div class="flex gap-2 items-center overflow-x-auto no-scrollbar scroll-smooth flex-grow py-0.5 pr-4">
          {history.map((val, idx) => {
            let color = 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/10';
            if (val >= 100.0) color = 'bg-gradient-to-r from-rose-950 to-pink-900 text-rose-300 border border-rose-500/30 font-bold';
            else if (val >= 10.0) color = 'bg-fuchsia-950/40 text-fuchsia-400 border border-fuchsia-500/10';
            else if (val >= 2.0) color = 'bg-purple-950/40 text-purple-400 border border-purple-500/10';
            return (
              <span key={idx} onClick={() => setFairnessOpen(true)} class={`px-2.5 py-0.5 text-2xs font-mono-val font-semibold rounded-full shadow-sm cursor-pointer hover:scale-105 transition duration-150 shrink-0 ${color}`}>
                {val.toFixed(2)}x
              </span>
            );
          })}
        </div>
        <div class="flex items-center border-l border-white/10 pl-3">
          <button onClick={() => setFairnessOpen(true)} class="bg-[#1b1c25]/80 hover:bg-[#252733] text-gray-400 text-xs px-2.5 py-1 rounded-full border border-white/5 transition cursor-pointer flex items-center gap-1">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <i class="fa-solid fa-caret-down text-[9px]"></i>
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER WORKSPACE */}
      <main class="flex-grow grid grid-cols-1 lg:grid-cols-4 w-full lg:h-[calc(100vh-140px)] h-auto bg-transparent lg:p-4 p-2 gap-4 lg:overflow-hidden relative">
        
        {/* LEFT LOBBY CARD */}
        <section class="bg-[#111219]/90 border border-white/5 rounded-2xl flex flex-col lg:h-full h-[380px] col-span-1 z-20 shadow-2xl backdrop-blur-md overflow-hidden order-last lg:order-first">
          <div class="grid grid-cols-3 bg-[#0a0a0f] p-1.5 border-b border-white/5">
            <button onClick={() => setLobbyTab('all')} class={`py-1.5 text-xs font-bold text-center rounded-lg cursor-pointer transition ${lobbyTab === 'all' ? 'bg-[#1b1c25] text-white shadow-inner' : 'text-gray-400 hover:text-white'}`}>All Bets</button>
            <button onClick={() => setLobbyTab('my')} class={`py-1.5 text-xs font-bold text-center rounded-lg cursor-pointer transition ${lobbyTab === 'my' ? 'bg-[#1b1c25] text-white shadow-inner' : 'text-gray-400 hover:text-white'}`}>My Bets</button>
            <button onClick={() => setLobbyTab('top')} class={`py-1.5 text-xs font-bold text-center rounded-lg cursor-pointer transition ${lobbyTab === 'top' ? 'bg-[#1b1c25] text-white shadow-inner' : 'text-gray-400 hover:text-white'}`}>Top Wins</button>
          </div>

          <div class="px-4 py-2.5 bg-[#141520]/80 flex justify-between items-center text-3xs text-gray-500 border-b border-white/5 uppercase font-bold tracking-wider">
            <span class="flex items-center gap-1 text-[13px]"><i class="fa-solid fa-circle text-emerald-500 text-[5px] animate-pulse"></i> Active: <span class="text-white font-mono-val">{lobbyBets.length}</span></span>
            <span class="text-[13px]">Total wagers: <span class="text-white font-mono-val">₹{lobbyBets.reduce((acc, curr) => acc + curr.bet, 0).toLocaleString('en-IN')}</span></span>
          </div>

          <div class="flex-grow overflow-y-auto p-3 space-y-2">
            {lobbyTab === 'all' && lobbyBets.map((p, idx) => (
              <div key={idx} class={`flex items-center justify-between p-2.5 text-3xs rounded-xl border transition ${p.cashedOut ? 'bg-emerald-950/15 border-emerald-500/20 text-emerald-400 shadow-md' : 'bg-[#161722]/60 border-white/5 text-gray-300'}`}>
                <div class="flex items-center gap-2">
                  <span class={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-white text-[9px] ${p.cashedOut ? 'bg-emerald-600' : 'bg-gray-700'}`}>{p.name.charAt(0)}</span>
                  <span class="truncate max-w-[85px] font-medium">{p.name}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-gray-500 font-mono-val">₹{p.bet.toLocaleString('en-IN')}</span>
                  {p.cashedOut ? (
                    <>
                      <span class="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-lg border border-emerald-500/20">{p.cashoutMult.toFixed(2)}x</span>
                      <span class="font-bold font-mono-val text-emerald-400">₹{p.payout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </>
                  ) : (
                    <span class="text-gray-700 font-mono-val">--</span>
                  )}
                </div>
              </div>
            ))}

            {lobbyTab === 'my' && (
              personalBets.length === 0 ? (
                <div class="text-center text-gray-500 text-xs py-10">
                  <i class="fa-solid fa-receipt text-3xl mb-2 text-gray-700 block"></i>
                  No personal bets found.
                </div>
              ) : (
                personalBets.map((item, idx) => {
                  const didWin = item.status === 'won';
                  return (
                    <div key={idx} class={`flex items-center justify-between border rounded-xl p-2.5 text-3xs ${didWin ? 'bg-emerald-950/15 border-emerald-500/20' : 'bg-rose-950/10 border-rose-500/10'}`}>
                      <div class="flex flex-col">
                        <span class="text-gray-300 font-bold">{new Date(item.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        <span class="text-gray-500 text-[9px] truncate max-w-[70px]">{item.roundId?.serverSeedHash?.substring(0, 8)}...</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-gray-400 font-mono-val">₹{item.betAmount}</span>
                        <span class={`font-bold px-1.5 py-0.5 rounded-lg border ${didWin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                          {didWin ? `${item.cashoutMultiplier.toFixed(2)}x` : 'Crashed'}
                        </span>
                        <span class={`${didWin ? 'text-emerald-400 font-bold' : 'text-rose-400/80'} font-mono-val`}>
                          ₹{item.payoutAmount.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {lobbyTab === 'top' && topWins.map((item, idx) => (
              <div key={idx} class="flex items-center justify-between bg-[#161722]/60 border border-white/5 rounded-xl p-2.5 text-3xs">
                <div class="flex items-center gap-2">
                  <span class="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-[9px]">{item.name.charAt(0)}</span>
                  <div class="flex flex-col">
                    <span class="text-gray-300 font-semibold truncate max-w-[85px]">{item.name}</span>
                    <span class="text-gray-500 text-[9px]">{item.date}</span>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-gray-500 font-mono-val">₹{parseFloat(item.bet).toLocaleString('en-IN')}</span>
                  <span class="bg-purple-500/10 text-purple-400 font-bold px-1.5 py-0.5 rounded-lg border border-purple-500/20">{parseFloat(item.mult).toFixed(2)}x</span>
                  <span class="text-purple-400 font-bold font-mono-val">₹{parseFloat(item.payout).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Lobby Pagination */}
          {lobbyTab === 'all' && totalPages > 1 && (
            <div class="flex items-center justify-between p-3 bg-[#0a0a0f] border-t border-white/5 text-3xs text-gray-400 font-semibold select-none shrink-0">
              <button 
                onClick={() => setLobbyPage(prev => Math.max(1, prev - 1))}
                disabled={lobbyPage === 1}
                class={`px-2 py-1 rounded-lg transition border ${lobbyPage === 1 ? 'border-white/5 text-gray-600 cursor-not-allowed' : 'border-white/10 text-gray-350 hover:bg-[#1b1c25] cursor-pointer'}`}
              >
                <i class="fa-solid fa-chevron-left mr-1"></i> Prev
              </button>
              <span class="font-mono-val text-gray-500">Page <span class="text-gray-300">{lobbyPage}</span> of {totalPages}</span>
              <button 
                onClick={() => setLobbyPage(prev => Math.min(totalPages, prev + 1))}
                disabled={lobbyPage === totalPages}
                class={`px-2 py-1 rounded-lg transition border ${lobbyPage === totalPages ? 'border-white/5 text-gray-600 cursor-not-allowed' : 'border-white/10 text-gray-350 hover:bg-[#1b1c25] cursor-pointer'}`}
              >
                Next <i class="fa-solid fa-chevron-right ml-1"></i>
              </button>
            </div>
          )}
        </section>

        {/* CENTER FLIGHT BOARD */}
        <section class="col-span-1 lg:col-span-3 flex flex-col justify-between lg:h-full h-auto gap-3 lg:gap-4">
          
          {/* FLIGHT CANVAS CARD */}
          <div class="relative flex-grow lg:h-auto h-[240px] sm:h-[300px] bg-[#090a0f] rounded-2xl border border-white/5 overflow-hidden flex flex-col shadow-2xl shrink-0">
            <canvas ref={canvasRef} class="absolute inset-0 w-full h-full z-0"></canvas>

            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <div class="text-center select-none">
                {gameState === 'PLAYING' && (
                  <span class="text-white font-black tracking-tight text-5xl sm:text-8xl lg:text-9xl text-neon-glow leading-none block">
                    {multiplier.toFixed(2)}x
                  </span>
                )}
                
                {gameState === 'CRASHED' && (
                  <div class="mt-2 animate-bounce">
                    <span class="text-rose-500 font-black text-3xl sm:text-4xl tracking-widest uppercase block text-neon-glow-red">Flew Away!</span>
                    <span class="text-rose-400 font-mono-val font-semibold text-4xl block mt-1">@ {multiplier.toFixed(2)}x</span>
                  </div>
                )}
                
                {gameState === 'PRE_ROUND' && (
                  <div class="bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
                    <span class="text-gray-400 text-xs font-bold uppercase tracking-wider block">Waiting for next round</span>
                    <div class="flex items-center justify-center gap-2 mt-1">
                      <i class="fa-solid fa-spinner animate-spin text-rose-500 text-sm"></i>
                      <span class="text-[#f0a90a] font-mono-val font-black text-xl">{countdown.toFixed(1)}s</span>
                    </div>
                    <div class="w-32 h-1 bg-gray-900 rounded-full overflow-hidden mt-2 mx-auto">
                      <div class="h-full bg-gradient-to-r from-amber-400 to-[#f0a90a] transition-all duration-100 ease-linear" style={{ width: `${(countdown / 6.0) * 100}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div class="absolute bottom-2 left-4 text-3xs text-gray-500 pointer-events-none z-10 flex gap-2 font-bold uppercase tracking-wider">
              <span class="flex items-center gap-1 text-xs"><i class="fa-solid fa-server text-emerald-500"></i> Server-Authoritative Loop</span>
            </div>
          </div>

          {/* DUAL BET CONSOLES */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
            
            {/* CONSOLE 1 */}
            <article class={`bg-[#111219]/95 border rounded-2xl lg:p-4 p-3 flex flex-col justify-between transition-all duration-200 shadow-xl backdrop-blur-md ${p1Active && !p1Cashed ? 'border-amber-500 shadow-amber-500/5 ring-1 ring-amber-500/20' : 'border-white/5'}`}>
              <div class="flex justify-center bg-[#0a0a0f] p-1 rounded-xl mb-3 border border-white/5">
                <button onClick={() => setP1Tab('bet')} class={`flex-1 py-1 text-xs font-bold text-center rounded-lg cursor-pointer transition ${p1Tab === 'bet' ? 'bg-[#1b1c25] text-white shadow-inner border border-white/5' : 'text-gray-400 hover:text-white'}`}>Bet</button>
                <button onClick={() => setP1Tab('auto')} class={`flex-1 py-1 text-xs font-bold text-center rounded-lg cursor-pointer transition ${p1Tab === 'auto' ? 'bg-[#1b1c25] text-white shadow-inner border border-white/5' : 'text-gray-400 hover:text-white'}`}>Auto</button>
              </div>

              <div class="flex gap-2 sm:gap-3">
                <div class="flex-grow flex flex-col justify-between gap-3">
                  <div class="flex items-center justify-between bg-[#07080b] border border-white/5 rounded-xl px-2 py-1.5 shadow-inner">
                    <button onClick={() => setP1Bet(prev => Math.max(10, (parseFloat(prev) || 0) - 50))} class="w-7 h-7 bg-[#1b1c25] hover:bg-gray-850 rounded-full flex items-center justify-center text-gray-400 transition cursor-pointer"><i class="fa-solid fa-minus text-xs"></i></button>
                    <div class="flex items-center justify-center gap-0.5">
                      <span class="text-gray-500 text-xs font-bold">₹</span>
                      <input 
                        type="number" 
                        value={p1Bet} 
                        onChange={e => setP1Bet(e.target.value)} 
                        onBlur={e => {
                          let val = parseFloat(e.target.value);
                          if (isNaN(val) || val < 10) val = 10;
                          if (val > 8000) val = 8000;
                          setP1Bet(val);
                        }}
                        class="w-12 sm:w-16 bg-transparent text-center text-white font-mono-val font-bold focus:outline-none text-base"
                      />
                    </div>
                    <button onClick={() => setP1Bet(prev => Math.min(8000, (parseFloat(prev) || 0) + 50))} class="w-7 h-7 bg-[#1b1c25] hover:bg-gray-850 rounded-full flex items-center justify-center text-gray-400 transition cursor-pointer"><i class="fa-solid fa-plus text-xs"></i></button>
                  </div>
                  
                  <div class="grid grid-cols-4 gap-1.5 text-3xs">
                    {[100, 200, 500, 1000].map(val => (
                      <button key={val} onClick={() => setP1Bet(val)} class="bg-[#1b1c25] hover:bg-[#212330] text-gray-300 font-bold font-mono-val py-2 rounded-lg border border-white/5 transition cursor-pointer">₹{val}</button>
                    ))}
                  </div>
                </div>

                {p1Active ? (
                  p1Cashed ? (
                    <button disabled class="sm:w-36 w-28 sm:h-20 h-16 bg-gray-850 text-gray-500 border border-white/5 font-black text-xs rounded-xl flex flex-col items-center justify-center uppercase tracking-wider">CASHED OUT</button>
                  ) : (
                    <button onClick={() => handleCashoutSubmit('p1')} class="sm:w-36 w-28 sm:h-20 h-16 bg-gradient-to-r from-amber-500 to-[#f0a90a] hover:opacity-90 text-black font-black text-sm sm:text-lg tracking-wider rounded-xl transition cursor-pointer flex flex-col items-center justify-center shadow-lg shadow-amber-500/25 active:scale-95">
                      <span class="uppercase">CASHOUT</span>
                      <span class="text-[10px] sm:text-2xs font-semibold font-mono-val mt-0.5">₹{((parseFloat(p1Bet) || 0) * multiplier).toFixed(0)}</span>
                    </button>
                  )
                ) : (
                  <button onClick={() => handleBetSubmit('p1')} class="sm:w-36 w-28 sm:h-20 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white font-black text-sm sm:text-lg tracking-wider rounded-xl transition cursor-pointer flex flex-col items-center justify-center shadow-lg shadow-emerald-500/25 active:scale-95">
                    <span class="uppercase">{gameState === 'PRE_ROUND' ? 'BET' : 'BET NEXT'}</span>
                    <span class="text-[10px] sm:text-2xs font-normal opacity-85 mt-0.5">₹{(parseFloat(p1Bet) || 0).toFixed(0)}</span>
                  </button>
                )}
              </div>

              {p1Tab === 'auto' && (
                <div class="border-t border-white/5 mt-3 pt-3 space-y-2">
                  <div class="flex items-center justify-between text-2xs">
                    <span class="text-gray-400 font-bold uppercase text-xs tracking-wide">Auto Bet</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={p1AutoBet} onChange={e => setP1AutoBet(e.target.checked)} class="sr-only peer"/>
                      <div class="w-8 h-4.5 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between text-2xs gap-3">
                    <span class="text-gray-400 font-bold uppercase text-xs tracking-wide">Auto Cash Out</span>
                    <div class="flex items-center gap-1.5 bg-[#07080b] border border-white/5 px-2 py-1 rounded-lg w-full max-w-[120px] shadow-inner">
                      <input type="number" step="0.1" value={p1AutoCashVal} onChange={e => setP1AutoCashVal(Math.max(1.01, parseFloat(e.target.value) || 1))} class="w-full bg-transparent text-right font-mono-val font-bold text-white focus:outline-none"/>
                      <span class="text-gray-500 font-mono-val">x</span>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={p1AutoCash} onChange={e => setP1AutoCash(e.target.checked)} class="sr-only peer"/>
                      <div class="w-8 h-4.5 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                </div>
              )}
            </article>

            {/* CONSOLE 2 */}
            <article class={`bg-[#111219]/95 border rounded-2xl lg:p-4 p-3 flex flex-col justify-between transition-all duration-200 shadow-xl backdrop-blur-md ${p2Active && !p2Cashed ? 'border-amber-500 shadow-amber-500/5 ring-1 ring-amber-500/20' : 'border-white/5'}`}>
              <div class="flex justify-center bg-[#0a0a0f] p-1 rounded-xl mb-3 border border-white/5">
                <button onClick={() => setP2Tab('bet')} class={`flex-1 py-1 text-xs font-bold text-center rounded-lg cursor-pointer transition ${p2Tab === 'bet' ? 'bg-[#1b1c25] text-white shadow-inner border border-white/5' : 'text-gray-400 hover:text-white'}`}>Bet</button>
                <button onClick={() => setP2Tab('auto')} class={`flex-1 py-1 text-xs font-bold text-center rounded-lg cursor-pointer transition ${p2Tab === 'auto' ? 'bg-[#1b1c25] text-white shadow-inner border border-white/5' : 'text-gray-400 hover:text-white'}`}>Auto</button>
              </div>

              <div class="flex gap-2 sm:gap-3">
                <div class="flex-grow flex flex-col justify-between gap-3">
                  <div class="flex items-center justify-between bg-[#07080b] border border-white/5 rounded-xl px-2 py-1.5 shadow-inner">
                    <button onClick={() => setP2Bet(prev => Math.max(10, (parseFloat(prev) || 0) - 50))} class="w-7 h-7 bg-[#1b1c25] hover:bg-gray-850 rounded-full flex items-center justify-center text-gray-400 transition cursor-pointer"><i class="fa-solid fa-minus text-xs"></i></button>
                    <div class="flex items-center justify-center gap-0.5">
                      <span class="text-gray-500 text-xs font-bold">₹</span>
                      <input 
                        type="number" 
                        value={p2Bet} 
                        onChange={e => setP2Bet(e.target.value)} 
                        onBlur={e => {
                          let val = parseFloat(e.target.value);
                          if (isNaN(val) || val < 10) val = 10;
                          if (val > 8000) val = 8000;
                          setP2Bet(val);
                        }}
                        class="w-12 sm:w-16 bg-transparent text-center text-white font-mono-val font-bold focus:outline-none text-base"
                      />
                    </div>
                    <button onClick={() => setP2Bet(prev => Math.min(8000, (parseFloat(prev) || 0) + 50))} class="w-7 h-7 bg-[#1b1c25] hover:bg-gray-850 rounded-full flex items-center justify-center text-gray-400 transition cursor-pointer"><i class="fa-solid fa-plus text-xs"></i></button>
                  </div>
                  
                  <div class="grid grid-cols-4 gap-1.5 text-3xs">
                    {[100, 200, 500, 1000].map(val => (
                      <button key={val} onClick={() => setP2Bet(val)} class="bg-[#1b1c25] hover:bg-[#212330] text-gray-300 font-bold font-mono-val py-2 rounded-lg border border-white/5 transition cursor-pointer">₹{val}</button>
                    ))}
                  </div>
                </div>

                {p2Active ? (
                  p2Cashed ? (
                    <button disabled class="sm:w-36 w-28 sm:h-20 h-16 bg-gray-850 text-gray-500 border border-white/5 font-black text-xs rounded-xl flex flex-col items-center justify-center uppercase tracking-wider">CASHED OUT</button>
                  ) : (
                    <button onClick={() => handleCashoutSubmit('p2')} class="sm:w-36 w-28 sm:h-20 h-16 bg-gradient-to-r from-amber-500 to-[#f0a90a] hover:opacity-90 text-black font-black text-sm sm:text-lg tracking-wider rounded-xl transition cursor-pointer flex flex-col items-center justify-center shadow-lg shadow-amber-500/25 active:scale-95">
                      <span>CASHOUT</span>
                      <span class="text-[10px] sm:text-2xs font-semibold font-mono-val mt-0.5">₹{((parseFloat(p2Bet) || 0) * multiplier).toFixed(0)}</span>
                    </button>
                  )
                ) : (
                  <button onClick={() => handleBetSubmit('p2')} class="sm:w-36 w-28 sm:h-20 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white font-black text-sm sm:text-lg tracking-wider rounded-xl transition cursor-pointer flex flex-col items-center justify-center shadow-lg shadow-emerald-500/25 active:scale-95">
                    <span>{gameState === 'PRE_ROUND' ? 'BET' : 'BET NEXT'}</span>
                    <span class="text-[10px] sm:text-2xs font-normal opacity-85 mt-0.5">₹{(parseFloat(p2Bet) || 0).toFixed(0)}</span>
                  </button>
                )}
              </div>

              {p2Tab === 'auto' && (
                <div class="border-t border-white/5 mt-3 pt-3 space-y-2">
                  <div class="flex items-center justify-between text-2xs">
                    <span class="text-gray-400 font-bold uppercase text-xs tracking-wide">Auto Bet</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={p2AutoBet} onChange={e => setP2AutoBet(e.target.checked)} class="sr-only peer"/>
                      <div class="w-8 h-4.5 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between text-2xs gap-3">
                    <span class="text-gray-400 font-bold uppercase text-xs tracking-wide">Auto Cash Out</span>
                    <div class="flex items-center gap-1.5 bg-[#07080b] border border-white/5 px-2 py-1 rounded-lg w-full max-w-[120px] shadow-inner">
                      <input type="number" step="0.1" value={p2AutoCashVal} onChange={e => setP2AutoCashVal(Math.max(1.01, parseFloat(e.target.value) || 1))} class="w-full bg-transparent text-right font-mono-val font-bold text-white focus:outline-none"/>
                      <span class="text-gray-500 font-mono-val">x</span>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={p2AutoCash} onChange={e => setP2AutoCash(e.target.checked)} class="sr-only peer"/>
                      <div class="w-8 h-4.5 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                </div>
              )}
            </article>

          </div>
        </section>

      </main>

      {/* HOW TO PLAY MODAL */}
      {howToPlayOpen && (
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md p-4">
          <div class="bg-[#14151f] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div class="px-6 py-4 bg-[#0a0a0f] border-b border-white/5 flex justify-between items-center">
              <h3 class="text-base font-bold text-white flex items-center gap-2"><i class="fa-regular fa-circle-question text-rose-500"></i> How to Play</h3>
              <button onClick={() => setHowToPlayOpen(false)} class="text-gray-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div class="p-6 space-y-4 text-sm text-gray-300 leading-relaxed">
              <p><strong class="text-white">1. Place Bets:</strong> Choose your bet size and click <strong class="text-emerald-500">BET</strong> before takeoff.</p>
              <p><strong class="text-white">2. Flight Ascent:</strong> The plane takes off, increasing the multiplier starting from <span class="font-mono-val text-white">1.00x</span>.</p>
              <p><strong class="text-white">3. Cash Out:</strong> Click <strong class="text-amber-500">CASHOUT</strong> before the plane crashes (flies away) to win your wager multiplied by that value!</p>
            </div>
            <div class="p-4 bg-[#0a0a0f] border-t border-white/5 flex justify-end">
              <button onClick={() => setHowToPlayOpen(false)} class="bg-[#1b1c25] hover:bg-gray-800 text-gray-300 font-bold px-5 py-2 rounded-xl transition cursor-pointer text-xs border border-white/5">Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* PROVABLY FAIR MODAL */}
      {fairnessOpen && (
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md p-4">
          <div class="bg-[#14151f] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div class="px-6 py-4 bg-[#0a0a0f] border-b border-white/5 flex justify-between items-center">
              <h3 class="text-base font-bold text-white flex items-center gap-2"><i class="fa-solid fa-shield-halved text-emerald-500"></i> Cryptographic Provably Fair</h3>
              <button onClick={() => setFairnessOpen(false)} class="text-gray-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
            </div>
            <div class="p-6 space-y-4 text-xs text-gray-350">
              <div class="bg-[#07080b] border border-white/5 p-4 rounded-xl space-y-3 shadow-inner">
                <div class="space-y-1">
                  <span class="text-gray-500 uppercase font-semibold text-[10px] tracking-wider">Server Seed Hash (Pre-Round)</span>
                  <div class="font-mono-val bg-[#1b1c25] px-2.5 py-2 rounded border border-white/5 select-all overflow-x-auto text-white">{serverSeedHash || 'Pending round...'}</div>
                </div>
                <div class="space-y-1">
                  <span class="text-gray-500 uppercase font-semibold text-[10px] tracking-wider">Client Seed</span>
                  <div class="flex gap-2">
                    <input type="text" value={customSeed} onChange={e => setCustomSeed(e.target.value)} class="font-mono-val flex-grow bg-[#1b1c25] px-2.5 py-1.5 rounded border border-white/5 text-white focus:outline-none focus:border-rose-500/50"/>
                    <button onClick={handleSaveSeed} class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 rounded-lg cursor-pointer transition">Update</button>
                  </div>
                </div>
                {verificationResult && (
                  <>
                    <div class="space-y-1">
                      <span class="text-gray-500 uppercase font-semibold text-[10px] tracking-wider">Combined Hash (SHA-256)</span>
                      <div class="font-mono-val bg-[#1b1c25] px-2.5 py-2 rounded border border-white/5 overflow-x-auto text-white">{verificationResult.combinedHash}</div>
                    </div>
                    <div class="flex justify-between items-center bg-[#1b1c25]/40 px-3 py-2.5 rounded-lg border border-white/5">
                      <span class="text-gray-400">Computed Multiplier:</span>
                      <span class="font-mono-val text-emerald-400 font-bold text-sm">{verificationResult.multiplier.toFixed(2)}x</span>
                    </div>
                  </>
                )}
              </div>
              <button onClick={handleVerifySeeds} class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition cursor-pointer text-xs shadow-lg shadow-emerald-500/10">Verify Fairness</button>
            </div>
          </div>
        </div>
      )}

      {/* WELCOME POPUP MODAL */}
      {welcomeOpen && (
        <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md p-4">
          <div class="bg-[#111219]/95 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div class="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-[30px] pointer-events-none"></div>
            <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-fuchsia-500/10 rounded-full blur-[30px] pointer-events-none"></div>
            
            <div class="p-8 text-center space-y-6">
              <div class="w-20 h-20 bg-gradient-to-tr from-rose-500 to-fuchsia-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
                <i class="fa-solid fa-plane-departure text-white text-3xl animate-pulse"></i>
              </div>
              
              <div class="space-y-2">
                <h3 class="text-2xl font-black tracking-tight text-white">Welcome back, Pilot!</h3>
                <p class="text-xs text-gray-400 font-semibold px-4">You have successfully signed in to the flight control cabin.</p>
              </div>

              <div class="bg-[#07080b]/90 border border-white/5 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                <div class="text-left">
                  <span class="text-4xs font-bold text-gray-500 uppercase tracking-widest block">Available Balance</span>
                  <span class="text-xs text-gray-300 font-bold block mt-0.5">INR (Indian Rupee)</span>
                </div>
                <div class="text-right flex items-center gap-1.5 font-mono-val font-black text-lg text-emerald-400">
                  <i class="fa-solid fa-indian-rupee-sign text-emerald-500 text-sm"></i>
                  <span>{user?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <button onClick={() => setWelcomeOpen(false)} class="w-full bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:opacity-90 text-white font-black py-3.5 rounded-xl transition cursor-pointer text-xs shadow-lg shadow-rose-500/15 uppercase tracking-wider active:scale-98">
                  Let's Fly!
                </button>
                <div class="text-4xs text-gray-550 font-bold uppercase tracking-wider">
                  Tip: Use Auto Cash Out to secure consistent winnings!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* FLOATING TOAST NOTIFICATION CARD */}
      {toast && (
        <div class="fixed top-6 right-6 z-50 animate-slide-in-right max-w-sm w-full bg-[#14151f]/90 backdrop-blur-md border rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3" style={{ borderColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : toast.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)' }}>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : toast.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#f59e0b' }}>
              {toast.type === 'success' ? (
                <i class="fa-solid fa-circle-check text-base"></i>
              ) : toast.type === 'error' ? (
                <i class="fa-solid fa-triangle-exclamation text-base"></i>
              ) : (
                <i class="fa-solid fa-circle-info text-base"></i>
              )}
            </div>
            <p class="text-xs font-semibold text-gray-200 leading-snug">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} class="text-gray-400 hover:text-white transition shrink-0 cursor-pointer p-1">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>
      )}

      {/* BOTTOM MOBILE FOOTER NAVIGATION */}
      {user?.role === 'admin' && (
        <footer class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1a1c22]/95 border-t border-[#2d303b] py-1 px-2 flex justify-around items-center z-45 shadow-[0_-5px_25px_rgba(0,0,0,0.6)] backdrop-blur-lg">
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
      )}

    </div>
  );
}
