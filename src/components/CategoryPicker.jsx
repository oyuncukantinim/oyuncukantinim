import { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Search, X } from 'lucide-react';

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

  const renderCategoryCard = (category, { showPath = false } = {}) => {
    const children = childrenOf(category.id);
    const hasChildren = children.length > 0;
    const isSelected = value === category.id;

    return (
      <button
        key={category.id}
        onClick={() => navigate(category)}
        className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all ${
          isSelected
            ? 'border-violet-200 bg-violet-50 shadow-sm'
            : 'border-gray-100 bg-white hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/60'
        }`}
      >
        <span
          className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm ${
            isSelected ? 'bg-violet-100' : 'bg-slate-100'
          }`}
        >
          {category.icon || '📁'}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`text-sm font-bold ${isSelected ? 'text-violet-700' : 'text-gray-800'}`}>{category.name}</div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                hasChildren ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {hasChildren ? 'Alt kategori' : 'Seçilebilir'}
            </span>
          </div>

          {showPath ? (
            <div className="mt-1 line-clamp-2 text-xs text-gray-400">{getPath(category.id)}</div>
          ) : (
            <div className="mt-1 text-xs text-gray-400">
              {hasChildren ? `${children.length} alt kategori arasından seçim yapın` : 'Bu kategoriyle bir sonraki adıma geçebilirsiniz'}
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {category.min_price !== null && (
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-600">
                Min {category.min_price}₺
              </span>
            )}
            {category.commission_rate !== null && (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                %{category.commission_rate} komisyon
              </span>
            )}
          </div>
        </div>

        {isSelected && <Check size={16} className="flex-shrink-0 text-violet-600" />}
        {hasChildren && <ChevronRight size={16} className={`flex-shrink-0 ${isSelected ? 'text-violet-400' : 'text-gray-300'}`} />}
      </button>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {selected && (
        <div className="flex items-center gap-2 border-b border-violet-100 bg-violet-50 px-4 py-2.5">
          <Check size={14} className="flex-shrink-0 text-violet-600" />
          <span className="flex-1 text-sm font-bold text-violet-700">{getPath(selected.id)}</span>
          {selected.commission_rate !== null && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600">
              %{selected.commission_rate} komisyon
            </span>
          )}
          {selected.min_price !== null && (
            <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-600">
              Min {selected.min_price}₺
            </span>
          )}
          <button onClick={clear} className="rounded-lg p-0.5 transition-colors hover:bg-violet-200">
            <X size={13} className="text-violet-500" />
          </button>
        </div>
      )}

      <div className="border-b border-gray-100 px-3 py-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Kategori ara..."
            className="w-full rounded-xl border border-gray-100 bg-gray-50 py-1.5 pl-8 pr-3 text-sm focus:border-violet-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X size={12} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {path.length > 0 && !search && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 font-semibold text-gray-500 shadow-sm hover:text-violet-600"
          >
            <ArrowLeft size={12} />
            Geri
          </button>
          <button onClick={clear} className="whitespace-nowrap font-semibold text-gray-500 hover:text-violet-600">
            Tümü
          </button>
          {breadcrumbCats.map((category, index) => (
            <span key={category.id} className="flex items-center gap-1">
              <ChevronRight size={10} className="text-gray-400" />
              <button
                onClick={() => {
                  const nextPath = path.slice(0, index + 1);
                  setPath(nextPath);
                  onChange(categories.find((item) => item.id === nextPath[nextPath.length - 1]) || null);
                }}
                className={`whitespace-nowrap font-semibold ${
                  index === path.length - 1 ? 'text-violet-600' : 'text-gray-500 hover:text-violet-600'
                }`}
              >
                {category.icon} {category.name}
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-[30rem] overflow-y-auto bg-gradient-to-b from-white to-slate-50/80">
        {!search && (
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
              {currentParent ? 'Alt Kategoriler' : 'Kategori Seçimi'}
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-700">
              {currentParent ? `${currentParent.icon || '📁'} ${currentParent.name}` : 'Bir kategori seçerek devam edin'}
            </div>
          </div>
        )}

        {search ? (
          searchResults.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Sonuç bulunamadı.</div>
          ) : (
            <div className="space-y-3 p-3">{searchResults.map((category) => renderCategoryCard(category, { showPath: true }))}</div>
          )
        ) : currentLevel.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">Kategori bulunamadı.</div>
        ) : (
          <div className="space-y-3 p-3">{currentLevel.map((category) => renderCategoryCard(category))}</div>
        )}
      </div>
    </div>
  );
}
