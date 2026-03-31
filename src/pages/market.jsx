import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import { getListings } from '../lib/api';
import { GAMES, SORT_OPTIONS } from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';

export default function MarketPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState(searchParams.get('game') || '');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    setLoading(true);
    const query = {};
    if (selectedGame) query.game = selectedGame;
    if (sort) query.sort = sort;
    if (search) query.search = search;

    getListings(query)
      .then(r => setListings(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedGame, sort, search]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card p-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2">Oyuncu Pazari</h1>
          <p className="text-gray-400">Diger oyunculardan hesap, esya ve boost hizmeti satin al.</p>
        </div>
        {user && (
          <Link to="/create" className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={20} /> Ilan Ekle
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ilan ara..."
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-gray-500" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="input-field w-auto min-w-[140px]"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedGame('')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!selectedGame ? 'bg-neon-purple text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
          >
            Tum Oyunlar
          </button>
          {GAMES.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGame(g.name === selectedGame ? '' : g.name)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1 ${selectedGame === g.name ? 'bg-neon-purple text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {g.emoji} {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <div className="text-5xl mb-4">🏪</div>
          <p className="text-lg font-semibold mb-2">Henuz ilan yok.</p>
          {user && (
            <Link to="/create" className="text-neon-purple font-bold hover:underline">Ilk ilani sen ekle!</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
