import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Flame,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { getListings } from '../lib/api';
import ListingCard from '../components/ListingCard';
import HeroSlider from '../components/HeroSlider';
import useSiteBrand from '../hooks/useSiteBrand';
import { hasListingDopingType } from '../lib/doping';

const LISTING_GRID_CLASS = 'grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';

function HomeCardSkeleton({ className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gray-100 bg-white/80 shadow-sm ${className}`}>
      <div className="animate-pulse">
        <div className="h-28 w-full bg-slate-100" />
        <div className="space-y-2 p-3">
          <div className="h-3 w-2/3 rounded-full bg-slate-100" />
          <div className="h-3 w-1/2 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

/* =========  Shared section primitives  ========= */

function SectionHeader({
  eyebrow,
  title,
  icon: Icon,
  accent, // e.g. 'from-orange-500 to-red-500'
  count,
  countLabel,
  action,
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} shadow-lg ring-1 ring-white/40`}>
          <Icon size={20} className="text-white" strokeWidth={2.4} />
          <span className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${accent} opacity-40 blur-lg`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`bg-gradient-to-r ${accent} bg-clip-text text-[10px] font-black uppercase tracking-[0.26em] text-transparent`}>
              {eyebrow}
            </span>
            {count != null ? (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {count} {countLabel}
                </span>
              </>
            ) : null}
          </div>
          <h2 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900 sm:text-[26px]">
            {title}
          </h2>
        </div>
      </div>
      {action}
    </div>
  );
}

function PillLink({ to, accent }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-1 rounded-full bg-gradient-to-r ${accent} px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-lg ring-1 ring-white/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95`}
    >
      Tümünü Gör
      <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* =========  Popular category card  ========= */

