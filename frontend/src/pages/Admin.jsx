import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Admin() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingUserId, setEditingUserId] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState(location.state?.activeView || 'stats'); // stats, cashouts, users, profile
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/play');
    }
  }, [user]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Update activeView when location state changes
  useEffect(() => {
    if (location.state?.activeView) {
      setActiveView(location.state.activeView);
    }
  }, [location.state]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 1000);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await axios.get('/admin/stats');
      const usersRes = await axios.get('/admin/users');
      const withdrawsRes = await axios.get('/admin/withdrawals');
      
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (withdrawsRes.data.success) setWithdrawals(withdrawsRes.data.withdrawals);
    } catch(err) {
      console.error('Error fetching admin data:', err);
      showToast('Error loading server stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (userId) => {
    const val = parseFloat(newBalance);
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid balance!', 'error');
      return;
    }

    try {
      const res = await axios.post(`/admin/users/${userId}/balance`, {
        amount: val
      });
      if (res.data.success) {
        showToast('User balance updated successfully!', 'success');
        setEditingUserId(null);
        setNewBalance('');
        fetchAdminData();
      }
    } catch(err) {
      showToast('Failed to update user balance', 'error');
    }
  };

  const handleApproveWithdrawal = async (id) => {
    try {
      const res = await axios.post(`/admin/withdrawals/${id}/approve`);
      if (res.data.success) {
        showToast('Withdrawal request approved successfully!', 'success');
        fetchAdminData();
      }
    } catch (err) {
      showToast('Approval failed', 'error');
    }
  };

  const handleRejectWithdrawal = async (id) => {
    try {
      const res = await axios.post(`/admin/withdrawals/${id}/reject`);
      if (res.data.success) {
        showToast('Withdrawal rejected; funds refunded to player wallet!', 'success');
        fetchAdminData();
      }
    } catch (err) {
      showToast('Rejection failed', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'stats':
        return 'Admin Dashboard';
      case 'cashouts':
        return 'Cashout Requests';
      case 'users':
        return 'Manage Users';
      case 'profile':
        return 'Admin Profile';
      default:
        return 'Admin Control';
    }
  };

  if (loading) {
    return (
      <div class="min-h-screen bg-[#131418] flex items-center justify-center text-white">
        <div class="text-center space-y-3">
          <div class="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-gray-400 text-xs font-bold uppercase tracking-wider">Synchronizing Station...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="w-full h-screen bg-[#131418] text-white flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#2d303b]/50 select-none overflow-hidden">
      
      {/* Toast Notification */}
      {toast && (
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white font-bold text-xs uppercase px-5 py-3 rounded-full shadow-lg text-center whitespace-nowrap animate-bounce" style={{ backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444' }}>
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <header class="bg-[#1a1c22] px-4 py-4 flex items-center justify-between border-b border-[#2d303b] sticky top-0 z-30">
        <button onClick={() => navigate('/profile')} class="text-gray-400 hover:text-white transition cursor-pointer">
          <i class="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <span class="text-base font-bold text-white tracking-wider">{getHeaderTitle()}</span>
        <button onClick={fetchAdminData} class="text-gray-400 hover:text-white transition cursor-pointer p-0.5">
          <i class="fa-solid fa-rotate text-sm"></i>
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <main class="flex-grow overflow-y-auto no-scrollbar px-4 py-4 pb-28 space-y-5">
        
        {/* VIEW 1: STATS DASHBOARD */}
        {activeView === 'stats' && (
          <div class="space-y-5">
            {/* STATS 2x2 GRID */}
            {stats && (
              <section class="grid grid-cols-2 gap-3">
                {/* Stat Card 1 */}
                <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg flex flex-col gap-1 relative overflow-hidden">
                  <span class="text-gray-550 uppercase font-black tracking-wider text-[8px] pl-1 pt-1">Registered Pilots</span>
                  <span class="text-white font-mono-val font-black text-lg pl-1 pb-1">{stats.totalUsers}</span>
                </div>

                {/* Stat Card 2 */}
                <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg flex flex-col gap-1 relative overflow-hidden">
                  <span class="text-gray-550 uppercase font-black tracking-wider text-[8px] pl-1 pt-1">Total Deposits</span>
                  <span class="text-emerald-400 font-mono-val font-black text-lg pl-1 pb-1">₹{stats.totalDeposits.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>

                {/* Stat Card 3 */}
                <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg flex flex-col gap-1 relative overflow-hidden">
                  <span class="text-gray-550 uppercase font-black tracking-wider text-[8px] pl-1 pt-1">Approved Cashouts</span>
                  <span class="text-rose-400 font-mono-val font-black text-lg pl-1 pb-1">₹{stats.totalWithdrawals.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>

                {/* Stat Card 4 */}
                <div class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4 shadow-lg flex flex-col gap-1 relative overflow-hidden">
                  <span class="text-gray-555 uppercase font-black tracking-wider text-[8px] pl-1 pt-1">House Margin</span>
                  <span class={`font-mono-val font-black text-lg pl-1 pb-1 ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                    ₹{stats.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </section>
            )}

            {/* Quick Status Info */}
            <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-5 shadow-lg space-y-3.5 text-xs">
              <h4 class="text-xs font-black uppercase text-white tracking-wide border-b border-[#2d303b]/40 pb-2">
                <i class="fa-solid fa-server text-red-500 mr-1.5"></i> Control Cabin Status
              </h4>
              <div class="space-y-2 text-gray-400">
                <div class="flex justify-between">
                  <span>Server Loop:</span>
                  <span class="text-emerald-400 font-bold">ACTIVE (Millisecond Loop)</span>
                </div>
                <div class="flex justify-between">
                  <span>Database Link:</span>
                  <span class="text-emerald-400 font-bold">CONNECTED</span>
                </div>
                <div class="flex justify-between">
                  <span>Pending Tasks:</span>
                  <span class="text-red-400 font-bold font-mono-val">{withdrawals.length} cashouts</span>
                </div>
                <div class="flex justify-between">
                  <span>System Uptime:</span>
                  <span class="text-gray-300 font-bold">99.98% (Stable)</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: CASHOUT REQUESTS */}
        {activeView === 'cashouts' && (
          <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg space-y-4">
            <div class="flex items-center justify-between border-b border-[#2d303b]/40 pb-2.5">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-receipt text-red-500"></i>
                <h3 class="text-xs font-black uppercase tracking-wider text-white">Pending Cashouts</h3>
              </div>
              <span class="text-[9px] bg-red-600/10 text-red-500 border border-red-500/10 px-2 py-0.5 rounded-full font-mono-val font-bold">{withdrawals.length} left</span>
            </div>

            <div class="space-y-3.5">
              {withdrawals.length === 0 ? (
                <div class="text-center text-gray-500 text-xs py-16">
                  <i class="fa-solid fa-circle-check text-4xl text-gray-700 block mb-2"></i>
                  All cashout requests cleared.
                </div>
              ) : (
                withdrawals.map((w, idx) => (
                  <div key={idx} class="bg-[#131418] border border-[#2d303b] p-3.5 rounded-xl text-xs space-y-3 shadow-inner">
                    <div class="flex justify-between items-start">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 font-black shrink-0">
                          {w.userId?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex flex-col min-w-0">
                          <span class="text-white font-bold text-[11px] truncate">{w.userId?.username}</span>
                          <span class="text-gray-500 text-[9px] truncate">{w.userId?.email}</span>
                        </div>
                      </div>
                      <span class="text-rose-450 font-mono-val font-black text-xs shrink-0">₹{w.amount.toLocaleString('en-IN')}</span>
                    </div>

                    <div class="bg-[#1a1c22] p-2.5 rounded-lg border border-[#2d303b]/80 font-mono-val text-[9px] text-gray-400 break-all leading-normal select-text">
                      <span class="text-gray-500 block uppercase font-black text-[7px] mb-1 tracking-wider">Payment Details</span>
                      {w.paymentDetails?.destination || 'N/A'}
                    </div>

                    <div class="flex gap-2">
                      <button 
                        onClick={() => handleApproveWithdrawal(w._id)}
                        class="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white font-black py-2 rounded-lg cursor-pointer transition text-[9px] uppercase shadow-md shadow-emerald-500/5 active:scale-98"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRejectWithdrawal(w._id)}
                        class="flex-1 bg-rose-950/15 hover:bg-rose-900/25 text-rose-400 font-bold py-2 rounded-lg cursor-pointer transition border border-rose-900/10 text-[9px] uppercase active:scale-98"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* VIEW 3: MANAGE USERS */}
        {activeView === 'users' && (
          <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg space-y-4">
            <div class="flex items-center justify-between border-b border-[#2d303b]/40 pb-2.5">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-users text-red-500"></i>
                <h3 class="text-xs font-black uppercase tracking-wider text-white">Player Ledger</h3>
              </div>
              <span class="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Total: {users.length}</span>
            </div>

            {/* Search Input Box */}
            <div class="relative bg-[#131418] border border-[#2d303b] rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-inner">
              <i class="fa-solid fa-magnifying-glass text-gray-500 text-xs"></i>
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search pilot username or email..."
                class="w-full bg-transparent text-white text-xs focus:outline-none placeholder-gray-600"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} class="text-gray-500 hover:text-white transition cursor-pointer">
                  <i class="fa-solid fa-xmark text-xs"></i>
                </button>
              )}
            </div>

            <div class="space-y-3.5">
              {filteredUsers.length === 0 ? (
                <div class="text-center text-gray-550 text-xs py-10">No users found.</div>
              ) : (
                filteredUsers.map(u => (
                  <div key={u._id} class="bg-[#131418] border border-[#2d303b] p-3.5 rounded-xl text-xs space-y-3 shadow-inner">
                    <div class="flex justify-between items-center gap-3">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-rose-600 border border-white/10 flex items-center justify-center text-white font-black shrink-0">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div class="flex flex-col min-w-0">
                          <div class="flex items-center gap-1.5 min-w-0">
                            <span class="text-white font-bold text-[11px] truncate">{u.username}</span>
                            {u.role === 'admin' && (
                              <span class="bg-purple-500/15 text-purple-400 border border-purple-500/10 text-[7px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase shrink-0">admin</span>
                            )}
                          </div>
                          <span class="text-gray-500 text-[9px] truncate">{u.email}</span>
                        </div>
                      </div>
                      
                      {/* Balance Display / Editor */}
                      <div class="shrink-0">
                        {editingUserId === u._id ? (
                          <div class="flex items-center gap-1 bg-[#1a1c22] border border-[#2d303b] rounded-lg px-1.5 py-1 shadow-inner max-w-[130px]">
                            <span class="text-gray-500 text-[9px]">₹</span>
                            <input 
                              type="number" 
                              value={newBalance} 
                              onChange={e => setNewBalance(e.target.value)} 
                              placeholder="0"
                              class="w-16 bg-transparent text-white font-mono-val font-bold focus:outline-none text-[10px]"
                            />
                            <button onClick={() => handleUpdateBalance(u._id)} class="text-emerald-500 hover:text-emerald-400 transition cursor-pointer px-0.5"><i class="fa-solid fa-check text-[9px]"></i></button>
                            <button onClick={() => setEditingUserId(null)} class="text-gray-500 hover:text-white transition cursor-pointer px-0.5"><i class="fa-solid fa-xmark text-[9px]"></i></button>
                          </div>
                        ) : (
                          <div class="flex flex-col items-end gap-1">
                            <div class="flex flex-col items-end text-right">
                              <span class="text-emerald-400 font-mono-val font-bold text-[10px]">Cockpit: ₹{u.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              <span class="text-amber-400 font-mono-val font-bold text-[10px]">Bank: ₹{(u.bankBalance ?? 100000.00).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <button 
                              onClick={() => { setEditingUserId(u._id); setNewBalance(u.balance.toFixed(2)); }}
                              class="bg-[#1a1c22] hover:bg-[#22242b] border border-[#2d303b] text-gray-400 hover:text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase transition cursor-pointer active:scale-95 mt-0.5"
                            >
                              <i class="fa-solid fa-pen-to-square text-[7px] mr-0.5"></i> Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* VIEW 4: ADMIN PROFILE */}
        {activeView === 'profile' && (
          <div class="space-y-5">
            {/* 1. TOP PROFILE HERO BANNER */}
            <section class="bg-gradient-to-br from-purple-550/20 via-purple-500/5 to-transparent border border-purple-500/20 rounded-2xl px-5 py-5 flex flex-col gap-4 relative overflow-hidden">
              <div class="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/10 rounded-full blur-[30px] pointer-events-none"></div>
              
              <div class="flex items-center gap-4.5">
                <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-650 to-indigo-650 border border-white/10 flex items-center justify-center text-white shadow-xl">
                  <i class="fa-solid fa-user-shield text-2xl"></i>
                </div>
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-black tracking-tight text-white">{user?.username}</span>
                    <span class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 shadow-sm shadow-purple-950/25">
                      <i class="fa-solid fa-user-shield text-[7px]"></i> Admin
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>UID | {user?._id?.substring(0, 8) || '7876928'}</span>
                  </div>
                  <span class="text-[10px] text-gray-550">Registered: {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </section>

            {/* Account Settings / Quick Navigation */}
            <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-4.5 shadow-lg space-y-3.5">
              <span class="text-xs font-black text-gray-500 uppercase tracking-widest block">System Options</span>
              
              <div class="grid grid-cols-3 gap-y-4 gap-x-1.5 text-center text-xs">
                <Link to="/settings" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition cursor-pointer">
                  <div class="w-8 h-8 rounded-full bg-[#131418] flex items-center justify-center text-red-500 shadow-inner">
                    <i class="fa-solid fa-gear"></i>
                  </div>
                  <span class="font-semibold text-[11px] truncate max-w-full">Security</span>
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
              </div>
            </section>

            {/* Logout trigger */}
            <button 
              onClick={() => setLogoutConfirmOpen(true)}
              class="w-full border border-rose-500/30 hover:bg-rose-500/5 text-rose-400 hover:text-rose-350 font-black py-3 rounded-xl transition cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm shadow-rose-950/20 active:scale-98"
            >
              <i class="fa-solid fa-power-off text-sm"></i> Log Out
            </button>
          </div>
        )}

      </main>

      {/* BOTTOM MOBILE FOOTER NAVIGATION */}
      <footer class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1a1c22]/95 border-t border-[#2d303b] py-1 px-2 flex justify-around items-center z-40 shadow-[0_-5px_25px_rgba(0,0,0,0.6)] backdrop-blur-lg">
        {/* Tab 1: Cockpit */}
        <Link to="/play" class="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white py-1 cursor-pointer transition">
          <i class="fa-solid fa-paper-plane text-base"></i>
          <span class="text-[9px] font-bold uppercase tracking-wider">Cockpit</span>
        </Link>

        {/* Tab 2: Dashboard */}
        <button onClick={() => setActiveView('stats')} class={`flex flex-col items-center gap-0.5 py-1 cursor-pointer transition ${activeView === 'stats' ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}>
          <i class="fa-solid fa-chart-pie text-base"></i>
          <span class="text-[9px] font-bold uppercase tracking-wider">Dashboard</span>
        </button>

        {/* Tab 3: Cashouts */}
        <button onClick={() => setActiveView('cashouts')} class={`flex flex-col items-center gap-0.5 py-1 cursor-pointer transition ${activeView === 'cashouts' ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}>
          <i class="fa-solid fa-money-bill-transfer text-base"></i>
          <span class="text-[9px] font-bold uppercase tracking-wider">Cashouts</span>
        </button>

        {/* Tab 4: Users */}
        <button onClick={() => setActiveView('users')} class={`flex flex-col items-center gap-0.5 py-1 cursor-pointer transition ${activeView === 'users' ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}>
          <i class="fa-solid fa-users-gear text-base"></i>
          <span class="text-[9px] font-bold uppercase tracking-wider">Users</span>
        </button>

        {/* Tab 5: Profile */}
        <button onClick={() => setActiveView('profile')} class={`flex flex-col items-center gap-0.5 py-1 cursor-pointer transition ${activeView === 'profile' ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}>
          <i class="fa-solid fa-user-shield text-base"></i>
          <span class="text-[9px] font-bold uppercase tracking-wider">Profile</span>
        </button>
      </footer>

      {/* LOGOUT CONFIRMATION MODAL */}
      {logoutConfirmOpen && (
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in p-6 text-center space-y-4">
            <i class="fa-solid fa-triangle-exclamation text-5xl text-red-500 block animate-pulse"></i>
            <div class="space-y-1">
              <h4 class="text-sm font-bold text-white uppercase">Exit Admin Control?</h4>
              <p class="text-xs text-gray-400">Are you sure you want to sign out of your administrator account?</p>
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

    </div>
  );
}
