import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
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

// Rütbe sistemi — tamamlanmış satış sayısına göre. Kartın tüm rengini belirler.
const RANK_TIERS = [
  { min: 1500, label: 'Efsane', color: 'from-rose-500 via-fuchsia-500 to-violet-500', glow: 'rgba(217,70,239,0.55)', ring: 'ring-fuchsia-400/60', text: 'text-fuchsia-300' },
  { min: 500, label: 'Elmas', color: 'from-cyan-400 via-sky-400 to-blue-500', glow: 'rgba(34,211,238,0.5)', ring: 'ring-cyan-400/60', text: 'text-cyan-300' },
  { min: 150, label: 'Platin', color: 'from-teal-300 via-emerald-400 to-cyan-400', glow: 'rgba(45,212,191,0.45)', ring: 'ring-teal-300/60', text: 'text-teal-200' },
  { min: 50, label: 'Altın', color: 'from-amber-400 via-yellow-400 to-orange-500', glow: 'rgba(245,158,11,0.5)', ring: 'ring-amber-400/60', text: 'text-amber-300' },
  { min: 10, label: 'Gümüş', color: 'from-slate-200 via-slate-300 to-slate-400', glow: 'rgba(203,213,225,0.4)', ring: 'ring-slate-300/50', text: 'text-slate-200' },
  { min: 0, label: 'Bronz', color: 'from-orange-600 via-amber-600 to-yellow-700', glow: 'rgba(180,83,9,0.4)', ring: 'ring-orange-500/50', text: 'text-orange-300' },
];

function getRank(sales) {
  return RANK_TIERS.find((t) => Number(sales) >= t.min) || RANK_TIERS[RANK_TIERS.length - 1];
}

// Net sayı yerine yaklaşık "XXX+" göster.
function approxPlus(value) {
  const n = Math.max(0, Number(value) || 0);
  if (n < 10) return `${Math.floor(n)}+`;
  let bucket = 10;
  if (n >= 1000) bucket = 1000;
  else if (n >= 100) bucket = 100;
  return `${(Math.floor(n / bucket) * bucket).toLocaleString('tr-TR')}+`;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('tr-TR');
}

function RankBadge({ sales, size = 'sm' }) {
  const rank = getRank(sales);
  const dims = size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-gradient-to-r ${rank.color} ${dims} font-black uppercase tracking-[0.14em] text-slate-950`}
      style={{ boxShadow: `0 0 16px -2px ${rank.glow}` }}
    >
      <Medal size={size === 'lg' ? 13 : 11} strokeWidth={3} /> {rank.label}
    </span>
  );
}

function Stars({ rating }) {
  const r = Number(rating) || 0;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} className={i <= Math.round(r) ? 'fill-amber-400 text-amber-400' : 'text-white/20'} />
      ))}
    </span>
  );
}

// ============ YENİ SATICI KARTI — banner / yorum / takipçi / ilan YOK ============
function StoreCard({ store, place }) {
  const rank = getRank(store.total_sales);
  return (
    <Link
      to={`/p/${store.username}`}
      className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-center transition-all duration-300 hover:-translate-y-1.5"
      style={{ '--glow': rank.glow }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 22px 50px -18px ${rank.glow}, 0 0 0 1px ${rank.glow}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Rütbe rengine göre üst aksan */}
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${rank.color}`} />
      {/* Arka plan halo */}
      <span
        className="pointer-events-none absolute -top-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full opacity-30 blur-3xl transition-opacity duration-300 group-hover:opacity-60"
        style={{ background: `radial-gradient(circle, ${rank.glow}, transparent 70%)` }}
      />

      {/* Sıra no */}
      {place != null ? (
        <span className="absolute left-3 top-3 text-sm font-black text-white/30">#{place}</span>
      ) : null}
      {/* Rütbe rozeti */}
      <span className="absolute right-3 top-3"><RankBadge sales={store.total_sales} /></span>

      {/* Avatar — rütbe renkli ring + glow */}
      <div className="relative mt-4">
        <div className={`rounded-2xl ring-4 ${rank.ring}`} style={{ boxShadow: `0 0 26px -6px ${rank.glow}` }}>
          <UserAvatar
            value={store.avatar}
            className="h-20 w-20 rounded-2xl bg-slate-800 text-3xl text-white"
            imageClassName="h-full w-full rounded-2xl object-cover"
          />
        </div>
      </div>

      {/* İsim + onay */}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        <h3 className="max-w-[170px] truncate text-base font-black text-white transition group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:to-violet-300">
          {store.username}
        </h3>
        <ShieldCheck size={16} className="shrink-0 fill-emerald-500 text-slate-900" />
      </div>

      {/* Puan */}
      <div className="mt-2 flex items-center gap-1.5">
        <Stars rating={store.avg_rating} />
        <span className="text-sm font-black text-amber-300">{Number(store.avg_rating || 0).toFixed(1)}</span>
      </div>

      {/* Tek ana metrik: satış */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
        <ShoppingBag size={15} className="text-emerald-300" />
        <span className="text-lg font-black text-white">{formatCount(store.total_sales)}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Satış</span>
      </div>
    </Link>
  );
}

