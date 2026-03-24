import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="space-y-20">
      
      {/* HERO BÖLÜMÜ (Karşılama Ekranı) */}
      <section className="relative flex flex-col items-center justify-center text-center py-20 px-4">
        {/* Arka plan parlama efekti */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-purple-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 relative z-10">
          Oyun Dünyasının <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">
            Yeni Kantini
          </span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 relative z-10">
          En uygun fiyatlı E-Pinler, güvenilir oyuncu pazarı ve anında teslimat garantisiyle oyun deneyimini bir üst seviyeye taşı.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <Link to="/store" className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-4 px-8 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)]">
            Mağazaya Göz At
          </Link>
          <Link to="/market" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-8 rounded-2xl transition-all hover:scale-105 active:scale-95">
            Oyuncu Pazarı
          </Link>
        </div>
      </section>

      {/* ÖZELLİKLER BÖLÜMÜ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/5 p-8 rounded-3xl hover:bg-white/10 transition-colors">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-bold mb-2">Anında Teslimat</h3>
          <p className="text-gray-400 text-sm">Satın aldığın E-Pin kodları saniyeler içinde hesabına veya profiline tanımlanır.</p>
        </div>
        <div className="bg-white/5 border border-white/5 p-8 rounded-3xl hover:bg-white/10 transition-colors">
          <div className="text-4xl mb-4">🛡️</div>
          <h3 className="text-xl font-bold mb-2">%100 Güvenli</h3>
          <p className="text-gray-400 text-sm">Oyuncu pazarında paran havuzda bekler, işlem onaylanınca satıcıya aktarılır.</p>
        </div>
        <div className="bg-white/5 border border-white/5 p-8 rounded-3xl hover:bg-white/10 transition-colors">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-xl font-bold mb-2">7/24 Destek</h3>
          <p className="text-gray-400 text-sm">Yapay zeka destekli botumuz ve canlı destek ekibimiz her zaman yanında.</p>
        </div>
      </section>

      {/* POPÜLER OYUNLAR (Hızlı Kısayollar) */}
      <section className="py-10 text-center">
        <h2 className="text-3xl font-bold mb-8">Popüler Kategoriler</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {['Valorant', 'League of Legends', 'PUBG Mobile', 'CS:GO', 'Roblox', 'Steam'].map((game) => (
            <Link key={game} to="/store" className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/10 transition-all font-medium">
              {game}
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}