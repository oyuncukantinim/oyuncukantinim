import { useState, useEffect } from 'react';
import { Zap, Search } from 'lucide-react';
import { getEpins } from '../lib/api';
import EPinCard from '../components/EPinCard';

export default function StorePage() {
  const [epins, setEpins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState('');

  useEffect(() => {
    getEpins()
      .then(r => setEpins(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const games = [...new Set(epins.map(e => e.game_name))];

  const filtered = epins.filter(e => {
    if (selectedGame && e.game_name !== selectedGame) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.game_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-12 card">
        <Zap className="text-yellow-500 mx-auto mb-4" size={40} />
        <h1 className="text-4xl font-black mb-3">E-Pin Magazasi</h1>
        <p className="text-gray-400">Aninda teslimat garantisiyle en uygun fiyatli dijital kodlar.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="E-Pin ara..."
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedGame('')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!selectedGame ? 'bg-neon-purple text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            Tumu
          </button>
          {games.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGame(g === selectedGame ? '' : g)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedGame === g ? 'bg-neon-purple text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(epin => (
          <EPinCard key={epin.id} epin={epin} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-gray-500 py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-semibold">Sonuc bulunamadi.</p>
        </div>
      )}
    </div>
  );
}
