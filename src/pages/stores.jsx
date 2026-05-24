import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Crown,
  Flame,
  Medal,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { getStores } from '../lib/api';
import UserAvatar from '../components/UserAvatar';

// Rütbe sistemi — tamamlanmış satış sayısına göre. Gaming rütbe estetiği.
const RANK_TIERS = [
  { min: 1500, label: 'Efsane', color: 'from-rose-500 via-fuchsia-500 to-violet-500', glow: 'rgba(217,70,239,0.55)', text: 'text-fuchsia-300' },
  { min: 500, label: 'Elmas', color: 'from-cyan-400 via-sky-400 to-blue-500', glow: 'rgba(34,211,238,0.5)', text: 'text-cyan-300' },
  { min: 150, label: 'Platin', color: 'from-teal-300 via-emerald-400 to-cyan-400', glow: 'rgba(45,212,191,0.45)', text: 'text-teal-200' },
  { min: 50, label: 'Altın', color: 'from-amber-400 via-yellow-400 to-orange-500', glow: 'rgba(245,158,11,0.5)', text: 'text-amber-300' },
  { min: 10, label: 'Gümüş', color: 'from-slate-200 via-slate-300 to-slate-400', glow: 'rgba(203,213,225,0.4)', text: 'text-slate-200' },
  { min: 0, label: 'Bronz', color: 'from-orange-600 via-amber-600 to-yellow-700', glow: 'rgba(180,83,9,0.4)', text: 'text-orange-300' },
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
  const floored = Math.floor(n / bucket) * bucket;
  return `${floored.toLocaleString('tr-TR')}+`;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('tr-TR');
}

const SORT_TABS = [
  { id: 'sales', label: 'En Çok Satan', icon: TrendingUp },
  { id: 'rating', label: 'En Yüksek Puan', icon: Star },
  { id: 'followers', label: 'En Çok Takipçi', icon: Users },
  { id: 'newest', label: 'Yeni Açılanlar', icon: Sparkles },
];

