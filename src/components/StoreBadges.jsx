import { CheckCircle2, Gamepad2, Lock, Trophy } from 'lucide-react';

export function VerifiedStoreBadge({ compact = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 font-black text-emerald-700 shadow-sm shadow-emerald-100 ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
      title="Onaylı Mağaza"
    >
      <CheckCircle2 size={compact ? 12 : 14} className="fill-emerald-500 text-white" />
      Onaylı Mağaza
    </span>
  );
}

export function VerifiedStoreIcon({ compact = false }) {
  const sizeClass = compact ? 'h-6 w-6' : 'h-7 w-7';
  const iconSize = compact ? 15 : 17;

  return (
    <span
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100`}
      title="Onaylı Mağaza"
      aria-label="Onaylı Mağaza"
    >
      <CheckCircle2 size={iconSize} className="fill-emerald-500 text-white" />
    </span>
  );
}

export function StoreBadgeIcon({ badge, size = 'md' }) {
  if (!badge?.image_url) return null;
  const sizeClass = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';

  return (
    <span
      className={`group/badge relative inline-flex ${sizeClass} items-center justify-center overflow-visible rounded-full`}
      aria-label={badge.title || 'Satıcı rozeti'}
    >
      <span className={`inline-flex ${sizeClass} items-center justify-center overflow-hidden rounded-full border border-amber-200 bg-white shadow-sm transition-transform duration-200 group-hover/badge:scale-110`}>
        <img src={badge.image_url} alt={badge.title || ''} className="h-full w-full object-cover" />
      </span>
      <span className="pointer-events-none absolute top-full left-1/2 z-40 mt-2 -translate-x-1/2 -translate-y-1 scale-75 opacity-0 transition-all duration-200 ease-out group-hover/badge:translate-y-0 group-hover/badge:scale-100 group-hover/badge:opacity-100">
        <span className="relative flex flex-col items-center gap-1.5 rounded-2xl border border-amber-200 bg-white p-2.5 shadow-xl shadow-amber-100 dark:border-amber-900/40 dark:bg-slate-900 dark:shadow-black/40">
          <span className="block h-20 w-20 overflow-hidden rounded-xl border border-amber-100 bg-white dark:border-amber-900/30 dark:bg-slate-800">
            <img src={badge.image_url} alt={badge.title || ''} className="h-full w-full object-cover" />
          </span>
          {badge.title ? (
            <span className="max-w-[160px] truncate text-[11px] font-black text-slate-800 dark:text-white">{badge.title}</span>
          ) : null}
          {badge.description ? (
            <span className="max-w-[180px] text-center text-[10px] font-semibold leading-4 text-slate-500 dark:text-slate-400">{badge.description}</span>
          ) : null}
          <span className="absolute left-1/2 bottom-full h-2.5 w-2.5 -translate-x-1/2 translate-y-1.5 rotate-45 border-l border-t border-amber-200 bg-white dark:border-amber-900/40 dark:bg-slate-900" />
        </span>
      </span>
    </span>
  );
}

export function StoreRankPill({ badge }) {
  return <StoreBadgeIcon badge={badge} />;
}

export function VerifiedAchievementCard({ isVerified = false, forceUnlocked = false }) {
  const unlocked = Boolean(isVerified || forceUnlocked);
  return (
    <div
      title="Bilgileri doğrulanmış satıcı."
      className={`achievement-card relative min-h-[190px] overflow-hidden rounded-2xl border p-3 text-center shadow-sm transition-all ${
        unlocked
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-emerald-100'
          : 'border-slate-200 bg-slate-50 grayscale'
      }`}
    >
      <div className={`absolute -right-10 -top-10 h-24 w-24 rounded-full ${unlocked ? 'bg-emerald-200/40' : 'bg-slate-200/70'}`} />
      {!unlocked ? (
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500 shadow-inner">
          <Lock size={15} />
        </div>
      ) : null}

      <div className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border bg-white shadow-sm">
        {unlocked ? (
          <CheckCircle2 size={44} className="fill-emerald-500 text-white" />
        ) : (
          <Lock size={30} className="text-slate-300" />
        )}
      </div>

      <h3 className={`mt-3 line-clamp-1 text-sm font-black ${unlocked ? 'text-slate-900' : 'text-slate-500'}`}>Onaylı Satıcı</h3>
      <p className={`mt-1 line-clamp-2 text-xs font-semibold leading-5 ${unlocked ? 'text-slate-500' : 'text-slate-400'}`}>
        Bilgileri doğrulanmış satıcı.
      </p>
      <div className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${unlocked ? 'bg-white text-emerald-700 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
        Mağaza Onayı
      </div>
      <Gamepad2 size={16} className={`absolute bottom-3 right-3 ${unlocked ? 'text-emerald-400' : 'text-slate-300'}`} />
    </div>
  );
}

export function AchievementCard({ badge, forceUnlocked = false }) {
  const unlocked = Boolean(forceUnlocked || badge?.is_unlocked);
  const requiredSales = Number(badge?.required_sales || 0);
  const memberLimit = Number(badge?.member_limit || 0);
  const badgeType = badge?.badge_type || 'sales_rank';
  const requirementText = badgeType === 'founding_member'
    ? `İlk ${memberLimit || 1000} Üye`
    : requiredSales > 0 ? `${requiredSales} Başarılı Satış` : 'Başlangıç rozeti';

  return (
    <div
      title={badge.description || badge.title || 'Satış başarım rozeti.'}
      className={`achievement-card relative min-h-[190px] overflow-hidden rounded-2xl border p-3 text-center shadow-sm transition-all ${
        unlocked
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-amber-100'
          : 'border-slate-200 bg-slate-50 grayscale'
      }`}
    >
      <div className={`absolute -right-10 -top-10 h-24 w-24 rounded-full ${unlocked ? 'bg-amber-200/40' : 'bg-slate-200/70'}`} />
      {!unlocked ? (
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500 shadow-inner">
          <Lock size={15} />
        </div>
      ) : null}

      <div className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border bg-white shadow-sm">
        {badge.image_url ? (
          <img src={badge.image_url} alt="" className={`h-full w-full object-cover ${unlocked ? '' : 'opacity-45'}`} />
        ) : unlocked ? (
          <Trophy size={32} className="text-amber-500" />
        ) : (
          <Lock size={30} className="text-slate-300" />
        )}
      </div>

      <h3 className={`mt-3 line-clamp-1 text-sm font-black ${unlocked ? 'text-slate-900' : 'text-slate-500'}`}>{badge.title}</h3>
      <p className={`mt-1 line-clamp-2 text-xs font-semibold leading-5 ${unlocked ? 'text-slate-500' : 'text-slate-400'}`}>
        {badge.description || 'Satış başarım rozeti.'}
      </p>
      <div className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${unlocked ? 'bg-white text-amber-700 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
        {requirementText}
      </div>
      <Gamepad2 size={16} className={`absolute bottom-3 right-3 ${unlocked ? 'text-violet-400' : 'text-slate-300'}`} />
    </div>
  );
}
