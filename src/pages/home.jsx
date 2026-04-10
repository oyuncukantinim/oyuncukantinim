import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Flame,
  Gamepad2,
  Headphones,
  Keyboard,
  MonitorPlay,
  Mouse,
  Shield,
  ShieldCheck,
  Trophy,
  Zap,
} from 'lucide-react';
import { getListings, getEpins } from '../lib/api';
import ListingCard from '../components/ListingCard';
import EPinCard from '../components/EPinCard';
import useSiteBrand from '../hooks/useSiteBrand';
import { hasListingDopingType } from '../lib/doping';

const HERO_BACKGROUND_ICONS = [
  { Icon: Gamepad2, size: 34, className: 'left-[7%] top-[14%] opacity-[0.18] rotate-[-16deg]' },
  { Icon: Mouse, size: 28, className: 'left-[18%] top-[34%] opacity-[0.14] rotate-[12deg]' },
  { Icon: Keyboard, size: 34, className: 'left-[10%] bottom-[17%] opacity-[0.14] rotate-[-10deg]' },
  { Icon: Headphones, size: 30, className: 'left-[27%] bottom-[12%] opacity-[0.1] rotate-[14deg] hidden md:block' },
  { Icon: Shield, size: 30, className: 'left-[39%] top-[10%] opacity-[0.08] rotate-[-8deg] hidden lg:block' },
  { Icon: Trophy, size: 30, className: 'right-[38%] top-[12%] opacity-[0.08] rotate-[10deg] hidden lg:block' },
  { Icon: MonitorPlay, size: 32, className: 'right-[16%] top-[19%] opacity-[0.14] rotate-[11deg]' },
  { Icon: Headphones, size: 32, className: 'right-[8%] top-[38%] opacity-[0.12] rotate-[-14deg]' },
  { Icon: Mouse, size: 26, className: 'right-[22%] bottom-[18%] opacity-[0.12] rotate-[16deg] hidden md:block' },
  { Icon: Keyboard, size: 34, className: 'right-[9%] bottom-[10%] opacity-[0.14] rotate-[-10deg]' },
];

const PAGE_BACKGROUND_ICONS = [
  { Icon: Gamepad2, size: 34, className: 'left-[3%] top-[4%] opacity-[0.24] rotate-[-14deg]' },
  { Icon: Mouse, size: 28, className: 'left-[12%] top-[8%] opacity-[0.2] rotate-[10deg]' },
  { Icon: Keyboard, size: 34, className: 'left-[7%] top-[16%] opacity-[0.22] rotate-[-8deg] hidden md:block' },
  { Icon: Shield, size: 28, className: 'left-[22%] top-[6%] opacity-[0.18] rotate-[9deg] hidden lg:block' },
  { Icon: Headphones, size: 30, className: 'left-[28%] top-[15%] opacity-[0.18] rotate-[14deg] hidden md:block' },
  { Icon: Trophy, size: 30, className: 'left-[5%] top-[28%] opacity-[0.18] rotate-[-12deg] hidden md:block' },
  { Icon: MonitorPlay, size: 32, className: 'left-[16%] top-[35%] opacity-[0.22] rotate-[12deg]' },
  { Icon: Mouse, size: 26, className: 'left-[9%] top-[47%] opacity-[0.18] rotate-[18deg] hidden lg:block' },
  { Icon: Keyboard, size: 36, className: 'left-[19%] top-[57%] opacity-[0.24] rotate-[-10deg]' },
  { Icon: Gamepad2, size: 30, className: 'left-[7%] top-[70%] opacity-[0.18] rotate-[16deg]' },
  { Icon: Shield, size: 27, className: 'left-[25%] top-[72%] opacity-[0.18] rotate-[8deg] hidden md:block' },
  { Icon: Headphones, size: 30, className: 'left-[14%] bottom-[7%] opacity-[0.18] rotate-[-12deg]' },
  { Icon: Mouse, size: 24, className: 'left-[31%] bottom-[14%] opacity-[0.16] rotate-[18deg] hidden lg:block' },
  { Icon: Keyboard, size: 34, className: 'left-[36%] top-[26%] opacity-[0.16] rotate-[-11deg] hidden xl:block' },
  { Icon: Gamepad2, size: 28, className: 'left-[40%] top-[52%] opacity-[0.16] rotate-[14deg] hidden xl:block' },
  { Icon: Shield, size: 28, className: 'right-[4%] top-[5%] opacity-[0.22] rotate-[12deg]' },
  { Icon: Headphones, size: 32, className: 'right-[14%] top-[11%] opacity-[0.18] rotate-[-14deg]' },
  { Icon: MonitorPlay, size: 34, className: 'right-[7%] top-[20%] opacity-[0.24] rotate-[8deg]' },
  { Icon: Trophy, size: 30, className: 'right-[20%] top-[27%] opacity-[0.18] rotate-[-10deg] hidden md:block' },
  { Icon: Mouse, size: 26, className: 'right-[10%] top-[39%] opacity-[0.2] rotate-[18deg]' },
  { Icon: Keyboard, size: 36, className: 'right-[5%] top-[50%] opacity-[0.24] rotate-[-12deg] hidden md:block' },
  { Icon: Gamepad2, size: 30, className: 'right-[18%] top-[61%] opacity-[0.18] rotate-[14deg] hidden lg:block' },
  { Icon: Headphones, size: 32, className: 'right-[8%] top-[72%] opacity-[0.18] rotate-[-18deg]' },
  { Icon: MonitorPlay, size: 30, className: 'right-[23%] bottom-[16%] opacity-[0.18] rotate-[11deg] hidden md:block' },
  { Icon: Trophy, size: 28, className: 'right-[12%] bottom-[10%] opacity-[0.16] rotate-[-10deg]' },
  { Icon: Mouse, size: 24, className: 'right-[30%] bottom-[8%] opacity-[0.14] rotate-[18deg] hidden lg:block' },
  { Icon: Shield, size: 26, className: 'right-[34%] top-[44%] opacity-[0.14] rotate-[10deg] hidden xl:block' },
  { Icon: Keyboard, size: 32, className: 'right-[38%] top-[76%] opacity-[0.14] rotate-[-9deg] hidden xl:block' },
];

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

