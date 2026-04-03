import { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Search, X } from 'lucide-react';

function CategoryCard({ category, selected, hasChildren, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-slate-100 text-left shadow-sm transition-all ${
        selected
          ? 'border-violet-400 ring-2 ring-violet-200'
          : 'border-gray-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md'
      }`}
      style={{ aspectRatio: '120 / 190' }}
    >
      {category.image ? (
        <img src={category.image} alt={category.name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
          <span className="text-4xl opacity-80">{category.icon || '📁'}</span>
        </div>
      )}

      {selected && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg">
          <Check size={13} />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5">
        <div className="line-clamp-2 text-[13px] font-bold leading-tight text-white" style={{ textShadow: '0 1px 10px rgba(0,0,0,0.85)' }}>
          {category.name}
        </div>
        {subtitle ? (
          <div className="mt-0.5 line-clamp-1 text-[10px] text-white/90" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default function CategoryPicker({ categories = [], value, onChange }) {
  const [search, setSearch] = useState('');
  const [path, setPath] = useState([]);

  const selected = useMemo(() => categories.find((category) => category.id === value) || null, [categories, value]);

  const childrenOf = (parentId) => categories.filter((category) => category.parent_id == parentId);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    return categories.filter(
      (category) => category.name.toLowerCase().includes(query) || String(category.slug || '').toLowerCase().includes(query),
    );
  }, [search, categories]);

  const getPath = (categoryId) => {
    const parts = [];
    let current = categories.find((category) => category.id === categoryId);

    while (current) {
      parts.unshift(current.name);
      current = current.parent_id ? categories.find((category) => category.id === current.parent_id) : null;
    }

    return parts.join(' > ');
  };

  const navigate = (category) => {
    const children = childrenOf(category.id);

    if (children.length > 0) {
      setPath((prev) => [...prev, category.id]);
      onChange(null);
    } else {
      onChange(category);
    }

    setSearch('');
  };

  const goBack = () => {
    setPath((prev) => {
      const next = prev.slice(0, -1);
      onChange(null);
      return next;
    });
  };

  const clear = () => {
    setPath([]);
    onChange(null);
    setSearch('');
  };

  const breadcrumbCats = path.map((id) => categories.find((category) => category.id === id)).filter(Boolean);
  const currentParentId = path.length > 0 ? path[path.length - 1] : null;
  const currentLevel = childrenOf(currentParentId);

  const renderCards = (items, withPath = false) => (
    <div className="grid grid-cols-3 gap-3 p-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {items.map((category) => {
        const children = childrenOf(category.id);
        const hasChildren = children.length > 0;
        const isSelected = value === category.id;
        const subtitle = withPath
          ? getPath(category.id)
          : category.min_price != null
              ? `Min ${category.min_price}₺`
              : '';

        return (
          <CategoryCard
            key={category.id}
            category={category}
            selected={isSelected}
            hasChildren={hasChildren}
            subtitle={subtitle}
            onClick={() => navigate(category)}
          />
        );
      })}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-700">
              <span>İlan Kategorileri</span>
              {path.length > 0 &&
                breadcrumbCats.map((category, index) => (
                  <span key={category.id} className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-gray-300" />
                    <button
                      type="button"
                      onClick={() => {
                        const nextPath = path.slice(0, index + 1);
                        setPath(nextPath);
                        onChange(null);
                      }}
                      className={`transition-colors ${
                        index === path.length - 1 ? 'text-violet-600' : 'text-gray-500 hover:text-violet-600'
                      }`}
                    >
                      {category.name}
                    </button>
                  </span>
                ))}
            </div>
            <div className="mt-1 text-xs text-gray-400">
              {path.length > 0
                ? 'Alt seviyeden seçim yapabilir veya geri dönebilirsiniz.'
                : 'Görselli kategori kartlarından seçim yaparak devam edin.'}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {path.length > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-600"
              >
                <ArrowLeft size={13} />
                Geri
              </button>
            )}
            {selected && (
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-600"
              >
                <X size={13} />
                Temizle
              </button>
            )}
            <div className="relative min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filtreleme yapın..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-9 text-sm text-gray-700 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[460px] overflow-y-auto bg-gray-50/60">
        {search ? (
          searchResults.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-400">Sonuç bulunamadı.</div>
          ) : (
            renderCards(searchResults, true)
          )
        ) : currentLevel.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-400">Kategori bulunamadı.</div>
        ) : (
          renderCards(currentLevel)
        )}
      </div>
    </div>
  );
}
