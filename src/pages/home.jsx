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
      <section className="relative flex flex-col items-center justify-center text-center py-20 px-6 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 shadow-xl">
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
          Oyun Dunyasinin <br />
          <span className="text-cyan-200">Yeni Kantini</span>
        </h1>

        <p className="text-purple-100 text-lg md:text-xl max-w-2xl mb-10 relative z-10">
          En uygun fiyatli E-Pinler, guvenilir oyuncu pazari ve aninda teslimat garantisiyle oyun deneyimini bir ust seviyeye tasi.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <Link to="/store" className="bg-white text-purple-700 font-bold text-lg py-4 px-8 rounded-xl hover:bg-purple-50 transition-all hover:scale-105 active:scale-95 shadow-lg">
            Magazaya Goz At
          </Link>
          <Link to="/market" className="bg-white/15 backdrop-blur-sm border border-white/25 text-white font-bold text-lg py-4 px-8 rounded-xl hover:bg-white/25 transition-all hover:scale-105 active:scale-95">
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
          <div key={i} className="card p-8 hover:shadow-neon-purple">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* POPULER OYUNLAR */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Flame className="text-orange-500" /> Populer Oyunlar
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {GAMES.map(game => (
            <Link
              key={game.id}
              to={`/market?game=${encodeURIComponent(game.name)}`}
              className={`bg-gradient-to-br ${game.color} p-[2px] rounded-2xl hover:scale-105 transition-transform shadow-md`}
            >
              <div className="bg-white/90 backdrop-blur-sm h-full w-full rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-2">{game.emoji}</span>
                <span className="text-gray-800 font-bold text-sm">{game.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* INDIRIMLI E-PINLER */}
      {epins.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
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
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
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
