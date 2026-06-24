import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('aviator_token'));
  const [loading, setLoading] = useState(true);

  // Set default auth headers
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/auth/profile`);
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { usernameOrEmail, password });
      if (res.data.success) {
        localStorage.setItem('aviator_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Server error during login' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
      if (res.data.success) {
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Server error during registration' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('aviator_token');
    setToken(null);
    setUser(null);
  };

  const updateClientSeed = async (newSeed) => {
    try {
      const res = await axios.post(`${API_URL}/auth/seed`, { clientSeed: newSeed });
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Server error updating client seed' 
      };
    }
  };

  const syncBalance = (newBalance) => {
    setUser(prev => prev ? { ...prev, balance: newBalance } : null);
  };

  const syncBalances = (newBalance, newBankBalance) => {
    setUser(prev => prev ? { ...prev, balance: newBalance, bankBalance: newBankBalance } : null);
  };

  const updateProfile = async (avatar, currentPassword, newPassword) => {
    try {
      const res = await axios.post(`${API_URL}/auth/update`, { avatar, currentPassword, newPassword });
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Server error updating profile'
      };
    }
  };

  const deleteAccount = async () => {
    try {
      const res = await axios.delete(`${API_URL}/auth/delete`);
      if (res.data.success) {
        logout();
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Server error deleting account'
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateClientSeed,
      syncBalance,
      syncBalances,
      updateProfile,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};
