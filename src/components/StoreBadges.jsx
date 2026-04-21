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

export function StoreRankPill({ badge }) {
  if (!badge?.image_url) return null;

  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-amber-200 bg-white shadow-sm"
      title={badge.title}
    >
      <img src={badge.image_url} alt={badge.title || ''} className="h-full w-full object-cover" />
    </span>
  );
}

export function AchievementCard({ badge }) {
  const unlocked = Boolean(badge?.is_unlocked);
  const requiredSales = Number(badge?.required_sales || 0);
  const memberLimit = Number(badge?.member_limit || 0);
  const badgeType = badge?.badge_type || 'sales_rank';
  const requirementText = badgeType === 'founding_member'
    ? `İlk ${memberLimit || 1000} Üye`
    : requiredSales > 0 ? `${requiredSales} Tamamlanmış Satış` : 'Başlangıç rozeti';

  return (
    <div
      className={`relative min-h-[190px] overflow-hidden rounded-2xl border p-3 text-center shadow-sm transition-all ${
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