function RankBadge({ sales, size = 'sm' }) {
  const rank = getRank(sales);
  const dims = size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-gradient-to-r ${rank.color} ${dims} font-black uppercase tracking-[0.14em] text-slate-950 shadow-sm`}
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
        <Star
          key={i}
          size={11}
          className={i <= Math.round(r) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
        />
      ))}
    </span>
  );
}

function StoreCard({ store, rankIndex }) {
  const rank = getRank(store.total_sales);
  return (
    <Link
      to={`/p/${store.username}`}
      className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/60 dark:hover:shadow-[0_20px_45px_-15px_rgba(139,92,246,0.45)]"
    >
      {/* Banner */}
      <div className="relative h-20 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
        {store.banner_image ? (
          <img src={store.banner_image} alt="" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" loading="lazy" />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${rank.color} opacity-30`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent dark:from-slate-900 dark:via-slate-900/40" />
        {/* Sıra numarası */}
        {rankIndex != null ? (
          <span className="absolute left-3 top-3 inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-slate-950/80 px-2 text-xs font-black text-white backdrop-blur">
            #{rankIndex + 1}
          </span>
        ) : null}
        <span className="absolute right-3 top-3">
          <RankBadge sales={store.total_sales} />
        </span>
      </div>

      {/* Avatar + isim */}
      <div className="px-4 pb-4">
        <div className="-mt-8 flex items-end gap-3">
          <div className="relative">
            <UserAvatar
              value={store.avatar}
              className="h-16 w-16 rounded-2xl border-4 border-white bg-slate-100 text-2xl shadow-md dark:border-slate-900 dark:bg-slate-800"
              imageClassName="h-full w-full rounded-2xl object-cover"
            />
            <span
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100"
              style={{ boxShadow: `0 0 22px -4px ${rank.glow}` }}
            />
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-base font-black text-slate-900 transition group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-300">
                {store.username}
              </h3>
              <ShieldCheck size={15} className="shrink-0 fill-emerald-500 text-white" />
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
              <Stars rating={store.avg_rating} />
              <span>{Number(store.avg_rating || 0).toFixed(1)}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>{store.review_count} yorum</span>
            </div>
          </div>
        </div>

        {/* İstatistik şeritleri */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-50 px-2 py-2 text-center dark:bg-slate-950/60">
            <div className="flex items-center justify-center gap-1 text-sm font-black text-slate-900 dark:text-white">
              <ShoppingBag size={12} className="text-emerald-500" /> {formatCount(store.total_sales)}
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Satış</div>
          </div>
          <div className="rounded-xl bg-slate-50 px-2 py-2 text-center dark:bg-slate-950/60">
            <div className="flex items-center justify-center gap-1 text-sm font-black text-slate-900 dark:text-white">
              <Users size={12} className="text-violet-500" /> {formatCount(store.follower_count)}
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Takipçi</div>
          </div>
          <div className="rounded-xl bg-slate-50 px-2 py-2 text-center dark:bg-slate-950/60">
            <div className="flex items-center justify-center gap-1 text-sm font-black text-slate-900 dark:text-white">
              <Store size={12} className="text-cyan-500" /> {formatCount(store.active_listing_count)}
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">İlan</div>
          </div>
        </div>

        {/* Rozetler + CTA */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {(store.store_badges || []).slice(0, 4).map((b, i) => (
              <span key={i} className="inline-block h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-white dark:border-slate-900">
                <img src={b.image_url} alt={b.title || ''} className="h-full w-full object-cover" />
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-black text-violet-600 transition group-hover:gap-2 dark:text-violet-300">
            Mağazaya Git <ArrowRight size={13} strokeWidth={3} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// Podyum kartı (Top 3)
function PodiumCard({ store, place }) {
  const meta = {
    1: { ring: 'ring-amber-400', glow: 'rgba(245,158,11,0.6)', icon: Crown, tone: 'text-amber-400', label: '1.', scale: 'lg:-translate-y-4' },
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
        <UserAvatar
          value={store.avatar}
          className="h-16 w-16 rounded-2xl bg-slate-800 text-2xl text-white"
          imageClassName="h-full w-full rounded-2xl object-cover"
        />
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
  const [sort, setSort] = useState('sales');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  // Leaderboard (Top satış) — sort'tan bağımsız, sabit kalsın diye ayrı çek.
  const [leaders, setLeaders] = useState([]);
  useEffect(() => {
    getStores({ sort: 'sales', limit: 3 })
      .then((r) => setLeaders(r.data?.stores || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      getStores({ sort, search: search.trim(), limit: 36 })
        .then((r) => {
          setStores(r.data?.stores || []);
          if (r.data?.stats) setStats(r.data.stats);
        })
        .catch(() => setStores([]))
        .finally(() => setLoading(false));
    }, search ? 350 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [sort, search]);

  const spotlight = leaders[0];
  const podium = useMemo(() => leaders.slice(0, 3), [leaders]);

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
              En çok satan, en yüksek puanlı ve en çok takip edilen mağazaları keşfet. Rütbeni yükselt, sıralamada zirveye oyna.
            </p>

            {/* Canlı sayaçlar — XXX+ */}
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
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-base font-black text-emerald-300">{formatCount(spotlight.total_sales)}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/45">Satış</div>
                </div>
                <div>
                  <div className="text-base font-black text-amber-300">{Number(spotlight.avg_rating || 0).toFixed(1)}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/45">Puan</div>
                </div>
                <div>
                  <div className="text-base font-black text-violet-300">{formatCount(spotlight.follower_count)}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/45">Takipçi</div>
                </div>
              </div>
            </Link>
          ) : null}
        </div>
      </section>

      {/* ============ LEADERBOARD PODYUM ============ */}
      {podium.length >= 3 ? (
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.25), transparent 55%)' }} />
          <div className="relative mb-6 flex items-center gap-2 text-white">
            <Trophy size={18} className="text-amber-400" />
            <h2 className="text-lg font-black sm:text-xl">Liderlik Tablosu</h2>
            <span className="text-xs font-bold text-white/40">· En çok satan ilk 3</span>
          </div>
          <div className="relative grid grid-cols-3 gap-3 sm:gap-5">
            {/* 2 - 1 - 3 sıralı podyum */}
            <PodiumCard store={podium[1]} place={2} />
            <PodiumCard store={podium[0]} place={1} />
            <PodiumCard store={podium[2]} place={3} />
          </div>
        </section>
      ) : null}

      {/* ============ FİLTRE + ARAMA ============ */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {SORT_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = sort === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSort(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-black transition-all ${
                    active
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-300/40'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <Icon size={15} /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="relative lg:w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mağaza ara..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* ============ GRID ============ */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <Store size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">Mağaza bulunamadı.</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">Arama kriterlerini değiştirmeyi dene.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stores.map((store, i) => (
              <StoreCard key={store.id} store={store} rankIndex={sort === 'sales' && !search ? i : null} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
