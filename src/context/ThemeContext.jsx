import { useEffect, useMemo, useState } from 'react';
import ThemeContext from './themeContext';

const STORAGE_KEY = 'ok_theme_mode';
const THEME_MODES = ['light', 'dark'];

function getStoredMode() {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return THEME_MODES.includes(stored) ? stored : 'dark';
}

function applyTheme(resolvedTheme) {
  const root = document.documentElement;
  const isDark = resolvedTheme === 'dark';
  root.classList.toggle('theme-dark', isDark);
  root.classList.toggle('dark', isDark);
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = isDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getStoredMode);
  const resolvedTheme = mode;
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo(() => {
    const cycleTheme = () => setMode((current) => (current === 'dark' ? 'light' : 'dark'));

    return {
      mode,
      resolvedTheme,
      isDark,
      setMode,
      cycleTheme,
    };
  }, [isDark, mode, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
