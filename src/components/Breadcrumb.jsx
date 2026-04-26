import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Single source of truth for the "Ana Sayfa / Kategoriler / [Game] / Title"
// breadcrumb shown above page titles. Used on every detail-style page so the
// header chrome is identical regardless of context. Light + dark mode aware.
//
// Usage:
//   <Breadcrumb
//     items={[
//       { label: 'Ana Sayfa', to: '/' },
//       { label: 'Kategoriler', to: '/categories' },
//       { label: 'Knight Online', to: '/categories/ko-12' },
//       { label: 'Premium Hesap' }, // last item — current page, no `to`
//     ]}
//     showBack
//   />

export default function Breadcrumb({ items = [], showBack = true, className = '' }) {
  const navigate = useNavigate();
  const visibleItems = items.filter(Boolean);

  return (
    <nav
      className={`flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 ${className}`}
      aria-label="Breadcrumb"
    >
      {showBack ? (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 transition-colors hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-slate-800 dark:hover:text-violet-300"
        >
          <ChevronLeft size={14} /> Geri
        </button>
      ) : null}

      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {(showBack || index > 0) ? (
              <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
            ) : null}
            {isLast || !item.to ? (
              <span className="line-clamp-1 max-w-[260px] truncate font-bold text-slate-700 dark:text-slate-200 sm:max-w-none">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="font-semibold text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-300"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
