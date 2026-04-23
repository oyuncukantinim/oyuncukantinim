import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import ThemeContext from './themeContext';

const STORAGE_KEY = 'ok_theme_mode';
const THEME_MODES = ['light', 'dark', 'system'];

function getStoredMode() {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return THEME_MODES.includes(stored) ? stored : 'dark';
}

function getSystemDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getStoredMode);
  const [systemDark, setSystemDark] = useState(getSystemDark);

  const resolvedTheme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
  const isDark = resolvedTheme === 'dark';

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-dark', isDark);
    root.classList.toggle('dark', isDark);
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark, resolvedTheme]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return undefined;

    const handleChange = (event) => setSystemDark(event.matches);
    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, []);

  const value = useMemo(() => {
    const cycleTheme = () => {
      setMode((current) => {
        if (current === 'light') return 'dark';
        if (current === 'dark') return 'system';
        return 'light';
      });
    };

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
