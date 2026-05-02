import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Flame,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { getHomePageData, getListings, getPopularGames, getProducts } from '../lib/api';
import ListingCard from '../components/ListingCard';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import useSiteBrand from '../hooks/useSiteBrand';
import { hasListingDopingType } from '../lib/doping';
import { useSeo } from '../hooks/useSeo';

const LISTING_GRID_CLASS = 'grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
const PRODUCT_GRID_CLASS = 'grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
const CATEGORY_STAR_FIELD_STYLE = {
  backgroundImage: [
    'radial-gradient(circle at 16% 22%, rgba(255,255,255,0.95) 0 1px, transparent 1.8px)',
    'radial-gradient(circle at 76% 18%, rgba(255,255,255,0.75) 0 1px, transparent 1.6px)',
    'radial-gradient(circle at 84% 48%, rgba(255,255,255,0.82) 0 1.2px, transparent 2px)',
    'radial-gradient(circle at 28% 68%, rgba(216,180,254,0.9) 0 1px, transparent 1.8px)',
    'radial-gradient(circle at 62% 78%, rgba(103,232,249,0.82) 0 1px, transparent 1.8px)',
    'radial-gradient(circle at 44% 34%, rgba(255,255,255,0.62) 0 0.8px, transparent 1.5px)',
  ].join(','),
  backgroundSize: '88px 88px, 112px 112px, 96px 96px, 120px 120px, 104px 104px, 72px 72px',
};

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
  titleAddon,
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
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-[26px]">
              {title}
            </h2>
            {titleAddon}
          </div>
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
      className={`group relative overflow-hidden rounded-[18px] bg-gradient-to-br ${game.color || 'from-violet-500 to-fuchsia-500'} p-[1.5px] shadow-[0_16px_34px_-20px_rgba(15,23,42,0.85),0_0_22px_-12px_rgba(168,85,247,0.95)] ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_-18px_rgba(139,92,246,0.65),0_0_30px_-10px_rgba(217,70,239,0.9)]`}
    >
      {/* Shimmer sweep on hover */}
      <span className="pointer-events-none absolute inset-0 z-20 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

      <div className="relative flex h-full min-h-[132px] w-full flex-col items-center justify-center overflow-hidden rounded-[16px] bg-slate-950 px-3 py-4 text-center">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${game.color || 'from-violet-500 to-fuchsia-500'} opacity-24`} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(216,180,254,0.36),transparent_29%),radial-gradient(circle_at_22%_12%,rgba(59,130,246,0.34),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(236,72,153,0.26),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.16),rgba(2,6,23,0.76))]" />
        <div className="pointer-events-none absolute inset-0 opacity-70" style={CATEGORY_STAR_FIELD_STYLE} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.08)_42%,transparent_56%)] opacity-60" />
        <span className="pointer-events-none absolute left-3 top-7 h-px w-14 -rotate-[24deg] bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-70 shadow-[0_0_10px_rgba(255,255,255,0.45)]" />
        <span className="pointer-events-none absolute right-4 top-5 h-px w-10 -rotate-[24deg] bg-gradient-to-r from-transparent via-fuchsia-200/70 to-transparent opacity-60 shadow-[0_0_12px_rgba(217,70,239,0.55)]" />
        <span className="pointer-events-none absolute bottom-12 left-5 h-px w-11 -rotate-[24deg] bg-gradient-to-r from-transparent via-cyan-200/65 to-transparent opacity-55 shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
        <span className="pointer-events-none absolute bottom-16 right-7 h-px w-8 -rotate-[24deg] bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-50" />
        <span className="pointer-events-none absolute right-8 top-12 h-1 w-1 rounded-full bg-white/90 shadow-[0_0_10px_3px_rgba(255,255,255,0.32)]" />
        <span className="pointer-events-none absolute left-8 bottom-9 h-1 w-1 rounded-full bg-fuchsia-200/90 shadow-[0_0_10px_3px_rgba(217,70,239,0.36)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        {/* HOT badge */}
        {isHot ? (
          <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-white shadow-md">
            <Flame size={8} strokeWidth={3} />
            Hot
          </div>
        ) : null}

        {/* Image / Emoji with halo */}
        <div className="relative mb-2">
          <div className={`pointer-events-none absolute inset-0 -m-5 rounded-full bg-gradient-to-br ${game.color || 'from-violet-500 to-fuchsia-500'} opacity-75 blur-2xl transition-opacity duration-300 group-hover:opacity-100`} />
          <div className="pointer-events-none absolute inset-0 -m-3 rounded-full bg-white/12 blur-lg" />
          {game.image_url ? (
            <img
              src={game.image_url}
              alt={game.name}
              className="relative h-16 w-16 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <span className="relative block text-5xl drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-110">
              {game.emoji || '🎮'}
            </span>
          )}
        </div>

        <span className="relative text-sm font-black leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">{game.name}</span>

        {/* Bottom accent line */}
        <div className={`relative mt-2 h-0.5 w-0 rounded-full bg-gradient-to-r ${game.color || 'from-violet-500 to-fuchsia-500'} transition-all duration-500 group-hover:w-8`} />
      </div>
    </Link>
  );
}

function HomeAdBanner({ imageUrl, linkUrl, altText }) {
  if (!imageUrl) return null;
  const banner = (
    <div className="group relative mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-[0_22px_60px_-34px_rgba(15,23,42,0.65)] transition-transform hover:-translate-y-0.5 dark:border-slate-800">
      <div className="aspect-[72/7] w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={altText || 'Ana sayfa reklam banner'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
          loading="lazy"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
    </div>
  );

  if (!linkUrl) return banner;
  const isExternal = /^https?:\/\//i.test(linkUrl);
  return isExternal ? (
    <a href={linkUrl} target="_blank" rel="noopener noreferrer" aria-label={altText || 'Reklam'}>
      {banner}
    </a>
  ) : (
    <Link to={linkUrl} aria-label={altText || 'Reklam'}>
      {banner}
    </Link>
  );
}

/* =========  Main  ========= */

export default function Home() {
  useSeo({
    title: 'Oyuncu Kantinim - Oyun Dünyasının Yeni Kantini',
    description: 'E-pin, oyun ürünleri, güvenilir oyuncu pazarı ve hızlı teslimat fırsatlarını Oyuncu Kantinim’de keşfet.',
    canonical: '/',
    image: '/og-image.png',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Oyuncu Kantinim',
      url: 'https://beta.oyuncukantinim.com.tr/',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://beta.oyuncukantinim.com.tr/market?search={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  });

  const {
    defaultListingImage,
    homeAdBannerImageUrl,
    homeAdBannerLinkUrl,
    homeAdBannerAltText,
    homeAdBannerActive,
  } = useSiteBrand();
  const [listings, setListings] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [listingsLoaded, setListingsLoaded] = useState(false);
  const [featuredProductsLoaded, setFeaturedProductsLoaded] = useState(false);
  const [popularGamesLoaded, setPopularGamesLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const markLoaded = () => {
      if (!active) return;
      setListingsLoaded(true);
      setPopularGamesLoaded(true);
      setFeaturedProductsLoaded(true);
    };

    getHomePageData()
      .then((response) => {
        if (!active) return;
        const data = response.data || {};
        setListings(data.listings || []);
        setPopularGames(data.popular_games || []);
        setFeaturedProducts(data.featured_products || []);
      })
      .catch(() => (
        Promise.allSettled([
          getListings({ limit: 32 }),
          getPopularGames(),
          getProducts({ featured: 1, limit: 12 }),
        ]).then(([listingResponse, popularResponse, productResponse]) => {
          if (!active) return;
          if (listingResponse.status === 'fulfilled') setListings(listingResponse.value.data || []);
          if (popularResponse.status === 'fulfilled') setPopularGames(popularResponse.value.data || []);
          if (productResponse.status === 'fulfilled') setFeaturedProducts(productResponse.value.data || []);
        })
      ))
      .finally(markLoaded);

    return () => { active = false; };
  }, []);

  const vitrineListings = useMemo(
    () => listings.filter((listing) => hasListingDopingType(listing, 'vitrine')),
    [listings],
  );
  const recentListings = useMemo(
    () => listings.filter((listing) => !hasListingDopingType(listing, 'vitrine')),
    [listings],
  );
  const hasFeaturedProductsSection = featuredProducts.length > 0 || !featuredProductsLoaded;

  return (
    <div>
      <HeroSlider />

      {/* ============  POPÜLER KATEGORİLER  ============ */}
      {(popularGames.length > 0 || !popularGamesLoaded) && (
        <section className="relative z-10 -mt-32 sm:-mt-36 lg:-mt-40">
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
        <section className="relative mt-10 sm:mt-12">
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
                <span className="hidden items-center gap-1 rounded-full border border-amber-500 bg-amber-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-950 shadow-sm sm:inline-flex">
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
        <section className="relative mt-10 sm:mt-12">
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

      {homeAdBannerActive && homeAdBannerImageUrl ? (
        <HomeAdBanner
          imageUrl={homeAdBannerImageUrl}
          linkUrl={homeAdBannerLinkUrl}
          altText={homeAdBannerAltText}
        />
      ) : null}

      {/* ============  ÖNE ÇIKAN ÜRÜNLER  ============ */}
      {hasFeaturedProductsSection && (
        <section className="relative z-10 mt-10 sm:mt-12">
          <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 -top-4 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

          <SectionHeader
            eyebrow="Site Ürünleri"
            title="Öne Çıkan Ürünler"
            icon={ShoppingBag}
            accent="from-violet-500 via-fuchsia-500 to-cyan-500"
            count={featuredProducts.length || null}
            countLabel="Ürün"
            titleAddon={
              <span
                className="inline-flex h-10 w-10 items-center justify-center text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.9)]"
                title="Güvenli"
                role="img"
                aria-label="Güvenli"
              >
                <svg
                  viewBox="0 0 40 40"
                  className="h-full w-full overflow-visible"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M20 5.5 31 10.2V19.4C31 27.1 26.4 32.5 20 34.8 13.6 32.5 9 27.1 9 19.4V10.2L20 5.5Z"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    className="[filter:drop-shadow(0_0_7px_rgba(52,211,153,0.95))]"
                  />
                  <path
                    d="m14.8 20.7 3.7 3.7 7.4-8.1"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="[filter:drop-shadow(0_0_6px_rgba(52,211,153,1))]"
                  />
                </svg>
              </span>
            }
            action={<PillLink to="/categories" accent="from-violet-500 to-cyan-500" />}
          />

          <div className="min-h-[304px]">
            {featuredProducts.length > 0 ? (
              <div className={PRODUCT_GRID_CLASS}>
                {featuredProducts.slice(0, 12).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className={PRODUCT_GRID_CLASS}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <HomeCardSkeleton key={`featured-product-skeleton-${index}`} className="h-[304px]" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
