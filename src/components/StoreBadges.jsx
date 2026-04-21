import { CheckCircle2, Gamepad2, Lock, Sparkles, Trophy } from 'lucide-react';

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

export function StoreRankPill({ badge }) {
  if (!badge) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 py-1 text-xs font-black text-amber-700 shadow-sm">
      {badge.image_url ? (
        <img src={badge.image_url} alt="" className="h-4 w-4 rounded-full object-cover" />
      ) : (
        <Trophy size={14} className="text-amber-500" />
      )}
      {badge.title}
    </span>
  );
}

export function AchievementCard({ badge, currentSales = 0 }) {
  const unlocked = Boolean(badge?.is_unlocked);
  const progress = Number(badge?.progress || 0);
  const requiredSales = Number(badge?.required_sales || 0);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all ${
        unlocked
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50'
          : 'border-slate-200 bg-white opacity-80'
      }`}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-100/60" />
      <div className="relative flex items-start gap-3">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${
            unlocked ? 'border-amber-200 bg-white' : 'border-slate-200 bg-slate-50'
          }`}
        >
          {badge.image_url ? (
            <img src={badge.image_url} alt="" className="h-full w-full object-cover" />
          ) : unlocked ? (
            <Trophy size={24} className="text-amber-500" />
          ) : (
            <Lock size={22} className="text-slate-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-900">{badge.title}</h3>
            {unlocked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                <Sparkles size={11} /> Açıldı
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">{badge.description || 'Satış başarım rozeti.'}</p>
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] font-black text-slate-400">
              <span>{currentSales} / {requiredSales} satış</span>
              <span>%{Math.min(100, progress)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${unlocked ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-slate-300'}`}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        </div>
        <Gamepad2 size={18} className={unlocked ? 'text-violet-400' : 'text-slate-300'} />
      </div>
    </div>
  );
}
