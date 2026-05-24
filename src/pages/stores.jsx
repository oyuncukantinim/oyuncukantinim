import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Crown,
  Medal,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Trophy,
} from 'lucide-react';
import { getStores } from '../lib/api';
import UserAvatar from '../components/UserAvatar';

// Rütbe — tamamlanmış satışa göre.
const RANK_TIERS = [
  { min: 1500, label: 'Efsane', color: 'from-rose-500 via-fuchsia-500 to-violet-500', dot: '#d946ef' },
  { min: 500, label: 'Elmas', color: 'from-cyan-400 via-sky-400 to-blue-500', dot: '#22d3ee' },
  { min: 150, label: 'Platin', color: 'from-teal-300 via-emerald-400 to-cyan-400', dot: '#2dd4bf' },
  { min: 50, label: 'Altın', color: 'from-amber-400 via-yellow-400 to-orange-500', dot: '#f59e0b' },
  { min: 10, label: 'Gümüş', color: 'from-slate-300 via-slate-400 to-slate-500', dot: '#94a3b8' },
  { min: 0, label: 'Bronz', color: 'from-orange-600 via-amber-600 to-yellow-700', dot: '#b45309' },
];
const getRank = (sales) => RANK_TIERS.find((t) => Number(sales) >= t.min) || RANK_TIERS[RANK_TIERS.length - 1];

function approxPlus(value) {
  const n = Math.max(0, Number(value) || 0);
  if (n < 10) return `${Math.floor(n)}+`;
  const bucket = n >= 1000 ? 1000 : n >= 100 ? 100 : 10;
  return `${(Math.floor(n / bucket) * bucket).toLocaleString('tr-TR')}+`;
}
const formatCount = (v) => Number(v || 0).toLocaleString('tr-TR');

// Top-3 madalya stilleri
const MEDAL = {
  1: { icon: Crown, ring: 'ring-amber-400/70', text: 'text-amber-400', bg: 'bg-amber-400/10', bar: 'bg-gradient-to-b from-amber-300 to-orange-500', glow: 'rgba(245,158,11,0.5)' },
  2: { icon: Trophy, ring: 'ring-slate-300/70', text: 'text-slate-300', bg: 'bg-slate-300/10', bar: 'bg-gradient-to-b from-slate-200 to-slate-400', glow: 'rgba(203,213,225,0.4)' },
  3: { icon: Medal, ring: 'ring-orange-400/70', text: 'text-orange-400', bg: 'bg-orange-400/10', bar: 'bg-gradient-to-b from-orange-400 to-amber-600', glow: 'rgba(234,88,12,0.4)' },
};

