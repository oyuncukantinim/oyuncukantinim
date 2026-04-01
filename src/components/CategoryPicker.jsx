import { useState, useMemo } from 'react';
import { Search, ChevronRight, X, Check } from 'lucide-react';

/**
 * CategoryPicker
 * props:
 *   categories: flat array from get_categories_tree
 *   value: selected category id (number|null)
 *   onChange: (category) => void  — category object or null
 */
export default function CategoryPicker({ categories = [], value, onChange }) {
  const [search, setSearch] = useState('');
  const [path, setPath] = useState([]); // array of category ids navigated into

  // Seçili kategori objesi
  const selected = useMemo(() => categories.find(c => c.id === value) || null, [categories, value]);

  // Arama sonuçları (tüm ağaçta)
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q) || c.slug.includes(q));
  }, [search, categories]);

  // Belirli bir parent'ın çocukları
  const childrenOf = (parentId) => categories.filter(c => c.parent_id == parentId);

  // Tam yol stringi (breadcrumb)
  const getPath = (catId) => {
    const parts = [];
    let cur = categories.find(c => c.id === catId);
    while (cur) {
      parts.unshift(cur.name);
      cur = cur.parent_id ? categories.find(c => c.id === cur.parent_id) : null;
    }
    return parts.join(' › ');
  };

  // Navigasyon: bir kategoriye tıkla
  const navigate = (cat) => {
    const kids = childrenOf(cat.id);
    if (kids.length > 0) {
      // Alt kategorileri varsa içine gir
      setPath(p => [...p, cat.id]);
      onChange(cat); // kısmen seçili (alt kategori de seçilebilir)
    } else {
      // Yaprak kategori, seçimi tamamla
      onChange(cat);
    }
    setSearch('');
  };

  const goBack = () => {
    setPath(p => {
      const next = p.slice(0, -1);
      const parentId = next[next.length - 1] ?? null;
      onChange(parentId ? categories.find(c => c.id === parentId) || null : null);
      return next;
    });
  };

  const clear = () => { setPath([]); onChange(null); setSearch(''); };

  const currentParentId = path.length > 0 ? path[path.length - 1] : null;
  const currentLevel = childrenOf(currentParentId);
  const breadcrumbCats = path.map(id => categories.find(c => c.id === id)).filter(Boolean);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      {/* Seçili gösterge */}
      {selected && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 border-b border-violet-100">
          <Check size={14} className="text-violet-600 flex-shrink-0" />
          <span className="text-sm font-bold text-violet-700 flex-1">{getPath(selected.id).replace(/ › /g, ' > ')}</span>
          {selected.commission_rate !== null && (
            <span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-2 py-0.5 rounded-full">%{selected.commission_rate} komisyon</span>
          )}
          {selected.min_price !== null && (
            <span className="text-[10px] bg-cyan-100 text-cyan-600 font-bold px-2 py-0.5 rounded-full">Min {selected.min_price}₺</span>
          )}
          <button onClick={clear} className="p-0.5 hover:bg-violet-200 rounded-lg transition-colors">
            <X size={13} className="text-violet-500" />
          </button>
        </div>
      )}

      {/* Arama */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kategori ara..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:border-violet-400"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={12} className="text-gray-400" /></button>}
        </div>
      </div>

      {/* Breadcrumb navigasyon */}
      {path.length > 0 && !search && (
        <div className="flex items-center flex-wrap gap-x-1 gap-y-1 px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs">
          <button type="button" onClick={clear} className="text-gray-500 hover:text-violet-600 font-semibold whitespace-nowrap">Tümü</button>
          {breadcrumbCats.map((cat, i) => (
            <span key={cat.id} className="flex items-center gap-1">
              <span className="text-gray-400 font-bold select-none" aria-hidden> &gt; </span>
              <button
                type="button"
                onClick={() => {
                  const newPath = path.slice(0, i + 1);
                  setPath(newPath);
                  onChange(categories.find(c => c.id === newPath[newPath.length - 1]) || null);
                }}
                className={`whitespace-nowrap font-semibold ${i === path.length - 1 ? 'text-violet-600' : 'text-gray-500 hover:text-violet-600'}`}
              >
                {cat.icon} {cat.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Liste */}
      <div className="max-h-64 overflow-y-auto">
        {search ? (
          // Arama sonuçları
          searchResults.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Sonuç bulunamadı.</div>
          ) : searchResults.map(cat => (
            <button
              key={cat.id}
              onClick={() => { navigate(cat); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-violet-50 text-left transition-colors ${value === cat.id ? 'bg-violet-50' : ''}`}
            >
              <span className="text-lg w-6 text-center">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800">{cat.name}</div>
                <div className="text-xs text-gray-400">{getPath(cat.id)}</div>
              </div>
              {value === cat.id && <Check size={14} className="text-violet-600 flex-shrink-0" />}
              {childrenOf(cat.id).length > 0 && <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}
            </button>
          ))
        ) : currentLevel.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">Kategori bulunamadı.</div>
        ) : (
          // Normal navigasyon
          <>
            {path.length > 0 && (
              <button onClick={goBack} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-50">
                <ChevronRight size={14} className="rotate-180" /> Geri
              </button>
            )}
            {currentLevel.map(cat => {
              const kids = childrenOf(cat.id);
              const isSelected = value === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-50 text-left transition-colors border-b border-gray-50 last:border-0 ${isSelected ? 'bg-violet-50' : ''}`}
                >
                  <span className="text-xl w-7 text-center">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${isSelected ? 'text-violet-700' : 'text-gray-800'}`}>{cat.name}</div>
                    {kids.length > 0 && <div className="text-xs text-gray-400">{kids.length} alt kategori</div>}
                    {cat.min_price !== null && <div className="text-xs text-gray-400">Min: {cat.min_price}₺</div>}
                  </div>
                  {isSelected && <Check size={14} className="text-violet-600 flex-shrink-0" />}
                  {kids.length > 0 && <ChevronRight size={14} className={`flex-shrink-0 ${isSelected ? 'text-violet-400' : 'text-gray-300'}`} />}
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
