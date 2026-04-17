import { Monitor, Moon, Sun } from 'lucide-react';
import useTheme from '../hooks/useTheme';

const THEME_META = {
  light: { label: 'Açık tema', icon: Sun },
  dark: { label: 'Koyu tema', icon: Moon },
  system: { label: 'Sistem teması', icon: Monitor },
};

export default function ThemeToggle({ className = '', showLabel = false }) {
  const { mode, resolvedTheme, cycleTheme } = useTheme();
  const meta = THEME_META[mode] || THEME_META.system;
  const Icon = meta.icon;
  const title = `${meta.label} aktif. Değiştirmek için tıkla.`;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={title}
      aria-label={title}
      className={`theme-toggle inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 p-3 text-slate-500 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 ${className}`}
    >
      <Icon size={19} />
      {showLabel ? (
        <span className="text-sm font-bold">
          {mode === 'system' ? `Sistem (${resolvedTheme === 'dark' ? 'Koyu' : 'Açık'})` : meta.label}
        </span>
      ) : null}
    </button>
  );
}
