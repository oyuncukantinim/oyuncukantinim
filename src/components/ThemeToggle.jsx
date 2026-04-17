import { Moon, Sun } from 'lucide-react';
import useTheme from '../hooks/useTheme';

const THEME_META = {
  light: { label: 'Açık tema', icon: Sun },
  dark: { label: 'Koyu tema', icon: Moon },
};

export default function ThemeToggle({ className = '', showLabel = false }) {
  const { isDark, setMode } = useTheme();
  const nextMode = isDark ? 'light' : 'dark';
  const meta = isDark ? THEME_META.dark : THEME_META.light;
  const Icon = meta.icon;
  const title = `${meta.label} aktif. ${nextMode === 'dark' ? 'Koyu' : 'Açık'} temaya geç.`;

  return (
    <button
      type="button"
      onClick={() => setMode(nextMode)}
      title={title}
      aria-label={title}
      className={`theme-toggle inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 p-3 text-slate-500 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 ${className}`}
    >
      <Icon size={19} />
      {showLabel ? (
        <span className="text-sm font-bold">
          {isDark ? 'Koyu Tema' : 'Açık Tema'}
        </span>
      ) : null}
    </button>
  );
}
