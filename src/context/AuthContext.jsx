import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getMe, setStoredUser, getStoredUser, logout as apiLogout } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe();
      setUser(res.data);
      setStoredUser(res.data);
    } catch (err) {
      if (err?.message && /ban/i.test(err.message)) {
        window.alert(err.message);
      }
      setStoredUser(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = useCallback((userData) => {
    setStoredUser(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setStoredUser(null);
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
