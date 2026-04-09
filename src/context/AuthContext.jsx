import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getMe, setToken, setStoredUser, getStoredUser, logout as apiLogout } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    try {
      const res = await getMe();
      setUser(res.data);
      setStoredUser(res.data);
    } catch (err) {
      if (err?.message && /ban/i.test(err.message)) {
        window.alert(err.message);
      }
      apiLogout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = useCallback((token, userData) => {
    setToken(token);
    setStoredUser(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    setStoredUser(updatedUser);
  }, []);

  const value = useMemo(() => ({
    user, loading, login, logout, updateUser, refreshUser
  }), [user, loading, login, logout, updateUser, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
