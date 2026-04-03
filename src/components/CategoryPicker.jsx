import { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Search, X } from 'lucide-react';

function CategoryVisualCard({ category, selected, hasChildren, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border text-left transition-all ${
        selected
          ? 'border-violet-400 ring-2 ring-violet-300/60'
          : 'border-slate-700/80 hover:-translate-y-0.5 hover:border-violet-400/60'
      }`}
      style={{ aspectRatio: '190 / 138' }}
    >
      {category.image ? (
        <img src={category.image} alt={category.name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
          <span className="text-5xl opacity-80">{category.icon || 'ğŸ“'}</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-slate-900/10" />

      <div className="absolute right-2 top-2 flex items-center gap-1">
        {hasChildren && (
          <span className="rounded-full bg-black/35 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            Alt Kategori
          </span>
        )}
        {selected && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg">
            <Check size={13} />
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="line-clamp-2 text-sm font-bold leading-tight text-white drop-shadow-sm">{category.name}</div>
        {subtitle ? <div className="mt-1 line-clamp-1 text-[11px] text-white/75">{subtitle}</div> : null}
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

  const currentParentId = path.length > 0 ? path[path.length - 1] : null;
  const currentParent = currentParentId ? categories.find((category) => category.id === currentParentId) : null;
  const currentLevel = childrenOf(currentParentId);
  const breadcrumbCats = path.map((id) => categories.find((category) => category.id === id)).filter(Boolean);

  const renderCards = (items, withPath = false) => (
    <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((category) => {
        const children = childrenOf(category.id);
        const hasChildren = children.length > 0;
        const isSelected = value === category.id;
        const subtitle = withPath
          ? getPath(category.id)
          : hasChildren
            ? `${children.length} alt kategori`
            : category.min_price != null
              ? `Min ${category.min_price}â‚º`
              : '';

        return (
          <CategoryVisualCard
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
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#2d3046] shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
      <div className="border-b border-white/5 px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white/80">
              <span>Ä°lan Kategorileri</span>
              {path.length > 0 &&
                breadcrumbCats.map((category, index) => (
                  <span key={category.id} className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-white/35" />
                    <button
                      onClick={() => {
                        const nextPath = path.slice(0, index + 1);
                        setPath(nextPath);
                        onChange(null);
                      }}
                      className={`transition-colors ${
                        index === path.length - 1 ? 'text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {category.name}
                    </button>
                  </span>
                ))}
            </div>
            {currentParent ? (
              <div className="mt-1 text-xs text-white/45">Bu kategorinin alt baÅŸlÄ±klarÄ±ndan seÃ§im yapabilirsiniz.</div>
            ) : (
              <div className="mt-1 text-xs text-white/45">Kategori gÃ¶rsellerine tÄ±klayarak alt seviyelere inebilirsiniz.</div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {path.length > 0 && (
              <button
                onClick={goBack}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft size={13} />
                Geri
              </button>
            )}
            {selected && (
              <button
                onClick={clear}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={13} />
                Temizle
              </button>
            )}
            <div className="relative min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filtreleme yapÄ±n..."
                className="w-full rounded-xl border border-white/10 bg-white/10 py-2 pl-9 pr-9 text-sm text-white placeholder:text-white/35 focus:border-violet-400 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto bg-[#30344d]">
        {search ? (
          searchResults.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-white/45">SonuÃ§ bulunamadÄ±.</div>
          ) : (
            renderCards(searchResults, true)
          )
        ) : currentLevel.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-white/45">Kategori bulunamadÄ±.</div>
        ) : (
          renderCards(currentLevel)
        )}
      </div>
    </div>
  );
}

