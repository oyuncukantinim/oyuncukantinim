import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Crown,
  Medal,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Trophy,
} from 'lucide-react';
import { getStores } from '../lib/api';
import UserAvatar from '../components/UserAvatar';

// Rütbe sistemi — tamamlanmış satışa göre kart başlığının rengini belirler.
const RANK_TIERS = [
  { min: 1500, label: 'Efsane', color: 'from-rose-500 via-fuchsia-500 to-violet-500', glow: 'rgba(217,70,239,0.5)' },
  { min: 500, label: 'Elmas', color: 'from-cyan-400 via-sky-400 to-blue-500', glow: 'rgba(34,211,238,0.45)' },
  { min: 150, label: 'Platin', color: 'from-teal-300 via-emerald-400 to-cyan-400', glow: 'rgba(45,212,191,0.4)' },
  { min: 50, label: 'Altın', color: 'from-amber-400 via-yellow-400 to-orange-500', glow: 'rgba(245,158,11,0.45)' },
  { min: 10, label: 'Gümüş', color: 'from-slate-300 via-slate-400 to-slate-500', glow: 'rgba(148,163,184,0.4)' },
  { min: 0, label: 'Bronz', color: 'from-orange-600 via-amber-600 to-yellow-700', glow: 'rgba(180,83,9,0.4)' },
];
const getRank = (sales) => RANK_TIERS.find((t) => Number(sales) >= t.min) || RANK_TIERS[RANK_TIERS.length - 1];

function approxPlus(value) {
  const n = Math.max(0, Number(value) || 0);
  if (n < 10) return `${Math.floor(n)}+`;
  const bucket = n >= 1000 ? 1000 : n >= 100 ? 100 : 10;
  return `${(Math.floor(n / bucket) * bucket).toLocaleString('tr-TR')}+`;
}
const formatCount = (v) => Number(v || 0).toLocaleString('tr-TR');

function RankBadge({ sales }) {
  const rank = getRank(sales);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-gradient-to-r ${rank.color} px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950`}
      style={{ boxShadow: `0 0 14px -2px ${rank.glow}` }}
    >
      <Medal size={11} strokeWidth={3} /> {rank.label}
    </span>
  );
}

// ============ MAĞAZA KARTI (itemsatis tarzı: başlık şeridi + taşan avatar) ============
function StoreCard({ store }) {
  const rank = getRank(store.total_sales);
  return (
    <Link
      to={`/p/${store.username}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/50"
    >
      {/* Başlık şeridi — rütbe gradyanı */}
      <div className={`relative h-14 bg-gradient-to-r ${rank.color}`}>
        <span className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '14px 14px' }} />
        <span className="absolute right-2.5 top-2.5"><RankBadge sales={store.total_sales} /></span>
      </div>

      <div className="px-4 pb-4">
        {/* Avatar (şeridi taşar) + isim */}
        <div className="-mt-8 flex items-end gap-3">
          <UserAvatar
            value={store.avatar}
            className="h-16 w-16 shrink-0 rounded-2xl border-4 border-white bg-slate-100 text-2xl shadow-md dark:border-slate-900 dark:bg-slate-800"
            imageClassName="h-full w-full rounded-2xl object-cover"
          />
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center gap-1">
              <h3 className="truncate text-[15px] font-black text-slate-900 transition group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-300">
                {store.username}
              </h3>
              <ShieldCheck size={14} className="shrink-0 fill-emerald-500 text-white" />
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-xs font-bold text-amber-500">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span>{Number(store.avg_rating || 0).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Satış + buton */}
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-black text-slate-700 dark:bg-slate-950/60 dark:text-slate-200">
            <ShoppingBag size={13} className="text-emerald-500" /> {formatCount(store.total_sales)} satış
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-black text-violet-600 transition group-hover:gap-2 dark:text-violet-300">
            Profili İncele <ArrowRight size={13} strokeWidth={3} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ============ SATIŞ LİDERİ SATIRI (ranked table) ============
