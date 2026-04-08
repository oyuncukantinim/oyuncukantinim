import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Zap, ChevronRight, ShieldCheck, Gamepad2 } from 'lucide-react';
import { getListings, getEpins } from '../lib/api';
import ListingCard from '../components/ListingCard';
import EPinCard from '../components/EPinCard';
import useSiteBrand from '../hooks/useSiteBrand';
import { hasListingDopingType } from '../lib/doping';

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
    <div className="space-y-16">
      <section className="relative left-1/2 -mt-8 flex w-screen -translate-x-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 px-6 py-20 text-center">
        <div className="absolute left-0 top-0 h-[400px] w-[400px] rounded-full bg-white/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-cyan-400/20 blur-[80px] pointer-events-none" />
        <div className="absolute right-10 top-10 opacity-10 pointer-events-none">
          <Gamepad2 size={200} className="text-white" />
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
                <Flame className="text-orange-500" /> Popüler Oyunlar
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
            <Link to="/market" className="flex items-center gap-1 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-600 transition-all hover:bg-amber-500 hover:text-white">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          <div className="min-h-[356px]">
            {vitrineListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {vitrineListings.slice(0, 10).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
            <Link to="/market" className="flex items-center gap-1 rounded-full bg-neon-green/10 px-4 py-2 text-sm font-bold text-neon-green transition-all hover:bg-neon-green hover:text-white">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          <div className="min-h-[356px]">
            {recentListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {recentListings.slice(0, 10).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
