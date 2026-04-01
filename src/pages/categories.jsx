import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, Tag, X } from 'lucide-react';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

async function fetchPublic(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const json = await res.json();
  return json.data;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchPublic('get_categories_tree')
      .then(d => setCategories(d || []))
      .finally(() => setLoading(false));
  }, []);

  const roots = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const childrenOf = (id) => categories.filter(c => c.parent_id == id);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) || c.slug.includes(q)
    );
  }, [search, categories]);

  const getPath = (catId) => {
    const parts = [];
    let cur = categories.find(c => c.id === catId);
    while (cur) {
      parts.unshift(cur.name);
      cur = cur.parent_id ? categories.find(c => c.id === cur.parent_id) : null;
    }
    return parts.join(' › ');
  };

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1.5 rounded-full">
          <Tag size={12} /> Tüm Kategoriler
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Kategorilere Göz At</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto">İstediğin kategoriyi seç, binlerce ilan seni bekliyor.</p>
      </div>

      {/* Search */}
      <div className="max-w-lg mx-auto relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Kategori ara..."
          className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm shadow-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg">
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {search && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Sonuç bulunamadı.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {searchResults.map(cat => {
                const kids = childrenOf(cat.id);
                return (
                  <Link
                    key={cat.id}
                    to={`/store?category=${cat.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-violet-50 transition-colors group"
                  >
                    <span className="text-2xl w-8 text-center flex-shrink-0">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 group-hover:text-violet-700">{cat.name}</div>
                      <div className="text-xs text-gray-400">{getPath(cat.id)}</div>
                    </div>
                    {kids.length > 0 && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{kids.length} alt kategori</span>
                    )}
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-violet-400 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Category Grid */}
      {!search && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {roots.map(root => {
            const kids = childrenOf(root.id);
            const isExpanded = expanded[root.id];
            const visibleKids = isExpanded ? kids : kids.slice(0, 6);

            return (
              <div key={root.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Root category header */}
                <Link
                  to={`/store?category=${root.id}`}
                  className="block relative overflow-hidden group"
                >
                  {root.image ? (
                    <div className="relative h-32">
                      <img src={root.image} alt={root.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
                        <span className="text-3xl drop-shadow">{root.icon}</span>
                        <div>
                          <div className="font-extrabold text-white text-lg leading-tight">{root.name}</div>
                          {kids.length > 0 && <div className="text-white/70 text-xs">{kids.length} alt kategori</div>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center gap-4 px-5 group-hover:from-violet-100 group-hover:to-indigo-100 transition-colors">
                      <span className="text-4xl">{root.icon}</span>
                      <div>
                        <div className="font-extrabold text-gray-800 text-lg">{root.name}</div>
                        {kids.length > 0 && <div className="text-gray-400 text-xs mt-0.5">{kids.length} alt kategori</div>}
                      </div>
                      <ChevronRight size={16} className="ml-auto text-gray-300 group-hover:text-violet-500 transition-colors" />
                    </div>
                  )}
                </Link>

                {/* Sub-categories */}
                {kids.length > 0 && (
                  <div className="p-3 border-t border-gray-50">
                    <div className="flex flex-wrap gap-1.5">
                      {visibleKids.map(kid => (
                        <Link
                          key={kid.id}
                          to={`/store?category=${kid.id}`}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 hover:bg-violet-50 hover:text-violet-700 text-gray-600 text-xs font-semibold rounded-xl border border-gray-100 hover:border-violet-200 transition-all"
                        >
                          <span>{kid.icon}</span>
                          {kid.name}
                          {childrenOf(kid.id).length > 0 && <ChevronRight size={10} className="text-gray-300" />}
                        </Link>
                      ))}
                    </div>

                    {kids.length > 6 && (
                      <button
                        onClick={() => setExpanded(e => ({ ...e, [root.id]: !e[root.id] }))}
                        className="mt-2 w-full text-xs text-violet-600 hover:text-violet-500 font-bold py-1 text-center hover:bg-violet-50 rounded-lg transition-colors"
                      >
                        {isExpanded ? 'Daha az göster ▲' : `+${kids.length - 6} daha göster ▼`}
                      </button>
                    )}
                  </div>
                )}

                {kids.length === 0 && (
                  <div className="px-4 pb-3">
                    <Link
                      to={`/store?category=${root.id}`}
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs text-violet-600 font-bold hover:bg-violet-50 rounded-xl transition-colors"
                    >
                      İlanları Gör <ChevronRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!search && roots.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Tag size={40} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold">Henüz kategori eklenmemiş.</p>
        </div>
      )}
    </div>
  );
}
