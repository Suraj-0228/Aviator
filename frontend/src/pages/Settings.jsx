import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Settings() {
  const navigate = useNavigate();
  const { updateProfile, deleteAccount } = useContext(AuthContext);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete account state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Success / Error messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setPasswordErrors({});

    let hasErrors = false;
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
      hasErrors = true;
    }
    if (!newPassword) {
      errors.newPassword = 'New password is required';
      hasErrors = true;
    } else if (newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
      hasErrors = true;
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (hasErrors) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordLoading(true);
    const res = await updateProfile(null, currentPassword, newPassword);
    setPasswordLoading(false);
    
    if (res.success) {
      setSuccessMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMsg('');
        navigate('/profile');
      }, 2000);
    } else {
      setErrorMsg(res.error || 'Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const res = await deleteAccount();
    setDeleteLoading(false);
    if (res.success) {
      setSuccessMsg('Account deleted successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        navigate('/login');
      }, 2000);
    } else {
      setErrorMsg(res.error || 'Failed to delete account');
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div class="min-h-screen bg-[#131418] text-white flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#2d303b]/50 pb-10 select-none">
      
      {/* Toast Notification */}
      {successMsg && (
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-full shadow-lg text-center whitespace-nowrap animate-bounce">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-full shadow-lg text-center whitespace-nowrap animate-bounce">
          {errorMsg}
        </div>
      )}

      {/* HEADER */}
      <header class="bg-[#1a1c22] px-4 py-4 flex items-center justify-between border-b border-[#2d303b] sticky top-0 z-30">
        <button onClick={() => navigate('/profile')} class="text-gray-400 hover:text-white transition cursor-pointer">
          <i class="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <span class="text-base font-bold text-white tracking-wider">Account Settings</span>
        <div class="w-6"></div>
      </header>

      {/* MAIN CONTAINER */}
      <main class="flex-grow overflow-y-auto no-scrollbar px-4 py-6 space-y-6">
        
        {/* EDIT PASSWORD CARD */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-5 shadow-lg space-y-4">
          <div class="flex items-center gap-2 border-b border-[#2d303b]/40 pb-3">
            <i class="fa-solid fa-lock text-red-500"></i>
            <h3 class="text-xs font-black uppercase tracking-wider text-white">Change Password</h3>
          </div>

          <form onSubmit={handlePasswordSubmit} class="space-y-4 text-xs">
            <div class="space-y-1">
              <label class="text-gray-400 font-semibold block uppercase tracking-wide">Current Password</label>
              <div class="relative">
                <input 
                  type={showCurrentPassword ? "text" : "password"} 
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  class="w-full bg-[#131418] border border-[#2d303b] focus:border-red-500/50 rounded-xl pl-3.5 pr-10 py-2.5 text-white focus:outline-none transition shadow-inner font-mono-val"
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer">
                  <i class={`fa-solid ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {passwordErrors.currentPassword && <span class="text-rose-500 font-bold mt-1 block">{passwordErrors.currentPassword}</span>}
            </div>

            <div class="space-y-1">
              <label class="text-gray-400 font-semibold block uppercase tracking-wide">New Password</label>
              <div class="relative">
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  class="w-full bg-[#131418] border border-[#2d303b] focus:border-red-500/50 rounded-xl pl-3.5 pr-10 py-2.5 text-white focus:outline-none transition shadow-inner font-mono-val"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer">
                  <i class={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {passwordErrors.newPassword && <span class="text-rose-500 font-bold mt-1 block">{passwordErrors.newPassword}</span>}
            </div>

            <div class="space-y-1">
              <label class="text-gray-400 font-semibold block uppercase tracking-wide">Confirm New Password</label>
              <div class="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  class="w-full bg-[#131418] border border-[#2d303b] focus:border-red-500/50 rounded-xl pl-3.5 pr-10 py-2.5 text-white focus:outline-none transition shadow-inner font-mono-val"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer">
                  <i class={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {passwordErrors.confirmPassword && <span class="text-rose-500 font-bold mt-1 block">{passwordErrors.confirmPassword}</span>}
            </div>

            <button 
              type="submit" 
              disabled={passwordLoading}
              class="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 cursor-pointer mt-4 flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-98"
            >
              {passwordLoading ? <i class="fa-solid fa-spinner animate-spin"></i> : 'Change Password'}
            </button>
          </form>
        </section>

        {/* DELETE ACCOUNT CARD */}
        <section class="bg-[#1a1c22] border border-[#2d303b] rounded-2xl p-5 shadow-lg space-y-4">
          <div class="flex items-center gap-2 border-b border-[#2d303b]/40 pb-3">
            <i class="fa-solid fa-user-minus text-rose-500"></i>
            <h3 class="text-xs font-black uppercase tracking-wider text-rose-500">Danger Zone</h3>
          </div>

          <div class="space-y-3.5 text-xs">
            <p class="text-gray-400 leading-relaxed">
              Once you delete your account, there is no going back. All of your simulated game history, transaction history, and wallet balance will be permanently wiped out.
            </p>

            <button 
              onClick={() => setDeleteConfirmOpen(true)}
              class="w-full border border-rose-500/30 hover:bg-rose-500/5 text-rose-400 font-black py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-sm active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <i class="fa-solid fa-trash-can text-sm"></i> Delete Account
            </button>
          </div>
        </section>

      </main>

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmOpen && (
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-[#1a1c22] border border-[#2d303b] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-dropdown-in p-6 text-center space-y-4">
            <i class="fa-solid fa-triangle-exclamation text-5xl text-rose-500 block animate-pulse"></i>
            <div class="space-y-1">
              <h4 class="text-sm font-bold text-white uppercase">Irreversible Action</h4>
              <p class="text-xs text-gray-400 leading-relaxed">Are you absolutely sure you want to delete your account? This will permanently erase your pilot identity and balance details.</p>
            </div>
            <div class="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmOpen(false)} 
                disabled={deleteLoading}
                class="flex-1 bg-[#131418] hover:bg-[#22242b] border border-[#2d303b] text-gray-300 font-bold py-3 rounded-xl transition text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                class="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deleteLoading ? <i class="fa-solid fa-spinner animate-spin"></i> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer class="text-center py-4 text-[10px] text-gray-600 font-semibold border-t border-[#2d303b]/40">
        &copy; 2026 BDG Pilot Engine. All Rights Reserved.
      </footer>
    </div>
  );
}
