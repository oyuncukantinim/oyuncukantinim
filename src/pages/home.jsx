import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Zap, ChevronRight, ShieldCheck, Gamepad2 } from 'lucide-react';
import { getListings, getEpins } from '../lib/api';
import ListingCard from '../components/ListingCard';
import EPinCard from '../components/EPinCard';
import useSiteBrand from '../hooks/useSiteBrand';
import { hasListingDopingType } from '../lib/doping';

export default function Home() {
  const { defaultListingImage } = useSiteBrand();
  const [listings, setListings] = useState([]);
  const [epins, setEpins] = useState([]);
  const [popularGames, setPopularGames] = useState([]);

  useEffect(() => {
    getListings().then(r => setListings(r.data || [])).catch(() => {});
    getEpins().then(r => setEpins(r.data || [])).catch(() => {});
    fetch('https://api.oyuncukantinim.com.tr/api.php?action=get_popular_games')
      .then(r => r.json())
      .then(j => setPopularGames(j.data || []))
      .catch(() => {});
  }, []);

  const vitrineListings = listings.filter((listing) => hasListingDopingType(listing, 'vitrine'));
  const recentListings = listings.filter((listing) => !hasListingDopingType(listing, 'vitrine'));

  return (
    <div className="space-y-16">

      {/* HERO - w-screen + translate ile gercek tam genislik */}
      <section className="relative flex flex-col items-center justify-center text-center py-20 px-6 overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 w-screen left-1/2 -translate-x-1/2 -mt-8">
        {/* Dekoratif parlama efektleri */}
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-white/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-cyan-400/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-10 opacity-10 pointer-events-none">
          <Gamepad2 size={200} className="text-white" />
        </div>

        <div className="animate-float mb-6 relative z-10">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl inline-block border border-white/20">
            <Gamepad2 className="text-white" size={48} />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 relative z-10 text-white">
          Oyun Dünyasının <br />
          <span className="text-cyan-200">Yeni Kantini</span>
        </h1>

        <p className="text-purple-100 text-lg md:text-xl max-w-2xl mb-10 relative z-10">
          En uygun fiyatlı E-Pinler, güvenilir oyuncu pazarı ve anında teslimat garantisiyle oyun deneyimini bir üst seviyeye taşı.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <Link to="/store" className="bg-white text-purple-700 font-bold text-lg py-4 px-8 rounded-xl hover:bg-purple-50 transition-all hover:scale-105 active:scale-95 shadow-lg">
            Mağazaya Göz At
          </Link>
          <Link to="/market" className="bg-white/15 backdrop-blur-sm border border-white/25 text-white font-bold text-lg py-4 px-8 rounded-xl hover:bg-white/25 transition-all hover:scale-105 active:scale-95">
            Oyuncu Pazari
          </Link>
        </div>
      </section>

      {/* OZELLIKLER */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '⚡', title: 'Anında Teslimat', desc: 'Satın aldığın E-Pin kodları saniyeler içinde hesabına tanımlanır.' },
          { icon: '🛡️', title: '%100 Güvenli', desc: 'Oyuncu pazarında paran havuzda bekler, işlem onaylanınca satıcıya aktarılır.' },
          { icon: '💬', title: '7/24 Destek', desc: 'Yapay zeka destekli botumuz ve canlı destek ekibimiz her zaman yanında.' },
        ].map((f, i) => (
          <div key={i} className="card p-8 hover:shadow-neon-purple">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* POPULER OYUNLAR */}
      {popularGames.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Flame className="text-orange-500" /> Popüler Oyunlar
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {popularGames.map(game => (
              <Link
                key={game.id}
                to={game.category_slug ? `/categories/${game.category_slug}` : `/market?game=${encodeURIComponent(game.name)}`}
                className={`bg-gradient-to-br ${game.color} p-[2px] rounded-2xl hover:scale-105 transition-transform shadow-md`}
              >
                <div className="bg-white/90 backdrop-blur-sm h-full w-full rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                  {game.image_url
                    ? <img src={game.image_url} alt={game.name} className="w-12 h-12 object-contain mb-2 rounded-xl" />
                    : <span className="text-4xl mb-2">{game.emoji || '🎮'}</span>
                  }
                  <span className="text-gray-800 font-bold text-sm">{game.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* INDIRIMLI E-PINLER */}
      {epins.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Zap className="text-yellow-500" /> E-Pin Mağazası
              </h2>
            </div>
            <Link to="/store" className="flex items-center gap-1 text-sm font-bold text-neon-purple bg-neon-purple/10 hover:bg-neon-purple hover:text-white px-4 py-2 rounded-full transition-all">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {epins.slice(0, 4).map(epin => (
              <EPinCard key={epin.id} epin={epin} />
            ))}
          </div>
        </section>
      )}

      {/* VITRIN ILANLAR */}
      {vitrineListings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Zap className="text-amber-500" /> Vitrin İlanlar
              </h2>
            </div>
            <Link to="/market" className="flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white px-4 py-2 rounded-full transition-all">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {vitrineListings.slice(0, 10).map((listing) => (
              <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
            ))}
          </div>
        </section>
      )}

      {/* SON ILANLAR */}
      {recentListings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-neon-green to-emerald-400 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="text-neon-green" /> Son İlanlar
              </h2>
            </div>
            <Link to="/market" className="flex items-center gap-1 text-sm font-bold text-neon-green bg-neon-green/10 hover:bg-neon-green hover:text-white px-4 py-2 rounded-full transition-all">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentListings.slice(0, 10).map(listing => (
              <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
