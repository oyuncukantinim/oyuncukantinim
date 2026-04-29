import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Tag, X } from 'lucide-react';
import { getCategories } from '../lib/api';

function CategoryCard({ cat, isRoot }) {
  const slug = cat.slug || cat.id;

  return (
    <Link to={`/categories/${slug}`}>
      <div className="group relative mx-auto flex h-[250px] w-[160px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
        {cat.image ? (
          <img src={cat.image} alt={cat.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${
              isRoot ? 'from-violet-500 to-purple-700' : 'from-indigo-400 to-violet-500'
            }`}
          >
            <span className="text-6xl opacity-30">{cat.icon}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
          <div className="max-w-full rounded-xl bg-black/42 px-3 py-1.5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-[1px]">
            <div className="line-clamp-2 text-sm font-bold leading-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
              {cat.name}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCategories()
      .then((response) => {
        setCategories(response.data || []);
      })
      .catch(() => {
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const rootCategories = useMemo(() => categories.filter((category) => !category.parent_id), [categories]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return categories.filter((c) => String(c.name || '').toLowerCase().includes(q));
  }, [categories, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  const isSearching = search.trim().length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-violet-500 to-purple-600" />
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Kategoriler</h1>
          <p className="text-sm text-gray-500">{categories.length} kategori listeleniyor</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kategori ara..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-8 text-sm shadow-sm focus:border-violet-400 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X size={13} className="text-gray-400" />
          </button>
        )}
      </div>

      {isSearching && (
        <>
          {searchResults.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <Tag size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Kategori bulunamadı.</p>
            </div>
          ) : (
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
              {searchResults.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} isRoot={!cat.parent_id} />
              ))}
            </div>
          )}
        </>
      )}

      {!isSearching && (
        <>
          {rootCategories.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <Tag size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Kategori bulunamadı.</p>
            </div>
          ) : (
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
              {rootCategories.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} isRoot={!cat.parent_id} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
