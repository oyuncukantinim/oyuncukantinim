import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adminLogout as adminLogoutRequest, adminMe } from '../lib/adminApi';
import { AdminAuthContext } from './adminAuthContextStore';

const ADMIN_AUTH_TIMEOUT_MS = 10000;

function withTimeout(promise, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), ADMIN_AUTH_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timer);
  });
}

export function AdminAuthProvider({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const refreshAdmin = useCallback(async () => {
    setLoading(true);
    try {
      const response = await withTimeout(adminMe(), 'Admin oturum kontrolu zaman asimina ugradi.');
      const nextUser = response.data || null;
      setAdminUser(nextUser);
      return nextUser;
    } catch {
      setAdminUser(null);
      return null;
    } finally {
      setChecked(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminRoute && !checked && !loading) {
      refreshAdmin();
    }
  }, [checked, isAdminRoute, loading, refreshAdmin]);

  const login = useCallback((userData) => {
    setAdminUser(userData || null);
    setChecked(true);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminLogoutRequest();
    } catch {
      // Cookie temizleme isteği başarısız olsa bile istemci oturumunu kapat.
    } finally {
      setAdminUser(null);
      setChecked(true);
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    adminUser,
    loading,
    checked,
    login,
    logout,
    refreshAdmin,
  }), [adminUser, loading, checked, login, logout, refreshAdmin]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