// Podyum kartı (Top 3)
function PodiumCard({ store, place }) {
  const meta = {
    1: { ring: 'ring-amber-400', glow: 'rgba(245,158,11,0.6)', icon: Crown, tone: 'text-amber-400', label: '1.', scale: 'lg:-translate-y-5 lg:scale-105' },
    2: { ring: 'ring-slate-300', glow: 'rgba(203,213,225,0.5)', icon: Trophy, tone: 'text-slate-300', label: '2.', scale: '' },
    3: { ring: 'ring-orange-500', glow: 'rgba(234,88,12,0.5)', icon: Medal, tone: 'text-orange-400', label: '3.', scale: '' },
  }[place];
  const Icon = meta.icon;
  return (
    <Link
      to={`/p/${store.username}`}
      className={`group relative flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur transition-all duration-300 hover:-translate-y-1 ${meta.scale}`}
      style={{ boxShadow: `0 0 30px -10px ${meta.glow}` }}
    >
      <div className={`mb-2 flex items-center gap-1 text-2xl font-black ${meta.tone}`}>
        <Icon size={20} strokeWidth={2.5} /> {meta.label}
      </div>
      <div className={`relative rounded-2xl ring-4 ${meta.ring}`} style={{ boxShadow: `0 0 24px -6px ${meta.glow}` }}>
        <UserAvatar value={store.avatar} className="h-16 w-16 rounded-2xl bg-slate-800 text-2xl text-white" imageClassName="h-full w-full rounded-2xl object-cover" />
      </div>
      <div className="mt-2 flex items-center gap-1 truncate text-sm font-black text-white">
        <span className="truncate">{store.username}</span>
        <ShieldCheck size={13} className="shrink-0 fill-emerald-500 text-slate-900" />
      </div>
      <div className="mt-0.5"><RankBadge sales={store.total_sales} /></div>
      <div className="mt-2 flex items-center gap-1 text-sm font-black text-emerald-300">
        <ShoppingBag size={13} /> {formatCount(store.total_sales)} satış
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
    getStores({ sort: 'sales', limit: 60 })
      .then((r) => {
        setStores(r.data?.stores || []);
        if (r.data?.stats) setStats(r.data.stats);
      })
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, []);

  const spotlight = stores[0];
  const podium = useMemo(() => stores.slice(0, 3), [stores]);
  const rest = useMemo(() => stores.slice(3), [stores]);

  return (
    <div className="space-y-8">
      {/* ============ HERO / ARENA ============ */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 p-6 text-white shadow-2xl sm:p-9">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-12 -top-12 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '26px 26px' }} />

        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
              <Trophy size={14} /> Mağaza Arenası
            </div>
            <h1 className="max-w-2xl bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-3xl font-black leading-[1.1] text-transparent sm:text-5xl">
              Onaylı Mağazalar & Şampiyonlar
            </h1>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-white/65">
              En çok satan onaylı mağazaları keşfet. Rütbeni yükselt, sıralamada zirveye oyna.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur">
                <div className="text-xl font-black text-cyan-300">{approxPlus(stats.store_count)}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Onaylı Mağaza</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur">
                <div className="text-xl font-black text-emerald-300">{approxPlus(stats.total_sales)}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Toplam Satış</div>
              </div>
            </div>
          </div>

          {/* Ayın Mağazası spotlight */}
          {spotlight ? (
            <Link
              to={`/p/${spotlight.username}`}
              className="group relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-amber-500/15 via-white/5 to-violet-500/10 p-5 backdrop-blur transition hover:-translate-y-1"
              style={{ boxShadow: '0 0 40px -12px rgba(245,158,11,0.5)' }}
            >
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-950">
                <Crown size={13} strokeWidth={3} /> Zirvedeki Mağaza
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl ring-4 ring-amber-400/50">
                  <UserAvatar value={spotlight.avatar} className="h-16 w-16 rounded-2xl bg-slate-800 text-2xl text-white" imageClassName="h-full w-full rounded-2xl object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate text-lg font-black text-white">
                    <span className="truncate">{spotlight.username}</span>
                    <ShieldCheck size={15} className="shrink-0 fill-emerald-500 text-slate-900" />
                  </div>
                  <div className="mt-1"><RankBadge sales={spotlight.total_sales} size="lg" /></div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-base font-black text-emerald-300">{formatCount(spotlight.total_sales)}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/45">Satış</div>
                </div>
                <div>
                  <div className="text-base font-black text-amber-300">{Number(spotlight.avg_rating || 0).toFixed(1)}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/45">Puan</div>
                </div>
              </div>
            </Link>
          ) : null}
        </div>
      </section>

      {/* ============ LEADERBOARD PODYUM ============ */}
      {!loading && podium.length >= 3 ? (
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.25), transparent 55%)' }} />
          <div className="relative mb-6 flex items-center gap-2 text-white">
            <Trophy size={18} className="text-amber-400" />
            <h2 className="text-lg font-black sm:text-xl">Liderlik Tablosu</h2>
          </div>
          <div className="relative grid grid-cols-3 gap-3 sm:gap-5">
            <PodiumCard store={podium[1]} place={2} />
            <PodiumCard store={podium[0]} place={1} />
            <PodiumCard store={podium[2]} place={3} />
          </div>
        </section>
      ) : null}

      {/* ============ TÜM MAĞAZALAR ============ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Store size={18} className="text-violet-500" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">Tüm Mağazalar</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-white/10 bg-slate-900" />
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <Store size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">Henüz onaylı mağaza yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {/* Top 3 zaten podyumda — listede #4'ten devam, podyum yoksa baştan */}
            {(podium.length >= 3 ? rest : stores).map((store, i) => (
              <StoreCard key={store.id} store={store} place={(podium.length >= 3 ? i + 4 : i + 1)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