export default function Home() {
  const { defaultListingImage } = useSiteBrand();
  const [listings, setListings] = useState([]);
  const [epins, setEpins] = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [listingsLoaded, setListingsLoaded] = useState(false);
  const [epinsLoaded, setEpinsLoaded] = useState(false);
  const [popularGamesLoaded, setPopularGamesLoaded] = useState(false);

  useEffect(() => {
    getListings()
      .then((r) => setListings(r.data || []))
      .catch(() => {})
      .finally(() => setListingsLoaded(true));

    getEpins()
      .then((r) => setEpins(r.data || []))
      .catch(() => {})
      .finally(() => setEpinsLoaded(true));

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
    <div className="relative space-y-16">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[22rem] overflow-hidden">
        <div className="absolute left-[12%] top-[6%] h-32 w-32 rounded-full bg-slate-200 blur-3xl opacity-[0.12]" />
        <div className="absolute right-[10%] top-[34%] h-36 w-36 rounded-full bg-violet-200 blur-3xl opacity-[0.12]" />
        <div className="absolute left-[28%] bottom-[18%] h-40 w-40 rounded-full bg-cyan-100 blur-3xl opacity-[0.12]" />
        <div className="absolute right-[26%] top-[58%] h-28 w-28 rounded-full bg-slate-300 blur-3xl opacity-[0.1]" />
        {PAGE_BACKGROUND_ICONS.map(({ Icon, size, className }, index) => (
          <div
            key={`${Icon.displayName || Icon.name || 'page-icon'}-${index}`}
            className={`absolute text-slate-400 ${className}`}
            aria-hidden="true"
          >
            <Icon size={size} strokeWidth={1.6} />
          </div>
        ))}
      </div>
      <section className="relative left-1/2 -mt-8 flex w-screen -translate-x-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 px-6 py-20 text-center">
        <div className="pointer-events-none absolute left-0 top-0 h-[400px] w-[400px] rounded-full bg-white/10 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-cyan-400/20 blur-[80px]" />
        <div className="pointer-events-none absolute right-10 top-10 opacity-10">
          <Gamepad2 size={200} className="text-white" />
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-[22%] top-[20%] h-44 rounded-full bg-white/5 blur-3xl md:h-56" />
          <div className="absolute inset-x-[18%] bottom-[8%] h-32 rounded-full bg-slate-950/10 blur-3xl md:h-40" />
          {HERO_BACKGROUND_ICONS.map(({ Icon, size, className }, index) => (
            <div
              key={`${Icon.displayName || Icon.name || 'hero-icon'}-${index}`}
              className={`absolute text-white/90 ${className}`}
              aria-hidden="true"
            >
              <Icon size={size} strokeWidth={1.5} />
            </div>
          ))}
        </div>

        <div className="animate-float relative z-10 mb-6">
          <div className="inline-block rounded-2xl border border-white/20 bg-white/20 p-4 backdrop-blur-sm">
            <Gamepad2 className="text-white" size={48} />
          </div>
        </div>

        <h1 className="relative z-10 mb-6 text-5xl font-black tracking-tight text-white md:text-7xl">
          Oyun Dünyasının <br />
          <span className="text-cyan-200">Yeni Kantini</span>
        </h1>

        <p className="relative z-10 mb-10 max-w-2xl text-lg text-purple-100 md:text-xl">
          En uygun fiyatlı E-Pinler, güvenilir oyuncu pazarı ve anında teslimat garantisiyle oyun deneyimini bir üst seviyeye taşı.
        </p>

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row">
          <Link
            to="/store"
            className="rounded-xl bg-white px-8 py-4 text-lg font-bold text-purple-700 shadow-lg transition-all hover:scale-105 hover:bg-purple-50 active:scale-95"
          >
            Mağazaya Göz At
          </Link>
          <Link
            to="/market"
            className="rounded-xl border border-white/25 bg-white/15 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/25 active:scale-95"
          >
            Oyuncu Pazarı
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <h2 className="sr-only">Platform Avantajları</h2>
        {[
          { icon: '⚡', title: 'Anında Teslimat', desc: 'Satın aldığın E-Pin kodları saniyeler içinde hesabına tanımlanır.' },
          { icon: '🛡️', title: '%100 Güvenli', desc: 'Oyuncu pazarında paran havuzda bekler, işlem onaylanınca satıcıya aktarılır.' },
          { icon: '💬', title: '7/24 Destek', desc: 'Yapay zeka destekli botumuz ve canlı destek ekibimiz her zaman yanında.' },
        ].map((f, i) => (
          <div key={i} className="card p-8 hover:shadow-neon-purple">
            <div className="mb-4 text-4xl">{f.icon}</div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </section>

      {(popularGames.length > 0 || !popularGamesLoaded) && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-orange-500 to-red-500" />
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <Flame className="text-orange-500" /> Popüler Kategoriler
              </h2>
            </div>
          </div>

          <div className="min-h-[164px]">
            {popularGames.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {popularGames.map((game) => (
                  <Link
                    key={game.id}
                    to={game.category_slug ? `/categories/${game.category_slug}` : `/market?game=${encodeURIComponent(game.name)}`}
                    className={`bg-gradient-to-br ${game.color} rounded-2xl p-[2px] shadow-md transition-transform hover:scale-105`}
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-white/90 px-3 py-4 text-center backdrop-blur-sm">
                      {game.image_url ? (
                        <img src={game.image_url} alt={game.name} className="mb-2 h-11 w-11 rounded-xl object-contain" />
                      ) : (
                        <span className="mb-2 text-4xl">{game.emoji || '🎮'}</span>
                      )}
                      <span className="text-sm font-bold leading-tight text-gray-800">{game.name}</span>
                    </div>
                  </Link>
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

      {(epins.length > 0 || !epinsLoaded) && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-yellow-400 to-orange-400" />
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <Zap className="text-yellow-500" /> E-Pin Mağazası
              </h2>
            </div>
            <Link to="/store" className="flex items-center gap-1 rounded-full bg-neon-purple/10 px-4 py-2 text-sm font-bold text-neon-purple transition-all hover:bg-neon-purple hover:text-white">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          <div className="min-h-[272px]">
            {epins.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {epins.slice(0, 4).map((epin) => (
                  <EPinCard key={epin.id} epin={epin} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <HomeCardSkeleton key={`epin-skeleton-${index}`} className="h-[272px]" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {(vitrineListings.length > 0 || !listingsLoaded) && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <Zap className="text-amber-500" /> Vitrin İlanlar
              </h2>
            </div>
            <Link to="/market" className="flex items-center gap-1 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-900 transition-all hover:bg-amber-200 hover:text-amber-950">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          <div className="min-h-[356px]">
            {vitrineListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
                {vitrineListings.slice(0, 10).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <HomeCardSkeleton key={`vitrine-skeleton-${index}`} className="h-[356px]" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {(recentListings.length > 0 || !listingsLoaded) && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-neon-green to-emerald-400" />
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <ShieldCheck className="text-neon-green" /> Son İlanlar
              </h2>
            </div>
            <Link to="/market" className="flex items-center gap-1 rounded-full bg-neon-green/10 px-4 py-2 text-sm font-bold text-emerald-700 transition-all hover:bg-neon-green hover:text-white">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          <div className="min-h-[356px]">
            {recentListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
                {recentListings.slice(0, 10).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <HomeCardSkeleton key={`recent-skeleton-${index}`} className="h-[356px]" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