function LeaderRow({ store, place }) {
  const podiumTone = place === 1 ? 'text-amber-400' : place === 2 ? 'text-slate-300' : place === 3 ? 'text-orange-400' : 'text-white/40';
  return (
    <Link
      to={`/p/${store.username}`}
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-white/20 hover:bg-white/10 sm:gap-4"
    >
      <span className={`w-7 shrink-0 text-center text-base font-black ${podiumTone}`}>{place}</span>
      <UserAvatar value={store.avatar} className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 text-base text-white" imageClassName="h-full w-full rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-sm font-black text-white">{store.username}</span>
          <ShieldCheck size={13} className="shrink-0 fill-emerald-500 text-slate-900" />
        </div>
        <div className="mt-0.5"><RankBadge sales={store.total_sales} /></div>
      </div>
      <div className="hidden items-center gap-1 text-sm font-black text-amber-300 sm:flex">
        <Star size={13} className="fill-amber-400 text-amber-400" /> {Number(store.avg_rating || 0).toFixed(1)}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-sm font-black text-emerald-300">
        <ShoppingBag size={13} /> {formatCount(store.total_sales)}
      </div>
    </Link>
  );
}

function SectionHeader({ icon: Icon, title, accent }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
        <Icon size={17} strokeWidth={2.4} />
      </span>
      <h2 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">{title}</h2>
    </div>
  );
}

function StoreGrid({ stores }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stores.map((s) => <StoreCard key={s.id} store={s} />)}
    </div>
  );
}

export default function StoresPage() {
  const [topStores, setTopStores] = useState([]);
  const [newStores, setNewStores] = useState([]);
  const [stats, setStats] = useState({ store_count: 0, total_sales: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStores({ sort: 'sales', limit: 48 }).catch(() => null),
      getStores({ sort: 'newest', limit: 8 }).catch(() => null),
    ])
      .then(([salesRes, newRes]) => {
        const top = salesRes?.data?.stores || [];
        setTopStores(top);
        setNewStores(newRes?.data?.stores || []);
        if (salesRes?.data?.stats) setStats(salesRes.data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  const leaders = topStores.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 p-6 text-white shadow-2xl sm:p-9">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-12 -top-12 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '26px 26px' }} />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
            <Store size={14} /> Mağazalar
          </div>
          <h1 className="max-w-2xl bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-3xl font-black leading-[1.1] text-transparent sm:text-5xl">
            Onaylı Mağazalar
          </h1>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-white/65">
            Güvenilir, onaylı satıcıları keşfet. Satış liderlerini gör, en yeni mağazaları takip et.
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
      </section>

      {/* ============ SATIŞ LİDERLERİ ============ */}
      {!loading && leaders.length > 0 ? (
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-slate-950 to-slate-900 p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.22), transparent 55%)' }} />
          <div className="relative mb-5 flex items-center gap-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md">
              <Trophy size={17} strokeWidth={2.6} />
            </span>
            <h2 className="text-lg font-black sm:text-xl">Satış Liderleri</h2>
          </div>
          <div className="relative space-y-2">
            {leaders.map((store, i) => <LeaderRow key={store.id} store={store} place={i + 1} />)}
          </div>
        </section>
      ) : null}

      {/* ============ TÜM ONAYLI MAĞAZALAR ============ */}
      <section>
        <SectionHeader icon={Crown} title="Onaylı Mağazalar" accent="from-violet-500 to-fuchsia-500" />
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
            ))}
          </div>
        ) : topStores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <Store size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">Henüz onaylı mağaza yok.</p>
          </div>
        ) : (
          <StoreGrid stores={topStores} />
        )}
      </section>

      {/* ============ YENİ MAĞAZALAR ============ */}
      {!loading && newStores.length > 0 ? (
        <section>
          <SectionHeader icon={Sparkles} title="Yeni Mağazalar" accent="from-cyan-500 to-emerald-500" />
          <StoreGrid stores={newStores} />
        </section>
      ) : null}
    </div>
  );
}
