import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Play from './pages/Play.jsx';
import Deposit from './pages/Deposit.jsx';
import Withdraw from './pages/Withdraw.jsx';
import Admin from './pages/Admin.jsx';
import Profile from './pages/Profile.jsx';
import Lobby from './pages/Lobby.jsx';
import Notice from './pages/Notice.jsx';
import Settings from './pages/Settings.jsx';
import AboutUs from './pages/AboutUs.jsx';
import Guide from './pages/Guide.jsx';
import Vip from './pages/Vip.jsx';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div class="min-h-screen bg-[#07080a] flex items-center justify-center">
        <i class="fa-solid fa-spinner animate-spin text-2xl text-rose-500"></i>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Game Pages */}
      <Route path="/" element={
        <ProtectedRoute>
          <Lobby />
        </ProtectedRoute>
      } />
      <Route path="/play" element={
        <ProtectedRoute>
          <Play />
        </ProtectedRoute>
      } />
      <Route path="/deposit" element={
        <ProtectedRoute>
          <Deposit />
        </ProtectedRoute>
      } />
      <Route path="/withdraw" element={
        <ProtectedRoute>
          <Withdraw />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/notice" element={
        <ProtectedRoute>
          <Notice />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/about-us" element={
        <ProtectedRoute>
          <AboutUs />
        </ProtectedRoute>
      } />
      <Route path="/guide" element={
        <ProtectedRoute>
          <Guide />
        </ProtectedRoute>
      } />
      <Route path="/vip" element={
        <ProtectedRoute>
          <Vip />
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
