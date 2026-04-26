import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getMe, logout as apiLogout } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMe();
      setUser(res.data);
    } catch (err) {
      if (err?.message && /ban/i.test(err.message)) {
        window.alert(err.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Sunucu isteği başarısız olsa bile istemci oturumunu kapat.
    }
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
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
