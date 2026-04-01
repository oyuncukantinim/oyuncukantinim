import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Tag } from 'lucide-react';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

function buildCatSlug(cat) {
  return `${cat.slug}-${cat.id}`;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeRoot, setActiveRoot] = useState(null); // null = Tümü

  useEffect(() => {
    fetch(`${API_URL}?action=get_categories_tree`)
      .then(r => r.json())
      .then(j => setCategories(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  const roots = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const childrenOf = (id) => categories.filter(c => c.parent_id == id);

  // Displayed categories based on filter + search
  const displayed = useMemo(() => {
    let list = categories;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = categories.filter(c => c.name.toLowerCase().includes(q));
    } else if (activeRoot !== null) {
      // show the root + its children
      list = categories.filter(c => c.id === activeRoot || c.parent_id === activeRoot);
    }
    return list;
  }, [categories, search, activeRoot]);

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Kategoriler</h1>
          <p className="text-sm text-gray-500">{categories.length} kategori listeleniyor</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveRoot(null); }}
          placeholder="Kategori ara..."
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:border-violet-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X size={13} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      {!search && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveRoot(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
              activeRoot === null
                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
            }`}
          >
            Tümü
          </button>
          {roots.map(r => (
            <button
              key={r.id}
              onClick={() => setActiveRoot(activeRoot === r.id ? null : r.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                activeRoot === r.id
                  ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
              }`}
            >
              <span>{r.icon}</span> {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Category grid */}
      {displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Tag size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold">Kategori bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayed.map(cat => {
            const kids = childrenOf(cat.id);
            const isRoot = !cat.parent_id;
            return (
              <Link
                key={cat.id}
                to={`/categories/${buildCatSlug(cat)}`}
                className="group relative flex flex-col rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-white"
                style={{ height: '250px' }}
              >
                {/* Image / Gradient background */}
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    isRoot
                      ? 'from-violet-500 to-purple-700'
                      : 'from-indigo-400 to-violet-500'
                  } flex items-center justify-center`}>
                    <span className="text-6xl opacity-40">{cat.icon}</span>
                  </div>
                )}

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent group-hover:from-black/85 transition-all" />

                {/* Root badge */}
                {isRoot && (
                  <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/30">
                    Ana
                  </div>
                )}
                {kids.length > 0 && (
                  <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {kids.length} alt
                  </div>
                )}

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-end gap-2">
                    <span className="text-2xl drop-shadow flex-shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className="text-white font-bold text-sm leading-tight line-clamp-2">{cat.name}</div>
                      {cat.effective_commission !== null && cat.effective_commission !== undefined && (
                        <div className="text-white/60 text-[10px] mt-0.5">%{cat.effective_commission} komisyon</div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