function ScoreRow({ store, place }) {
  const rank = getRank(store.total_sales);
  const medal = MEDAL[place];
  const MedalIcon = medal?.icon;
  return (
    <Link
      to={`/p/${store.username}`}
      className={`group relative grid grid-cols-[44px_1fr_auto] items-center gap-3 overflow-hidden border-b border-white/5 px-3 py-3 transition-colors hover:bg-white/[0.04] sm:grid-cols-[56px_1fr_120px_120px_44px] sm:gap-4 sm:px-5 ${medal ? medal.bg : ''}`}
    >
      {/* Sol rütbe çubuğu (top 3) */}
      {medal ? <span className={`absolute inset-y-0 left-0 w-1 ${medal.bar}`} /> : null}

      {/* Sıra */}
      <div className="flex items-center justify-center">
        {medal ? (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${medal.bg} ${medal.text} ring-1 ${medal.ring}`} style={{ boxShadow: `0 0 16px -4px ${medal.glow}` }}>
            <MedalIcon size={18} strokeWidth={2.6} />
          </span>
        ) : (
          <span className="text-base font-black text-white/35">{place}</span>
        )}
      </div>

      {/* Mağaza */}
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          value={store.avatar}
          className="h-11 w-11 shrink-0 rounded-xl bg-slate-800 text-lg text-white ring-2 ring-white/10"
          imageClassName="h-full w-full rounded-xl object-cover"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-black text-white transition group-hover:text-cyan-300 sm:text-[15px]">{store.username}</span>
            <ShieldCheck size={14} className="shrink-0 fill-emerald-500 text-slate-900" />
          </div>
          {/* Mobil: rütbe + puan tek satır */}
          <div className="mt-1 flex items-center gap-2 sm:hidden">
            <span className="inline-flex items-center gap-1 text-[11px] font-black" style={{ color: rank.dot }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: rank.dot }} /> {rank.label}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-amber-300">
              <Star size={10} className="fill-amber-400 text-amber-400" /> {Number(store.avg_rating || 0).toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-emerald-300">
              <ShoppingBag size={10} /> {formatCount(store.total_sales)}
            </span>
          </div>
          {/* Masaüstü: rütbe etiketi */}
          <span className="mt-0.5 hidden items-center gap-1 text-[11px] font-black sm:inline-flex" style={{ color: rank.dot }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: rank.dot }} /> {rank.label}
          </span>
        </div>
      </div>

      {/* Puan (masaüstü) */}
      <div className="hidden items-center justify-end gap-1.5 sm:flex">
        <Star size={14} className="fill-amber-400 text-amber-400" />
        <span className="text-sm font-black text-white">{Number(store.avg_rating || 0).toFixed(1)}</span>
      </div>

      {/* Satış (masaüstü) */}
      <div className="hidden items-center justify-end gap-1.5 sm:flex">
        <ShoppingBag size={14} className="text-emerald-400" />
        <span className="text-sm font-black text-white">{formatCount(store.total_sales)}</span>
      </div>

      {/* Ok */}
      <div className="hidden items-center justify-center text-white/20 transition group-hover:translate-x-0.5 group-hover:text-cyan-300 sm:flex">
        <ChevronRight size={18} />
      </div>
    </Link>
  );
}

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState({ store_count: 0, total_sales: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStores({ sort: 'sales', limit: 100 })
      .then((r) => {
        setStores(r.data?.stores || []);
        if (r.data?.stats) setStats(r.data.stats);
      })
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      {/* ============ SCOREBOARD PANEL ============ */}
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 shadow-2xl">
        {/* Üst başlık şeridi */}
        <div className="relative overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-10 -top-12 h-44 w-44 rounded-full bg-violet-500/25 blur-3xl" />
            <div className="absolute right-0 -bottom-10 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100 backdrop-blur">
                <Trophy size={13} /> Sıralama Tablosu
              </div>
              <h1 className="bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-3xl font-black leading-none text-transparent sm:text-4xl">
                Mağaza Sıralaması
              </h1>
              <p className="mt-2 text-sm font-semibold text-white/55">Onaylı mağazalar, satış performansına göre sıralı.</p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center backdrop-blur">
                <div className="text-lg font-black text-cyan-300">{approxPlus(stats.store_count)}</div>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">Mağaza</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center backdrop-blur">
                <div className="text-lg font-black text-emerald-300">{approxPlus(stats.total_sales)}</div>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">Satış</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tablo başlığı (masaüstü) */}
        <div className="hidden grid-cols-[56px_1fr_120px_120px_44px] gap-4 border-y border-white/10 bg-white/[0.03] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/40 sm:grid">
          <span className="text-center">Sıra</span>
          <span>Mağaza</span>
          <span className="text-right">Puan</span>
          <span className="text-right">Satış</span>
          <span />
        </div>

        {/* Satırlar */}
        {loading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="h-9 w-9 animate-pulse rounded-xl bg-white/10" />
                <div className="h-11 w-11 animate-pulse rounded-xl bg-white/10" />
                <div className="h-4 flex-1 animate-pulse rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Store size={40} className="mx-auto mb-3 text-white/20" />
            <p className="text-lg font-black text-white/80">Henüz onaylı mağaza yok.</p>
          </div>
        ) : (
          <div>
            {stores.map((store, i) => <ScoreRow key={store.id} store={store} place={i + 1} />)}
          </div>
        )}
      </div>
    </div>
  );
}
