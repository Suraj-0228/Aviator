import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password visibility triggers
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    let hasErrors = false;
    const errors = {};

    if (username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
      hasErrors = true;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      hasErrors = true;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    const result = await register(username, email, password);
    setLoading(false);
    
    if (result.success) {
      navigate('/login', { state: { registered: true } });
    } else {
      setError(result.error || 'Failed to register');
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-[#08080d] px-4 relative overflow-hidden">
      
      {/* Decorative background glows */}
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="w-full max-w-md bg-[#111219]/90 border border-white/5 rounded-3xl p-8 shadow-2xl backdrop-blur-md z-10">
        <div class="text-center mb-8">
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-fuchsia-600 font-black italic text-4xl tracking-wider select-none uppercase block mb-2">
            <i class="fa-solid fa-paper-plane mr-2 text-rose-500"></i>Aviator
          </span>
          <p class="text-gray-400 text-xs font-semibold">Join the cockpit and track high multiplier wagers</p>
        </div>

        {error && (
          <div class="bg-rose-500/10 border border-rose-500/30 text-red-500 text-xs rounded-xl p-3.5 mb-6 flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-4.5 text-xs">
          
          {/* USERNAME */}
          <div class="space-y-1.5">
            <label class="text-gray-400 font-semibold block uppercase tracking-wide text-4xs">Choose Username</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500"><i class="fa-solid fa-user"></i></span>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                class={`w-full bg-[#07080b] border focus:border-rose-500/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition shadow-inner ${fieldErrors.username ? 'border-rose-500/50' : 'border-white/5'}`}
              />
            </div>
            {fieldErrors.username && (
              <span class="text-red-500 text-[10px] font-semibold mt-1 block">{fieldErrors.username}</span>
            )}
          </div>

          {/* EMAIL */}
          <div class="space-y-1.5">
            <label class="text-gray-400 font-semibold block uppercase tracking-wide text-4xs">Email Address</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500"><i class="fa-solid fa-envelope"></i></span>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email address"
                class={`w-full bg-[#07080b] border focus:border-rose-500/50 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition shadow-inner ${fieldErrors.email ? 'border-rose-500/50' : 'border-white/5'}`}
              />
            </div>
            {fieldErrors.email && (
              <span class="text-red-500 text-[10px] font-semibold mt-1 block">{fieldErrors.email}</span>
            )}
          </div>

          {/* PASSWORD */}
          <div class="space-y-1.5">
            <label class="text-gray-400 font-semibold block uppercase tracking-wide text-4xs">Security Password</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500"><i class="fa-solid fa-lock"></i></span>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                class={`w-full bg-[#07080b] border focus:border-rose-500/50 rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none transition shadow-inner ${fieldErrors.password ? 'border-rose-500/50' : 'border-white/5'}`}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition cursor-pointer"
              >
                <i class={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {fieldErrors.password && (
              <span class="text-red-500 text-[10px] font-semibold mt-1 block">{fieldErrors.password}</span>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div class="space-y-1.5">
            <label class="text-gray-400 font-semibold block uppercase tracking-wide text-4xs">Confirm Password</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500"><i class="fa-solid fa-lock-open"></i></span>
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                class={`w-full bg-[#07080b] border focus:border-rose-500/50 rounded-xl pl-10 pr-10 py-3 text-white focus:outline-none transition shadow-inner ${fieldErrors.confirmPassword ? 'border-rose-500/50' : 'border-white/5'}`}
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition cursor-pointer"
              >
                <i class={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span class="text-red-500 text-[10px] font-semibold mt-1 block">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            class="w-full bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-rose-500/10 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {loading ? <i class="fa-solid fa-spinner animate-spin"></i> : 'CREATE PILOT ACCOUNT'}
          </button>
        </form>

        <div class="text-center mt-6 text-2xs text-gray-400 font-semibold">
          Already a pilot? <Link to="/login" class="text-rose-500 hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
