import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Deposit() {
  const { user, syncBalances } = useContext(AuthContext);
  const navigate = useNavigate();

  const [amount, setAmount] = useState('500'); // Default ₹500
  const [method, setMethod] = useState('UPI-QR'); // UPI-QR, UPI-QRpay, Wake UP-APP, USDT, ARPay
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);

  const historyRef = useRef(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

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
        syncBalance(res.data.user.balance);
      }
    } catch (e) {
      console.warn('Failed to refresh balance:', e.message);
    } finally {
      setTimeout(() => setBalanceRefreshing(false), 500);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/wallet/transactions');
      if (res.data.success) {
        const deposits = res.data.transactions.filter(t => t.type === 'deposit');
        setHistory(deposits);
      }
    } catch (err) {
      console.warn('Error fetching transactions:', err.message);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setLoading(true);

    const val = parseFloat(amount);
    if (isNaN(val) || val < 100 || val > 50000) {
      setErrorMsg('Please enter an amount between ₹100.00 and ₹50,000.00');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('/wallet/deposit', {
        amount: val,
        method
      });

      if (res.data.success) {
        syncBalances(res.data.newBalance, res.data.newBankBalance);
        setSuccessMsg(`Transfer of ₹${val.toLocaleString('en-IN')} from bank to wallet successful!`);
        setAmount('500');
        fetchTransactions();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const scrollToHistory = () => {
    if (historyRef.current) {
      historyRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const presets = [
    { display: '₹ 100', value: '100' },
    { display: '₹ 200', value: '200' },
    { display: '₹ 300', value: '300' },
    { display: '₹ 400', value: '400' },
    { display: '₹ 500', value: '500' },
    { display: '₹ 1K', value: '1000' },
    { display: '₹ 1.1K', value: '1100' },
    { display: '₹ 2K', value: '2000' },
    { display: '₹ 5K', value: '5000' }
  ];

  return (
    <div class="min-h-screen bg-[#131418] text-white flex flex-col justify-start max-w-md mx-auto shadow-2xl relative border-x border-[#2d303b]/50 pb-10 select-none">
      
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

      {/* 1. HEADER */}
      <header class="bg-[#1a1c22] px-4 py-4 flex items-center justify-between border-b border-[#2d303b] sticky top-0 z-30">
        <button onClick={() => navigate('/profile')} class="text-gray-400 hover:text-white transition cursor-pointer">
          <i class="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <span class="text-base font-bold text-white tracking-wider">Deposit</span>
        <button onClick={scrollToHistory} class="text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer">
          Deposit history
        </button>
      </header>

      {/* Main Body */}
      <div class="px-4 py-4 space-y-4 overflow-y-auto no-scrollbar">

        {/* 2. RED BALANCE CARD */}
        <section class="bg-gradient-to-tr from-[#881337] via-[#e11d48] to-[#fb7185] rounded-2xl p-5 shadow-xl relative overflow-hidden text-white flex flex-col gap-3">
          <div class="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-[20px] pointer-events-none"></div>
          
          <div class="grid grid-cols-2 gap-4 divide-x divide-white/10">
            {/* Wallet Balance */}
            <div class="space-y-1">
              <span class="text-[10px] uppercase font-extrabold opacity-80 tracking-wider block"><i class="fa-solid fa-wallet mr-1"></i> Cockpit Wallet</span>
              <div class="flex items-center gap-1.5">
                <span class="text-xl font-mono-val font-black">₹{user?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                <button onClick={handleRefreshBalance} class="text-white/70 hover:text-white transition cursor-pointer p-0.5">
                  <i class={`fa-solid fa-rotate text-xs ${balanceRefreshing ? 'animate-spin' : ''}`}></i>
                </button>
              </div>
            </div>
            
            {/* Virtual Bank Balance */}
            <div class="space-y-1 pl-4">
              <span class="text-[10px] uppercase font-extrabold opacity-80 tracking-wider block"><i class="fa-solid fa-building-columns mr-1"></i> Bank Account</span>
              <span class="text-xl font-mono-val font-black block text-amber-200">₹{(user?.bankBalance ?? 100000.00).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div class="flex justify-between items-center opacity-85 mt-1 border-t border-white/5 pt-2">
            <i class="fa-solid fa-microchip text-xl"></i>
            <span class="font-mono-val text-xs tracking-widest">Suraj Manani | **** 2828</span>
          </div>
        </section>

        {/* 3. RECHARGE METHODS GRID */}
        <section class="grid grid-cols-4 gap-2">
          {[
            { id: 'UPI-QR', name: 'UPI-QR', icon: 'fa-qrcode', color: 'text-rose-500' },
            { id: 'UPI-QRpay', name: 'UPI-QRpay', icon: 'fa-qrcode', color: 'text-[#e11d48]' },
            { id: 'Wake UP-APP', name: 'Wake UP-APP', icon: 'fa-mobile-screen-button', color: 'text-[#fb7185]' },
            { id: 'USDT', name: 'USDT', icon: 'fa-coins', color: 'text-emerald-400', promo: '+4%' },
            { id: 'ARPay', name: 'ARPay', icon: 'fa-triangle-exclamation', color: 'text-rose-500', promo: '+1%' }
          ].map(m => {
            const isSelected = method === m.id;
            return (
              <button 
                key={m.id}
                onClick={() => setMethod(m.id)}
                class={`p-3 border rounded-xl font-bold cursor-pointer transition flex flex-col items-center justify-center gap-2 relative h-20 ${
                  isSelected 
                    ? 'bg-red-500/10 border-red-500 text-red-500 shadow-md shadow-red-500/5' 
                    : 'bg-[#1a1c22] border-[#2d303b] text-gray-400 hover:text-white'
                }`}
              >
                {m.promo && (
                  <span class="absolute -top-1.5 -right-1 bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5 z-10">
                    <i class="fa-solid fa-gift text-[6px]"></i>
                    <span>{m.promo}</span>
                  </span>
                )}
                {m.id === 'ARPay' ? (
                  <div class={`flex items-center justify-center font-black text-xl italic leading-none ${isSelected ? 'text-red-500' : 'text-rose-500'}`}>
                    A
                  </div>
                ) : (
                  <i class={`fa-solid ${m.icon} ${isSelected ? 'text-red-500' : m.color} text-lg`}></i>
                )}
                <span class="text-[9px] truncate max-w-full text-center">{m.name}</span>
              </button>
            );
          })}
        </section>

        {/* 4. SELECT CHANNEL */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <i class="fa-solid fa-credit-card text-red-500"></i>
            <span>Select channel</span>
          </div>
          <div class="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl p-3.5 flex flex-col shadow-inner">
            <span class="text-xs font-black uppercase tracking-wider">{method}</span>
            <span class="text-[10px] font-bold mt-1 opacity-90">Limit: ₹100 - ₹{(user?.bankBalance ?? 100000.00).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </section>

        {/* 5. DEPOSIT ACTION LINE */}
        <div class="flex items-center justify-between bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg">
          <div class="flex flex-col">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Recharge Method:</span>
            <span class="text-sm font-black text-white">{method}</span>
          </div>
          <button 
            onClick={handleDeposit} 
            disabled={loading}
            class="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black px-6 py-2.5 rounded-lg transition active:scale-95 shadow-md shadow-red-600/10 cursor-pointer uppercase flex items-center justify-center min-w-[90px]"
          >
            {loading ? <i class="fa-solid fa-spinner animate-spin"></i> : 'Deposit'}
          </button>
        </div>

        {/* 6. DEPOSIT AMOUNT BLOCK */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg space-y-4">
          <div class="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-[#2d303b] pb-2.5">
            <i class="fa-solid fa-money-bill-transfer text-red-500"></i>
            <span>Deposit amount</span>
          </div>

          <div class="space-y-3">
            {/* Quick preset grid */}
            <div class="grid grid-cols-3 gap-2">
              {presets.map(p => (
                <button 
                  type="button" 
                  key={p.value} 
                  onClick={() => setAmount(p.value)}
                  class={`py-2 px-3 border rounded-lg font-bold transition text-sm cursor-pointer ${
                    amount === p.value 
                      ? 'bg-red-500/10 border-red-500 text-red-400 shadow-inner' 
                      : 'bg-[#131418] border-[#2d303b] text-gray-300 hover:bg-[#22242b]'
                  }`}
                >
                  {p.display}
                </button>
              ))}
            </div>

            {/* Custom amount bar */}
            <div class="relative bg-[#131418] border border-[#2d303b] rounded-xl px-4 py-3.5 shadow-inner flex items-center justify-between">
              <div class="flex items-center gap-2 flex-grow mr-2">
                <span class="text-red-500 font-bold text-base">₹</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="₹100.00 - ₹50,000.00"
                  required
                  class="w-full bg-transparent text-white text-sm font-bold focus:outline-none placeholder-gray-600"
                />
              </div>
              {amount && (
                <button onClick={() => setAmount('')} class="text-gray-500 hover:text-white transition cursor-pointer">
                  <i class="fa-solid fa-circle-xmark text-sm"></i>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 7. RECHARGE INSTRUCTIONS */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <i class="fa-solid fa-file-invoice text-red-500"></i>
            <span>Recharge instructions</span>
          </div>
          <div class="bg-[#131418]/60 border border-[#2d303b] p-4 rounded-xl text-xs text-gray-400 space-y-2.5 leading-relaxed">
            <p class="flex items-start gap-2">
              <i class="fa-solid fa-diamond text-red-500 text-[8px] mt-1 shrink-0"></i>
              <span>If the transfer time is up, please fill out the deposit form again.</span>
            </p>
            <p class="flex items-start gap-2">
              <i class="fa-solid fa-diamond text-red-500 text-[8px] mt-1 shrink-0"></i>
              <span>The transfer amount must match the order you created, otherwise the money cannot be credited successfully.</span>
            </p>
            <p class="flex items-start gap-2">
              <i class="fa-solid fa-diamond text-red-500 text-[8px] mt-1 shrink-0"></i>
              <span>If you transfer the wrong amount, our company will not be responsible for the lost amount!</span>
            </p>
            <p class="flex items-start gap-2">
              <i class="fa-solid fa-diamond text-red-500 text-[8px] mt-1 shrink-0"></i>
              <span>Note: do not cancel the deposit order after the money has been transferred.</span>
            </p>
          </div>
        </section>

        {/* 8. DEPOSIT HISTORY CARDS */}
        <section ref={historyRef} class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg space-y-4">
          <div class="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <i class="fa-solid fa-clock-rotate-left text-red-500"></i>
            <span>Deposit history</span>
          </div>
          
          <div class="space-y-2.5 max-h-[300px] overflow-y-auto no-scrollbar pr-0.5">
            {history.length === 0 ? (
              <div class="text-center text-gray-500 text-xs py-10 flex flex-col items-center justify-center gap-3">
                {/* 3D-like receipt scroll vector */}
                <svg class="w-20 h-20 opacity-30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M25 80V20C25 17.2386 27.2386 15 30 15H70C72.7614 15 75 17.2386 75 20V80C75 82.7614 72.7614 85 70 85H30C27.2386 85 25 82.7614 25 80Z" fill="#131418" stroke="#2d303b" stroke-width="2.5"/>
                  <path d="M30 80L35 85L40 80L45 85L50 80L55 85L60 80L65 85L70 80" stroke="#2d303b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M30 20L35 15L40 20L45 15L50 20L55 15L60 20L65 15L70 20" stroke="#2d303b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="38" y1="32" x2="62" y2="32" stroke="#2d303b" stroke-width="3" stroke-linecap="round"/>
                  <line x1="38" y1="44" x2="52" y2="44" stroke="#2d303b" stroke-width="3" stroke-linecap="round"/>
                  <line x1="38" y1="56" x2="58" y2="56" stroke="#2d303b" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="62" cy="56" r="4" fill="#ef4444" opacity="0.6"/>
                </svg>
                <span class="text-xs text-gray-500 font-bold mt-1">No data</span>
              </div>
            ) : (
              history.map((t, idx) => (
                <div key={idx} class="bg-[#131418] border border-[#2d303b] rounded-xl p-3.5 text-xs flex justify-between items-center shadow-inner">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-white font-bold uppercase">{t.paymentGateway} Deposit</span>
                    <span class="text-gray-550 text-[10px]">{new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-emerald-450 font-mono-val font-black text-sm">+₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-wider">SUCCESS</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
