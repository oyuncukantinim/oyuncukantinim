import { useEffect, useMemo, useState } from 'react';
import { Search, Zap } from 'lucide-react';
import { getEpins } from '../lib/api';
import EPinCard from '../components/EPinCard';

export default function StorePage() {
  const [epins, setEpins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getEpins()
      .then((response) => setEpins(response.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return epins;
    return epins.filter((epin) => epin.title.toLowerCase().includes(query));
  }, [epins, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neon-purple border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="card py-12 text-center">
        <Zap className="mx-auto mb-4 text-yellow-500" size={40} />
        <h1 className="mb-3 text-4xl font-black text-gray-800">E-Pin Mağazası</h1>
        <p className="text-gray-500">Anında teslimat garantisiyle en uygun fiyatlı dijital kodlar.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="E-Pin ara..."
          className="input-field pl-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((epin) => (
          <EPinCard key={epin.id} epin={epin} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          <div className="mb-4 text-5xl">🔍</div>
          <p className="text-lg font-semibold">Sonuç bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
