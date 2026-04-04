import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Tag, ChevronRight, ChevronLeft } from 'lucide-react';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

function buildCatSlug(cat) {
  return `${cat.slug}-${cat.id}`;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState(null); // null = Tümü
  const [activeRoot, setActiveRoot] = useState(null); // null = kök liste

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}?action=get_categories_tree`).then(r => r.json()),
      fetch(`${API_URL}?action=get_category_types`).then(r => r.json()),
    ]).then(([catJson, typeJson]) => {
      setCategories(catJson.data || []);
      setTypes(typeJson.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const roots = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const childrenOf = (id) => categories.filter(c => String(c.parent_id) === String(id));

  // Arama aktifken tüm kategorilerde ara
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  // Tür filtresine göre kök kategoriler (Tümü = sadece kökler; tür seçiliyse kökleri + alt kategorileri)
  const filteredRoots = useMemo(() => {
    if (!activeType) return roots;
    return roots.filter(r => String(r.type_id) === String(activeType));
  }, [roots, activeType]);

  // Tür seçiliyse o türün tüm kategorileri (kök + alt)
  const filteredAll = useMemo(() => {
    if (!activeType) return [];
    const typeRootIds = new Set(filteredRoots.map(r => r.id));
    return categories.filter(c =>
      String(c.type_id) === String(activeType) ||
      (c.parent_id && typeRootIds.has(Number(c.parent_id)))
    );
  }, [activeType, filteredRoots, categories]);

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  const isSearching = search.trim().length > 0;
  const isInSubLevel = activeRoot !== null && !isSearching;
  const subCats = isInSubLevel ? childrenOf(activeRoot.id) : [];
  const rootCat = activeRoot;

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

      {/* Tür filtre chipleri */}
      {!isSearching && !isInSubLevel && types.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveType(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
              activeType === null
                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
            }`}
          >
            Tümü
          </button>
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveType(activeType === t.id ? null : t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                activeType === t.id
                  ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
              }`}
            >
              <span>{t.icon}</span> {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Alt kategori başlığı */}
      {isInSubLevel && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveRoot(null)}
            className="flex items-center gap-1.5 text-sm font-bold text-violet-600 hover:text-violet-800 transition-colors"
          >
            <ChevronLeft size={16} /> Tüm Kategoriler
          </button>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-sm font-extrabold text-gray-800">{rootCat.name}</span>
        </div>
      )}

      {/* Arama sonuçları */}
      {isSearching && (
        <>
          {searchResults.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Tag size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Kategori bulunamadı.</p>
            </div>
          ) : (
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
              {searchResults.map(cat => (
                <CategoryCard key={cat.id} cat={cat} isRoot={!cat.parent_id} onClick={null} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Kök kategoriler (Tümü) veya tür filtrelenmiş liste */}
      {!isSearching && !isInSubLevel && (
        <>
          {activeType ? (
            /* Tür seçiliyse: kök + alt kategorileri düz liste olarak göster */
            filteredAll.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Tag size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-semibold">Bu türde kategori bulunamadı.</p>
              </div>
            ) : (
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
                {filteredAll.map(cat => {
                  const kids = childrenOf(cat.id);
                  const isRoot = !cat.parent_id;
                  return (
                    <CategoryCard
                      key={cat.id}
                      cat={cat}
                      isRoot={isRoot}
                      onClick={isRoot && kids.length > 0 ? () => setActiveRoot(cat) : null}
                    />
                  );
                })}
              </div>
            )
          ) : (
            /* Tümü: sadece kök kategoriler */
            filteredRoots.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Tag size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-semibold">Kategori bulunamadı.</p>
              </div>
            ) : (
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
                {filteredRoots.map(cat => {
                  const kids = childrenOf(cat.id);
                  return (
                    <CategoryCard
                      key={cat.id}
                      cat={cat}
                      isRoot={true}
                      onClick={kids.length > 0 ? () => setActiveRoot(cat) : null}
                    />
                  );
                })}
              </div>
            )
          )}
        </>
      )}

      {/* Alt kategoriler */}
      {isInSubLevel && (
        <>
          {subCats.length === 0 ? (
            /* Kök kategorinin kendisine giden link */
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Alt kategori yok.</p>
              <Link to={`/categories/${buildCatSlug(rootCat)}`} className="text-violet-600 font-bold hover:underline text-sm mt-2 inline-block">
                {rootCat.name} ilanlarını gör →
              </Link>
            </div>
          ) : (
            <>
              {/* Ana kategoriye giriş butonu */}
              <Link
                to={`/categories/${buildCatSlug(rootCat)}`}
                className="flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-200 rounded-2xl hover:bg-violet-100 transition-colors text-sm font-bold text-violet-700"
              >
                Tüm "{rootCat.name}" İlanlarını Gör
                <ChevronRight size={15} className="ml-auto" />
              </Link>
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
                {subCats.map(cat => (
                  <CategoryCard
                    key={cat.id}
                    cat={cat}
                    isRoot={false}
                    onClick={null}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function CategoryCard({ cat, isRoot, onClick }) {
  const slug = `${cat.slug}-${cat.id}`;
  const inner = (
    <div
      className="group relative mx-auto flex h-[250px] w-[160px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
    >
      {/* Image / Gradient background */}
      {cat.image ? (
        <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${
          isRoot ? 'from-violet-500 to-purple-700' : 'from-indigo-400 to-violet-500'
        } flex items-center justify-center`}>
          <span className="text-6xl opacity-30">{cat.icon}</span>
        </div>
      )}

      {/* Sadece alt kısımda hafif gradient */}

      {/* Badge */}

      {/* Alt içerik */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
        <div className="max-w-full rounded-xl bg-black/42 px-3 py-1.5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-[1px]">
          <div className="line-clamp-2 text-sm font-bold leading-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
            {cat.name}
          </div>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return <div onClick={onClick}>{inner}</div>;
  }
  return <Link to={`/categories/${slug}`}>{inner}</Link>;
}
