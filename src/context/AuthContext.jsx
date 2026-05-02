import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMe, logout as apiLogout } from '../lib/api';
import { AuthContext } from './authContextStore';

const AUTH_USER_STORAGE_KEY = 'ok_auth_user_snapshot';

function readStoredUser() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_USER_STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (user) localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  } catch {
    // Storage can be disabled; auth still works through the HttpOnly cookie.
  }
}

function isAuthFailure(error) {
  const message = String(error?.message || '').toLocaleLowerCase('tr-TR');
  return (
    message.includes('yetkilendirme gerekli') ||
    message.includes('giriş yap') ||
    message.includes('oturum süresi') ||
    message.includes('oturum suresi') ||
    message.includes('kullanıcı bulunamadı') ||
    message.includes('kullanici bulunamadi') ||
    message.includes('banlandi') ||
    message.includes('banlandı')
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMe();
      setUser(res.data);
      writeStoredUser(res.data);
    } catch (err) {
      if (isAuthFailure(err)) {
        if (err?.message && /ban/i.test(err.message)) {
          window.alert(err.message);
        }
        writeStoredUser(null);
        setUser(null);
      } else {
        // Temporary network/server errors should not visually log the user out.
        setUser((current) => current || readStoredUser());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = useCallback((userData) => {
    setUser(userData);
    writeStoredUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Clear the local session even if the server request fails.
    }
    writeStoredUser(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    writeStoredUser(updatedUser);
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
