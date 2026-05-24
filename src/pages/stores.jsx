import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown,
  Flame,
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

// Rütbe — tamamlanmış satışa göre kartın aksan rengini belirler.
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

const MEDAL_TONE = { 1: 'from-amber-300 to-orange-500', 2: 'from-slate-200 to-slate-400', 3: 'from-orange-400 to-amber-600' };

// ============ KART ============
function StoreCard({ store, rankNumber, isNew }) {
  const rank = getRank(store.total_sales);
  return (
    <Link
      to={`/p/${store.username}`}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/50"
    >
      {/* Rütbe renkli sol aksan */}
      <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${rank.color}`} />

      {/* Avatar + (top3 madalya) */}
      <div className="relative shrink-0">
        <div className="rounded-xl ring-2 ring-slate-100 dark:ring-white/10" style={{ boxShadow: `0 0 18px -6px ${rank.glow}` }}>
          <UserAvatar
            value={store.avatar}
            className="h-12 w-12 rounded-xl bg-slate-100 text-lg dark:bg-slate-800"
            imageClassName="h-full w-full rounded-xl object-cover"
          />
        </div>
        {rankNumber && rankNumber <= 3 ? (
          <span className={`absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br ${MEDAL_TONE[rankNumber]} text-[10px] font-black text-slate-950 shadow`}>
            {rankNumber}
          </span>
        ) : null}
      </div>

      {/* Bilgi */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {rankNumber && rankNumber > 3 ? <span className="text-xs font-black text-slate-300 dark:text-slate-600">#{rankNumber}</span> : null}
          <span className="truncate text-sm font-black text-slate-900 transition group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-300">
            {store.username}
          </span>
          <ShieldCheck size={13} className="shrink-0 fill-emerald-500 text-white" />
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs font-black">
          <span className="inline-flex items-center gap-0.5 text-amber-500">
            <Star size={11} className="fill-amber-400 text-amber-400" /> {Number(store.avg_rating || 0).toFixed(1)}
          </span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
            <ShoppingBag size={11} /> {formatCount(store.total_sales)}
          </span>
        </div>
      </div>

      {/* Sağ etiket: YENİ ya da rütbe */}
      {isNew ? (
        <span className="shrink-0 rounded-md bg-gradient-to-r from-emerald-400 to-teal-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950">Yeni</span>
      ) : (
        <span
          className={`hidden shrink-0 items-center gap-1 rounded-md bg-gradient-to-r ${rank.color} px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950 sm:inline-flex`}
          style={{ boxShadow: `0 0 12px -3px ${rank.glow}` }}
        >
          <Medal size={10} strokeWidth={3} /> {rank.label}
        </span>
      )}
    </Link>
  );
}

function Section({ icon: Icon, title, subtitle, accent, glow, stores, ranked, isNew, loading }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`} style={{ boxShadow: `0 8px 24px -8px ${glow}` }}>
          <Icon size={20} strokeWidth={2.4} />
        </span>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">{title}</h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{subtitle}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm font-bold text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          Bu kategoride henüz mağaza yok.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stores.map((store, i) => (
            <StoreCard key={store.id} store={store} rankNumber={ranked ? i + 1 : null} isNew={isNew} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function StoresPage() {
  const [data, setData] = useState({ sales: [], followers: [], rating: [], newest: [] });
  const [stats, setStats] = useState({ store_count: 0, total_sales: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStores({ sort: 'sales', limit: 12 }).catch(() => null),
      getStores({ sort: 'followers', limit: 12 }).catch(() => null),
      getStores({ sort: 'rating', limit: 12 }).catch(() => null),
      getStores({ sort: 'newest', limit: 12 }).catch(() => null),
    ])
      .then(([s, f, r, n]) => {
        setData({
          sales: s?.data?.stores || [],
          followers: f?.data?.stores || [],
          rating: r?.data?.stores || [],
          newest: n?.data?.stores || [],
        });
        if (s?.data?.stats) setStats(s.data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  const topSeller = data.sales[0];

  return (
    <div className="space-y-8">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 p-6 text-white shadow-2xl sm:p-9">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-12 -top-12 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '26px 26px' }} />
        <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
              <Store size={14} /> Mağazalar
            </div>
            <h1 className="bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-3xl font-black leading-[1.1] text-transparent sm:text-5xl">
              Mağaza Vitrini
            </h1>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-white/60">
              Satış liderleri, öne çıkanlar, en yüksek puanlılar ve yeni açılanlar — hepsi tek sayfada.
            </p>
            <div className="mt-5 flex gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center backdrop-blur">
                <div className="text-xl font-black text-cyan-300">{approxPlus(stats.store_count)}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Mağaza</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center backdrop-blur">
                <div className="text-xl font-black text-emerald-300">{approxPlus(stats.total_sales)}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Satış</div>
              </div>
            </div>
          </div>

          {/* Zirvedeki satıcı — özel hover spotlight */}
          {topSeller ? (
            <Link
              to={`/p/${topSeller.username}`}
              className="group/spot relative block overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-amber-500/15 via-white/5 to-violet-500/10 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:border-amber-300/60"
              style={{ boxShadow: '0 0 38px -14px rgba(245,158,11,0.55)' }}
            >
              {/* shimmer sweep */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/spot:translate-x-[120%]" />
              {/* hover'da büyüyen halo */}
              <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl transition-all duration-500 group-hover/spot:scale-150 group-hover/spot:bg-amber-400/35" />

              <div className="relative mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-950">
                <Crown size={13} strokeWidth={3} /> Zirvedeki Satıcı
              </div>

              <div className="relative flex items-center gap-3">
                <div className="rounded-2xl ring-4 ring-amber-400/50 transition group-hover/spot:ring-amber-300/80">
                  <UserAvatar
                    value={topSeller.avatar}
                    className="h-16 w-16 rounded-2xl bg-slate-800 text-2xl text-white"
                    imageClassName="h-full w-full rounded-2xl object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-lg font-black text-white">
                    <span className="truncate">{topSeller.username}</span>
                    <ShieldCheck size={15} className="shrink-0 fill-emerald-500 text-slate-900" />
                  </div>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 rounded-md bg-gradient-to-r ${getRank(topSeller.total_sales).color} px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950`}
                  >
                    <Medal size={11} strokeWidth={3} /> {getRank(topSeller.total_sales).label}
                  </span>
                </div>
              </div>

              <div className="relative mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl border border-white/10 bg-white/5 py-2">
                  <div className="text-base font-black text-emerald-300">{formatCount(topSeller.total_sales)}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/45">Satış</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 py-2">
                  <div className="flex items-center justify-center gap-1 text-base font-black text-amber-300">
                    <Star size={13} className="fill-amber-400 text-amber-400" /> {Number(topSeller.avg_rating || 0).toFixed(1)}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/45">Puan</div>
                </div>
              </div>

              {/* hover'da açılan satır */}
              <div className="relative mt-0 max-h-0 overflow-hidden text-center opacity-0 transition-all duration-300 group-hover/spot:mt-3 group-hover/spot:max-h-10 group-hover/spot:opacity-100">
                <span className="inline-flex items-center gap-1 text-xs font-black text-amber-200">
                  <Trophy size={12} /> Mağazanın profilini gör →
                </span>
              </div>
            </Link>
          ) : null}
        </div>
      </section>

      {/* ============ 4 BÖLÜM ============ */}
      <Section
        icon={Trophy}
        title="Satış Liderleri"
        subtitle="En çok satış yapan mağazalar"
        accent="from-amber-400 to-orange-500"
        glow="rgba(245,158,11,0.5)"
        stores={data.sales}
        ranked
        loading={loading}
      />
      <Section
        icon={Flame}
        title="Öne Çıkan Mağazalar"
        subtitle="En çok takip edilen popüler mağazalar"
        accent="from-rose-500 to-fuchsia-500"
        glow="rgba(217,70,239,0.5)"
        stores={data.followers}
        loading={loading}
      />
      <Section
        icon={Star}
        title="En Yüksek Puanlı"
        subtitle="En yüksek puan — eşitlikte daha çok yoruma sahip olan önde"
        accent="from-cyan-400 to-blue-500"
        glow="rgba(34,211,238,0.5)"
        stores={data.rating}
        loading={loading}
      />
      <Section
        icon={Sparkles}
        title="Yeni Mağazalar"
        subtitle="En son açılan onaylı mağazalar"
        accent="from-emerald-400 to-teal-500"
        glow="rgba(16,185,129,0.5)"
        stores={data.newest}
        isNew
        loading={loading}
      />
    </div>
  );
}
