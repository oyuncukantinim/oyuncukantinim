import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Tag } from 'lucide-react';
import useCategoriesTree from '../hooks/useCategoriesTree';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

function buildCatSlug(cat) {
  return `${cat.slug}-${cat.id}`;
}

function CategoryCard({ cat, isRoot }) {
  const slug = buildCatSlug(cat);

  return (
    <Link to={`/categories/${slug}`}>
      <div className="group relative mx-auto flex h-[250px] w-[160px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
        {cat.image ? (
          <img
            src={cat.image}
            alt={cat.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
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
  const { categories } = useCategoriesTree();
  const [types, setTypes] = useState([]);
  const [typesLoaded, setTypesLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState(null);
  // Show skeletons only while we have no data at all; if cache hydrated
  // categories synchronously we can render immediately.
  const loading = categories.length === 0 && !typesLoaded;

  useEffect(() => {
    fetch(`${API_URL}?action=get_category_types`)
      .then((r) => r.json())
      .then((typeJson) => setTypes(typeJson.data || []))
      .catch(() => {})
      .finally(() => setTypesLoaded(true));
  }, []);

  const roots = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const filteredRoots = useMemo(() => {
    if (!activeType) return roots;
    return roots.filter((r) => String(r.type_id) === String(activeType));
  }, [roots, activeType]);

  const filteredAll = useMemo(() => {
    if (!activeType) return [];
    const typeRootIds = new Set(filteredRoots.map((r) => r.id));
    return categories.filter(
      (c) => String(c.type_id) === String(activeType) || (c.parent_id && typeRootIds.has(Number(c.parent_id))),
    );
  }, [activeType, filteredRoots, categories]);

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

      {!isSearching && types.length > 0 && (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveType(null)}
            className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-all ${
              activeType === null
                ? 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-200'
                : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300'
            }`}
          >
            Tümü
          </button>
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveType(activeType === t.id ? null : t.id)}
              className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                activeType === t.id
                  ? 'border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-200'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300'
              }`}
            >
              <span>{t.icon}</span> {t.name}
            </button>
          ))}
        </div>
      )}

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
          {activeType ? (
            filteredAll.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <Tag size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-semibold">Bu türde kategori bulunamadı.</p>
              </div>
            ) : (
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
                {filteredAll.map((cat) => (
                  <CategoryCard key={cat.id} cat={cat} isRoot={!cat.parent_id} />
                ))}
              </div>
            )
          ) : filteredRoots.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <Tag size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Kategori bulunamadı.</p>
            </div>
          ) : (
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
              {filteredRoots.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} isRoot />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
