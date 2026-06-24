import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Withdraw() {
  const { user, syncBalances } = useContext(AuthContext);
  const navigate = useNavigate();

  const [amount, setAmount] = useState('500'); // Default ₹500
  const [method, setMethod] = useState('UPI'); // UPI, Bank Transfer
  
  // UPI payout states
  const [upiName, setUpiName] = useState('');
  const [upiId, setUpiId] = useState('');

  // Bank Transfer payout states
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');

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
    if (user) {
      if (!upiName) setUpiName(user.username || 'Suraj Manani');
      if (!upiId) setUpiId(`${user.username?.toLowerCase() || 'suraj'}@demobank`);
      if (!bankHolderName) setBankHolderName(user.username || 'Suraj Manani');
      if (!bankName) setBankName('Virtual Demo Bank');
      if (!accountNo) setAccountNo('123456782828');
      if (!ifscCode) setIfscCode('VDBK0002828');
    }
  }, [user]);

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

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/wallet/transactions');
      if (res.data.success) {
        const withdrawals = res.data.transactions.filter(t => t.type === 'withdrawal');
        setHistory(withdrawals);
      }
    } catch (err) {
      console.warn('Error fetching transactions:', err.message);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setLoading(true);

    const val = parseFloat(amount);
    if (isNaN(val) || val < 500 || val > 50000) {
      setErrorMsg('Please enter an amount between ₹500.00 and ₹50,000.00');
      setLoading(false);
      return;
    }

    let finalDest = '';
    if (method === 'Bank Transfer') {
      if (!bankHolderName.trim() || !bankName.trim() || !accountNo.trim() || !ifscCode.trim()) {
        setErrorMsg('Please enter all Bank Transfer details');
        setLoading(false);
        return;
      }
      finalDest = `Holder: ${bankHolderName.trim()} | Bank: ${bankName.trim()} | Acct: ${accountNo.trim()} | IFSC: ${ifscCode.trim()}`;
    } else {
      if (!upiName.trim() || !upiId.trim()) {
        setErrorMsg('Please enter your UPI Name and UPI ID');
        setLoading(false);
        return;
      }
      finalDest = `Holder: ${upiName.trim()} | UPI: ${upiId.trim()}`;
    }

    if (user.balance < val) {
      setErrorMsg('Insufficient wallet balance!');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('/wallet/withdraw', {
        amount: val,
        method,
        destination: finalDest
      });

      if (res.data.success) {
        syncBalances(res.data.newBalance, user.bankBalance);
        setSuccessMsg(`Withdrawal request of ₹${val.toLocaleString('en-IN')} submitted! Pending approval.`);
        setAmount('500');
        setUpiName('');
        setUpiId('');
        setBankHolderName('');
        setBankName('');
        setAccountNo('');
        setIfscCode('');
        fetchTransactions();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Withdrawal failed');
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
    { display: '₹ 500', value: '500' },
    { display: '₹ 1K', value: '1000' },
    { display: '₹ 2K', value: '2000' },
    { display: '₹ 5K', value: '5000' },
    { display: '₹ 10K', value: '10000' },
    { display: '₹ 15K', value: '15000' },
    { display: '₹ 20K', value: '20000' },
    { display: '₹ 30K', value: '30000' },
    { display: '₹ 50K', value: '50000' }
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
        <span class="text-base font-bold text-white tracking-wider">Withdrawal</span>
        <button onClick={scrollToHistory} class="text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer">
          Withdrawal history
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

        {/* 3. WITHDRAW METHODS GRID */}
        <section class="grid grid-cols-2 gap-3">
          {[
            { id: 'UPI', name: 'UPI Payout', icon: 'fa-qrcode', color: 'text-rose-500' },
            { id: 'Bank Transfer', name: 'Bank Account', icon: 'fa-building-columns', color: 'text-[#fb7185]' }
          ].map(m => {
            const isSelected = method === m.id;
            return (
              <button 
                key={m.id}
                onClick={() => setMethod(m.id)}
                class={`p-4 border rounded-xl font-bold cursor-pointer transition flex flex-col items-center justify-center gap-2 relative h-20 ${
                  isSelected 
                    ? 'bg-red-500/10 border-red-500 text-red-500 shadow-md shadow-red-500/5' 
                    : 'bg-[#1a1c22] border-[#2d303b] text-gray-400 hover:text-white'
                }`}
              >
                <i class={`fa-solid ${m.icon} ${isSelected ? 'text-red-500' : m.color} text-xl`}></i>
                <span class="text-xs truncate max-w-full text-center">{m.name}</span>
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
            <span class="text-xs font-black uppercase tracking-wider">{method === 'UPI' ? 'UPI Cashout' : 'Bank Transfer Cashout'}</span>
            <span class="text-[10px] font-bold mt-1 opacity-90">Limit: ₹500 - ₹50,000</span>
          </div>
        </section>

        {/* 5. WITHDRAW ACTION LINE */}
        <div class="flex items-center justify-between bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg">
          <div class="flex flex-col">
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Withdrawal Method:</span>
            <span class="text-sm font-black text-white">{method}</span>
          </div>
          <button 
            onClick={handleWithdraw} 
            disabled={loading}
            class="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black px-6 py-2.5 rounded-lg transition active:scale-95 shadow-md shadow-red-600/10 cursor-pointer uppercase flex items-center justify-center min-w-[90px]"
          >
            {loading ? <i class="fa-solid fa-spinner animate-spin"></i> : 'Withdraw'}
          </button>
        </div>

        {/* 6. WITHDRAW AMOUNT BLOCK */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg space-y-4">
          <div class="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-[#2d303b] pb-2.5">
            <i class="fa-solid fa-money-bill-transfer text-red-500"></i>
            <span>Withdrawal amount</span>
          </div>

          <div class="space-y-4">
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
                  placeholder="₹500.00 - ₹50,000.00"
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

            {/* Payout details input fields */}
            <div class="space-y-3 pt-2 border-t border-[#2d303b]/40">
              <span class="text-[10px] text-red-500 font-black uppercase tracking-wider block">Payout Details</span>
              {method === 'UPI' ? (
                <div class="space-y-2">
                  <div class="relative bg-[#131418] border border-[#2d303b] rounded-xl px-4 py-3 shadow-inner flex items-center gap-2.5">
                    <i class="fa-solid fa-user text-gray-500 text-sm"></i>
                    <input 
                      type="text" 
                      value={upiName}
                      onChange={e => setUpiName(e.target.value)}
                      placeholder="Account Holder Name"
                      required
                      class="w-full bg-transparent text-white text-xs font-medium focus:outline-none placeholder-gray-600"
                    />
                  </div>
                  <div class="relative bg-[#131418] border border-[#2d303b] rounded-xl px-4 py-3 shadow-inner flex items-center gap-2.5">
                    <i class="fa-solid fa-at text-gray-500 text-sm"></i>
                    <input 
                      type="text" 
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="UPI ID (e.g. name@okhdfc)"
                      required
                      class="w-full bg-transparent text-white text-xs font-medium focus:outline-none placeholder-gray-600"
                    />
                  </div>
                </div>
              ) : (
                <div class="space-y-2">
                  <div class="relative bg-[#131418] border border-[#2d303b] rounded-xl px-4 py-3 shadow-inner flex items-center gap-2.5">
                    <i class="fa-solid fa-user text-gray-500 text-sm"></i>
                    <input 
                      type="text" 
                      value={bankHolderName}
                      onChange={e => setBankHolderName(e.target.value)}
                      placeholder="Account Holder Name"
                      required
                      class="w-full bg-transparent text-white text-xs font-medium focus:outline-none placeholder-gray-600"
                    />
                  </div>
                  <div class="relative bg-[#131418] border border-[#2d303b] rounded-xl px-4 py-3 shadow-inner flex items-center gap-2.5">
                    <i class="fa-solid fa-building text-gray-500 text-sm"></i>
                    <input 
                      type="text" 
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="Bank Name (e.g. SBI, HDFC)"
                      required
                      class="w-full bg-transparent text-white text-xs font-medium focus:outline-none placeholder-gray-600"
                    />
                  </div>
                  <div class="relative bg-[#131418] border border-[#2d303b] rounded-xl px-4 py-3 shadow-inner flex items-center gap-2.5">
                    <i class="fa-solid fa-hashtag text-gray-500 text-sm"></i>
                    <input 
                      type="text" 
                      value={accountNo}
                      onChange={e => setAccountNo(e.target.value)}
                      placeholder="Bank Account Number"
                      required
                      class="w-full bg-transparent text-white text-xs font-medium focus:outline-none placeholder-gray-600"
                    />
                  </div>
                  <div class="relative bg-[#131418] border border-[#2d303b] rounded-xl px-4 py-3 shadow-inner flex items-center gap-2.5">
                    <i class="fa-solid fa-landmark-flag text-gray-500 text-sm"></i>
                    <input 
                      type="text" 
                      value={ifscCode}
                      onChange={e => setIfscCode(e.target.value)}
                      placeholder="Bank IFSC Code"
                      required
                      class="w-full bg-transparent text-white text-xs font-medium focus:outline-none placeholder-gray-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 7. WITHDRAWAL INSTRUCTIONS */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <i class="fa-solid fa-file-invoice text-red-500"></i>
            <span>Withdrawal instructions</span>
          </div>
          <div class="bg-[#131418]/60 border border-[#2d303b] p-4 rounded-xl text-xs text-gray-400 space-y-2.5 leading-relaxed">
            <p class="flex items-start gap-2">
              <i class="fa-solid fa-diamond text-red-500 text-[8px] mt-1 shrink-0"></i>
              <span>Please ensure your UPI ID or Bank account details are correct. Incorrect info may lead to failed transactions.</span>
            </p>
            <p class="flex items-start gap-2">
              <i class="fa-solid fa-diamond text-red-500 text-[8px] mt-1 shrink-0"></i>
              <span>Double-check the IFSC code before submitting a bank transfer withdrawal request.</span>
            </p>
            <p class="flex items-start gap-2">
              <i class="fa-solid fa-diamond text-red-500 text-[8px] mt-1 shrink-0"></i>
              <span>The minimum withdrawal amount is ₹500.00.</span>
            </p>
            <p class="flex items-start gap-2">
              <i class="fa-solid fa-diamond text-red-500 text-[8px] mt-1 shrink-0"></i>
              <span>Withdrawal requests are processed by the admin and may take up to 24 hours.</span>
            </p>
          </div>
        </section>

        {/* 8. WITHDRAWAL HISTORY CARDS */}
        <section ref={historyRef} class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg space-y-4">
          <div class="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <i class="fa-solid fa-clock-rotate-left text-red-500"></i>
            <span>Withdrawal history</span>
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
              history.map((t, idx) => {
                let statusColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                if (t.status === 'completed') statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                if (t.status === 'rejected') statusColor = 'bg-rose-500/10 text-rose-400 border-rose-550/20';
                
                return (
                  <div key={idx} class="bg-[#131418] border border-[#2d303b] rounded-xl p-3.5 text-xs flex justify-between items-center shadow-inner">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-white font-bold uppercase">{t.paymentGateway} Payout</span>
                      <span class="text-gray-550 text-[10px]">{new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span class="text-gray-400 text-[9px] truncate max-w-[200px] mt-0.5">{t.destination}</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="text-rose-400 font-mono-val font-black text-sm">-₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span class={`border px-2 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-wider ${statusColor}`}>{t.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