function CategoryCard({ game, index }) {
  // First 3 get a "HOT" tag
  const isHot = index < 3;
  return (
    <Link
      to={game.category_slug ? `/categories/${game.category_slug}` : `/market?game=${encodeURIComponent(game.name)}`}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.color || 'from-violet-500 to-fuchsia-500'} p-[2px] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_-12px_rgba(139,92,246,0.55)]`}
    >
      {/* Shimmer sweep on hover */}
      <span className="pointer-events-none absolute inset-0 z-20 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

      <div className="relative flex h-full w-full flex-col items-center justify-center rounded-2xl bg-white/95 px-3 py-4 text-center backdrop-blur-sm">
        {/* HOT badge */}
        {isHot ? (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-white shadow-md">
            <Flame size={8} strokeWidth={3} />
            Hot
          </div>
        ) : null}

        {/* Image / Emoji with halo */}
        <div className="relative mb-2">
          <div className={`pointer-events-none absolute inset-0 -m-2 rounded-2xl bg-gradient-to-br ${game.color || 'from-violet-500 to-fuchsia-500'} opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-60`} />
          {game.image_url ? (
            <img
              src={game.image_url}
              alt={game.name}
              className="relative h-12 w-12 rounded-xl object-contain transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <span className="relative block text-4xl transition-transform duration-300 group-hover:scale-110">
              {game.emoji || '🎮'}
            </span>
          )}
        </div>

        <span className="text-sm font-black leading-tight text-slate-900">{game.name}</span>

        {/* Bottom accent line */}
        <div className={`mt-2 h-0.5 w-0 rounded-full bg-gradient-to-r ${game.color || 'from-violet-500 to-fuchsia-500'} transition-all duration-500 group-hover:w-8`} />
      </div>
    </Link>
  );
}

/* =========  Main  ========= */

export default function Home() {
  const { defaultListingImage } = useSiteBrand();
  const [listings, setListings] = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [listingsLoaded, setListingsLoaded] = useState(false);
  const [popularGamesLoaded, setPopularGamesLoaded] = useState(false);

  useEffect(() => {
    getListings({ limit: 32, status: 'active' })
      .then((r) => setListings(r.data || []))
      .catch(() => {})
      .finally(() => setListingsLoaded(true));

    fetch('https://api.oyuncukantinim.com.tr/api.php?action=get_popular_games')
      .then((r) => r.json())
      .then((j) => setPopularGames(j.data || []))
      .catch(() => {})
      .finally(() => setPopularGamesLoaded(true));
  }, []);

  const vitrineListings = useMemo(
    () => listings.filter((listing) => hasListingDopingType(listing, 'vitrine')),
    [listings],
  );
  const recentListings = useMemo(
    () => listings.filter((listing) => !hasListingDopingType(listing, 'vitrine')),
    [listings],
  );

  return (
    <div className="space-y-10 sm:space-y-12">
      <HeroSlider />

      {/* ============  POPÜLER KATEGORİLER  ============ */}
      {(popularGames.length > 0 || !popularGamesLoaded) && (
        <section className="relative -mt-40 sm:-mt-44 lg:-mt-48">
          {/* Ambient background accent */}
          <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 -top-4 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />

          <SectionHeader
            eyebrow="Trend Oyunlar"
            title="Popüler Kategoriler"
            icon={Flame}
            accent="from-orange-500 via-red-500 to-pink-500"
            count={popularGames.length || null}
            countLabel="Oyun"
            action={
              <PillLink to="/categories" accent="from-orange-500 to-red-500">
                Tümünü Gör
              </PillLink>
            }
          />

          <div className="relative min-h-[164px]">
            {popularGames.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {popularGames.map((game, i) => (
                  <CategoryCard key={game.id} game={game} index={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {Array.from({ length: 7 }).map((_, index) => (
                  <HomeCardSkeleton key={`popular-skeleton-${index}`} className="h-[164px]" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============  VİTRİN İLANLAR (Premium)  ============ */}
      {(vitrineListings.length > 0 || !listingsLoaded) && (
        <section className="relative">
          {/* Premium spotlight bg */}
          <div className="pointer-events-none absolute -inset-x-4 -inset-y-6 -z-10 overflow-hidden rounded-[32px]">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-rose-50/60" />
            <div className="absolute left-1/4 top-0 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="absolute right-1/4 bottom-0 h-48 w-48 rounded-full bg-rose-400/20 blur-3xl" />
            {/* Subtle star pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'radial-gradient(rgba(0,0,0,0.6) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>

          <SectionHeader
            eyebrow="Öne Çıkan"
            title="Vitrin İlanlar"
            icon={Trophy}
            accent="from-amber-400 via-orange-500 to-rose-500"
            count={vitrineListings.length || null}
            countLabel="İlan"
            action={
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1 rounded-full border border-amber-300/60 bg-amber-100/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 shadow-sm sm:inline-flex">
                  <Sparkles size={11} /> Premium
                </span>
                <PillLink to="/market" accent="from-amber-500 to-rose-500">
                  Tümünü Gör
                </PillLink>
              </div>
            }
          />

          <div className="min-h-[260px]">
            {vitrineListings.length > 0 ? (
              <div className={LISTING_GRID_CLASS}>
                {vitrineListings.slice(0, 16).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
                ))}
              </div>
            ) : (
              <div className={LISTING_GRID_CLASS}>
                {Array.from({ length: 7 }).map((_, index) => (
                  <HomeCardSkeleton key={`vitrine-skeleton-${index}`} className="h-[260px]" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============  SON İLANLAR (Fresh)  ============ */}
      {(recentListings.length > 0 || !listingsLoaded) && (
        <section className="relative">
          {/* Fresh ambient */}
          <div className="pointer-events-none absolute left-0 -top-4 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

          <SectionHeader
            eyebrow="Yeni Eklenenler"
            title="Son İlanlar"
            icon={ShieldCheck}
            accent="from-emerald-400 via-teal-500 to-cyan-500"
            count={recentListings.length || null}
            countLabel="İlan"
            action={<PillLink to="/market" accent="from-emerald-500 to-cyan-500">Tümünü Gör</PillLink>}
          />

          <div className="min-h-[260px]">
            {recentListings.length > 0 ? (
              <div className={LISTING_GRID_CLASS}>
                {recentListings.slice(0, 16).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
                ))}
              </div>
            ) : (
              <div className={LISTING_GRID_CLASS}>
                {Array.from({ length: 7 }).map((_, index) => (
                  <HomeCardSkeleton key={`recent-skeleton-${index}`} className="h-[260px]" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
