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

// Sıralama (pozisyon) bazlı etiket — satış rütbesi yok, listedeki sıraya göre.
const POS_STYLE = {
  1: { label: 'LİDER', color: 'from-amber-300 to-orange-500', glow: 'rgba(245,158,11,0.5)', icon: Crown },
  2: { label: '2.', color: 'from-slate-200 to-slate-400', glow: 'rgba(203,213,225,0.45)', icon: Trophy },
  3: { label: '3.', color: 'from-orange-400 to-amber-600', glow: 'rgba(234,88,12,0.45)', icon: Medal },
};
const posStyle = (place) => POS_STYLE[place] || { label: `#${place}`, color: 'from-violet-500 to-fuchsia-500', glow: 'rgba(139,92,246,0.4)', icon: null };

function approxPlus(value) {
  const n = Math.max(0, Number(value) || 0);
  if (n < 10) return `${Math.floor(n)}+`;
  const bucket = n >= 1000 ? 1000 : n >= 100 ? 100 : 10;
  return `${(Math.floor(n / bucket) * bucket).toLocaleString('tr-TR')}+`;
}
const formatCount = (v) => Number(v || 0).toLocaleString('tr-TR');

// ============ KART ============
function StoreCard({ store, place }) {
  const ps = posStyle(place);
  const PosIcon = ps.icon;
  return (
    <Link
      to={`/p/${store.username}`}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/50"
    >
      {/* Pozisyon renkli sol aksan */}
      <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${ps.color}`} />

      {/* Avatar */}
      <div className="shrink-0 rounded-xl ring-2 ring-slate-100 dark:ring-white/10" style={{ boxShadow: `0 0 18px -6px ${ps.glow}` }}>
        <UserAvatar
          value={store.avatar}
          className="h-12 w-12 rounded-xl bg-slate-100 text-lg dark:bg-slate-800"
          imageClassName="h-full w-full rounded-xl object-cover"
        />
      </div>

      {/* Bilgi */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
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

      {/* Sıralama badge'i */}
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r ${ps.color} px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950`}
        style={{ boxShadow: `0 0 12px -3px ${ps.glow}` }}
      >
        {PosIcon ? <PosIcon size={10} strokeWidth={3} /> : null} {ps.label}
      </span>
    </Link>
  );
}

function Section({ icon: Icon, title, subtitle, accent, glow, stores, loading }) {
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm font-bold text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          Bu kategoride henüz mağaza yok.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stores.map((store, i) => (
            <StoreCard key={store.id} store={store} place={i + 1} />
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
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0a18] p-5 text-white shadow-2xl sm:p-7">
        <style>{`
          @keyframes mv-aurora { 0%,100%{transform:translate(0,0) scale(1);opacity:.7} 50%{transform:translate(40px,-30px) scale(1.25);opacity:1} }
          @keyframes mv-aurora2 { 0%,100%{transform:translate(0,0) scale(1);opacity:.55} 50%{transform:translate(-35px,25px) scale(1.2);opacity:.9} }
          @keyframes mv-spin { to { transform: rotate(360deg) } }
          @keyframes mv-grad { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
          @keyframes mv-float { 0%,100%{transform:translate(-50%,0)} 50%{transform:translate(-50%,-6px)} }
          .mv-aurora{animation:mv-aurora 9s ease-in-out infinite}
          .mv-aurora2{animation:mv-aurora2 11s ease-in-out infinite}
          .mv-spin{animation:mv-spin 6s linear infinite}
          .mv-grad{background-size:200% 200%;animation:mv-grad 6s ease infinite}
          .mv-float{animation:mv-float 3.2s ease-in-out infinite}
        `}</style>
        {/* animasyonlu aurora arka plan */}
        <div className="pointer-events-none absolute inset-0">
          <div className="mv-aurora absolute -left-16 -top-20 h-72 w-72 rounded-full bg-violet-600/30 blur-[90px]" />
          <div className="mv-aurora2 absolute -right-12 bottom-[-60px] h-80 w-80 rounded-full bg-cyan-500/25 blur-[90px]" />
          <div className="mv-aurora absolute left-1/3 top-1/4 h-44 w-44 rounded-full bg-fuchsia-500/20 blur-[80px]" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)', backgroundSize: '26px 26px' }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'repeating-linear-gradient(180deg, #fff 0 1px, transparent 1px 4px)' }} />
        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
              <Store size={14} /> Mağazalar
            </div>
            <h1 className="mv-grad bg-gradient-to-r from-cyan-300 via-violet-200 to-fuchsia-300 bg-clip-text text-2xl font-black leading-[1.1] text-transparent sm:text-4xl">
              Mağaza Vitrini
            </h1>
            <p className="mt-2 max-w-xl text-xs font-semibold leading-6 text-white/55 sm:text-sm">
              Satış liderleri, öne çıkanlar, en yüksek puanlılar ve yeni açılanlar — hepsi tek sayfada.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300"><Store size={15} /></span>
                <div>
                  <div className="text-base font-black leading-none text-white">{approxPlus(stats.store_count)}</div>
                  <div className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">Mağaza</div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300"><ShoppingBag size={15} /></span>
                <div>
                  <div className="text-base font-black leading-none text-white">{approxPlus(stats.total_sales)}</div>
                  <div className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">Satış</div>
                </div>
              </div>
            </div>
          </div>

          {/* Zirvedeki satıcı — şampiyon sahnesi */}
          {topSeller ? (
            <Link
              to={`/p/${topSeller.username}`}
              className="group/spot relative flex flex-col items-center overflow-hidden rounded-2xl border border-amber-300/25 bg-gradient-to-b from-amber-500/10 via-white/[0.03] to-violet-500/10 px-4 pb-4 pt-5 text-center backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/60"
              style={{ boxShadow: '0 0 40px -16px rgba(245,158,11,0.55)' }}
            >
              {/* shimmer sweep */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/spot:translate-x-[120%]" />

              <div className="relative mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-950 shadow">
                <Crown size={12} strokeWidth={3} /> Zirvedeki Satıcı
              </div>

              {/* yüzen taç + dönen rainbow ring + avatar */}
              <div className="relative mb-3 h-16 w-16">
                <Crown size={18} className="mv-float absolute -top-6 left-1/2 z-10 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)]" />
                <span className="mv-spin absolute -inset-1.5 rounded-full" style={{ background: 'conic-gradient(from 0deg, #f59e0b, #f43f5e, #8b5cf6, #22d3ee, #f59e0b)' }} />
                <span className="absolute -inset-1.5 rounded-full opacity-40 blur-md" style={{ background: 'conic-gradient(from 0deg, #f59e0b, #f43f5e, #8b5cf6, #22d3ee, #f59e0b)' }} />
                <UserAvatar
                  value={topSeller.avatar}
                  className="absolute inset-0 h-16 w-16 rounded-full border-4 border-[#0a0a18] bg-slate-800 text-2xl text-white"
                  imageClassName="h-full w-full rounded-full object-cover"
                />
              </div>

              <div className="relative flex items-center justify-center gap-1.5 text-base font-black text-white">
                <span className="max-w-[160px] truncate">{topSeller.username}</span>
                <ShieldCheck size={14} className="shrink-0 fill-emerald-500 text-slate-900" />
              </div>
              <span className="relative mt-1.5 inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-300 to-orange-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950">
                <Crown size={10} strokeWidth={3} /> Lider
              </span>

              <div className="relative mt-3 grid w-full grid-cols-2 gap-2">
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
        loading={loading}
      />
      <Section
        icon={Flame}
        title="Fenomen Mağazalar"
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
        loading={loading}
      />
    </div>
  );
}
