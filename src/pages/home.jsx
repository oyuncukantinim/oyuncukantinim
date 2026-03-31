import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Zap, ChevronRight, ShieldCheck, Gamepad2 } from 'lucide-react';
import { getListings, getEpins } from '../lib/api';
import { GAMES } from '../data/catalog';
import ListingCard from '../components/ListingCard';
import EPinCard from '../components/EPinCard';

export default function Home() {
  const [listings, setListings] = useState([]);
  const [epins, setEpins] = useState([]);

  useEffect(() => {
    getListings().then(r => setListings(r.data || [])).catch(() => {});
    getEpins().then(r => setEpins(r.data || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-16">

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center py-20 px-4 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/15 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-neon-cyan/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="animate-float mb-6">
          <div className="bg-gradient-to-tr from-neon-purple to-neon-cyan p-4 rounded-2xl shadow-neon-purple inline-block">
            <Gamepad2 className="text-white" size={48} />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 relative z-10">
          Oyun Dunyasinin <br />
          <span className="glow-text">Yeni Kantini</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 relative z-10">
          En uygun fiyatli E-Pinler, guvenilir oyuncu pazari ve aninda teslimat garantisiyle oyun deneyimini bir ust seviyeye tasi.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <Link to="/store" className="btn-primary text-lg py-4 px-8 shadow-neon-purple">
            Magazaya Goz At
          </Link>
          <Link to="/market" className="btn-secondary text-lg py-4 px-8">
            Oyuncu Pazari
          </Link>
        </div>
      </section>

      {/* OZELLIKLER */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '⚡', title: 'Aninda Teslimat', desc: 'Satin aldigin E-Pin kodlari saniyeler icinde hesabina tanimlanir.' },
          { icon: '🛡️', title: '%100 Guvenli', desc: 'Oyuncu pazarinda paran havuzda bekler, islem onaylaninca saticiya aktarilir.' },
          { icon: '💬', title: '7/24 Destek', desc: 'Yapay zeka destekli botumuz ve canli destek ekibimiz her zaman yaninda.' },
        ].map((f, i) => (
          <div key={i} className="card p-8 hover:bg-white/5">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-xl font-bold mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* POPULER OYUNLAR */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="text-orange-500" /> Populer Oyunlar
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {GAMES.map(game => (
            <Link
              key={game.id}
              to={`/market?game=${encodeURIComponent(game.name)}`}
              className={`bg-gradient-to-br ${game.color} p-[1px] rounded-2xl hover:scale-105 transition-transform`}
            >
              <div className="bg-dark-800/80 backdrop-blur-sm h-full w-full rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-2">{game.emoji}</span>
                <span className="text-white font-bold text-sm">{game.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* INDIRIMLI E-PINLER */}
      {epins.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="text-yellow-500" /> E-Pin Magazasi
            </h2>
            <Link to="/store" className="text-neon-purple font-semibold hover:text-neon-cyan flex items-center text-sm transition-colors">
              Tumunu Gor <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {epins.slice(0, 4).map(epin => (
              <EPinCard key={epin.id} epin={epin} />
            ))}
          </div>
        </section>
      )}

      {/* SON ILANLAR */}
      {listings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-neon-green" /> Son Ilanlar
            </h2>
            <Link to="/market" className="text-neon-purple font-semibold hover:text-neon-cyan flex items-center text-sm transition-colors">
              Tumunu Gor <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.slice(0, 4).map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
