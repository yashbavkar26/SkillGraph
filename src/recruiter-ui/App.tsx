import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import CandidatePortal from './pages/CandidatePortal';
import RecruiterPortal from './pages/RecruiterPortal';
import Login from './pages/Login';
import ThemeToggle from './components/ThemeToggle';
import {
  clearStoredUser,
  getStoredUser,
  storeUser,
  type LoginResponse,
} from './api/client';

type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'skillgraph-ui-theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return 'dark';
}

const App: React.FC = () => {
  const [user, setUser] = useState(getStoredUser());
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const defaultRoute = user?.role === 'recruiter' ? '/recruiter' : '/candidate';

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleLoginSuccess = (result: LoginResponse) => {
    storeUser(result.user);
    setUser(result.user);
  };

  const handleLogout = () => {
    clearStoredUser();
    setUser(null);
  };

  const handleThemeToggle = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return (
    <BrowserRouter>
      <ThemeToggle mode={theme} onToggle={handleThemeToggle} />
      {user ? (
        <Routes>
          <Route path="/" element={<Landing userName={user.name} onLogout={handleLogout} />} />
          <Route path="/candidate" element={<CandidatePortal userId={user.id} userName={user.name} />} />
          <Route path="/recruiter" element={<RecruiterPortal recruiterId={user.id} />} />
          <Route path="/login" element={<Navigate to={defaultRoute} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default App;
