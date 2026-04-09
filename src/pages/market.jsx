import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid2X2, List, Plus, Search, SlidersHorizontal, X, Zap, Clock,
} from 'lucide-react';
import { getListings, getCategories } from '../lib/api';
import { SORT_OPTIONS } from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import useSiteBrand from '../hooks/useSiteBrand';

const PAGE_SIZE = 20;

// ---- Skeleton ----
function ListingSkeleton({ list }) {
  if (list) {
    return (
      <div className="flex animate-pulse gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-1/3 rounded-full bg-slate-100" />
          <div className="h-4 w-2/3 rounded-full bg-slate-100" />
          <div className="h-4 w-1/4 rounded-full bg-slate-100" />
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="animate-pulse">
        <div className="h-40 w-full bg-slate-100" />
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-20 rounded-full bg-slate-100" />
            <div className="h-4 w-16 rounded-full bg-slate-100" />
          </div>
          <div className="h-4 w-3/4 rounded-full bg-slate-100" />
          <div className="h-10 w-28 rounded-xl bg-slate-100" />
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="h-6 w-20 rounded-full bg-slate-100" />
            <div className="h-8 w-14 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Animasyonlu sayaç ----
function AnimatedCount({ value, loading }) {
  const [displayed, setDisplayed] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (loading) return;
    if (prev.current === value) return;
    const start = prev.current;
    const end = value;
    const diff = end - start;
    const steps = Math.min(Math.abs(diff), 20);
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayed(Math.round(start + (diff * step) / steps));
      if (step >= steps) { clearInterval(timer); prev.current = end; }
    }, 20);
    return () => clearInterval(timer);
  }, [value, loading]);

  if (loading) return <span className="animate-pulse">…</span>;
  return <span>{displayed}</span>;
}

// ---- Aktif filtre chip'i ----
function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 border border-violet-100">
      {label}
      <button onClick={onRemove} className="ml-0.5 rounded-full hover:text-violet-900">
        <X size={12} />
      </button>
    </span>
  );
}

export default function MarketPage() {
  const { user } = useAuth();
  const { defaultListingImage } = useSiteBrand();

  // Filtreler
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [deliveryType, setDeliveryType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Sonuçlar
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  // UI
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Kategorileri yükle
  useEffect(() => {
    getCategories()
      .then((res) => {
        const flat = (res.data || []).filter((c) => c.is_active);
        const parentIds = new Set(flat.map((c) => c.parent_id).filter(Boolean));
        setCategories(flat.filter((c) => !parentIds.has(c.id)));
      })
      .catch(() => {});
  }, []);

  // İlanları yükle
  useEffect(() => {
    setLoading(true);
    const query = {
      paginate: '1',
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      sort,
    };
    if (search.trim()) query.search = search.trim();
    if (selectedCategoryId) query.category_id = selectedCategoryId;
    if (deliveryType) query.delivery_type = deliveryType;
    if (minPrice !== '') query.min_price = minPrice;
    if (maxPrice !== '') query.max_price = maxPrice;

    getListings(query)
      .then((res) => {
        const data = res.data || {};
        setListings(data.listings || []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, sort, selectedCategoryId, deliveryType, minPrice, maxPrice, page]);

  // Filtre değişince sayfa sıfırla
  useEffect(() => { setPage(0); }, [search, sort, selectedCategoryId, deliveryType, minPrice, maxPrice]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Aktif filtreler
  const activeFilters = [];
  if (search.trim()) activeFilters.push({ key: 'search', label: `"${search.trim()}"`, clear: () => setSearch('') });
  if (selectedCategoryId) {
    const cat = categories.find((c) => String(c.id) === String(selectedCategoryId));
    activeFilters.push({ key: 'cat', label: cat?.name || 'Kategori', clear: () => setSelectedCategoryId('') });
  }
  if (deliveryType) activeFilters.push({ key: 'delivery', label: deliveryType === 'stock' ? 'Anında Teslim' : 'Manuel', clear: () => setDeliveryType('') });
  if (minPrice !== '') activeFilters.push({ key: 'min', label: `Min ${minPrice} ₺`, clear: () => setMinPrice('') });
  if (maxPrice !== '') activeFilters.push({ key: 'max', label: `Max ${maxPrice} ₺`, clear: () => setMaxPrice('') });

  const clearAll = () => {
    setSearch(''); setSelectedCategoryId(''); setDeliveryType('');
    setMinPrice(''); setMaxPrice(''); setSort('newest'); setPage(0);
  };

  return (
    <div className="space-y-6">

      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 px-6 py-7 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-violet-700">
              Oyuncu Pazarı
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Topluluk ilanları tek yerde
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 md:text-base">
              Hesap, item ve hizmet ilanlarını güvenli şekilde keşfet.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-left md:text-right">
              <div className="text-sm font-extrabold text-emerald-700">
                <AnimatedCount value={total} loading={loading} /> ilan listelendi
              </div>
            </div>
            {user && (
              <Link
                to="/create"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white shadow-[0_12px_25px_rgba(124,58,237,0.18)] transition-transform hover:-translate-y-0.5"
              >
                <Plus size={18} /> İlan Ver
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Arama + Araçlar */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3">
          {/* Üst satır: arama, sıralama, görünüm, filtre toggle */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İlan ara..."
                className="input-field h-12 pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Sıralama */}
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <SlidersHorizontal size={16} className="text-slate-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Grid / List toggle */}
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid görünüm"
                >
                  <Grid2X2 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg p-1.5 transition-colors ${viewMode === 'list' ? 'bg-white shadow text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Liste görünüm"
                >
                  <List size={18} />
                </button>
              </div>

              {/* Filtre toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${showFilters ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200 hover:text-violet-600'}`}
              >
                <SlidersHorizontal size={16} />
                Filtreler
                {activeFilters.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-black text-white">
                    {activeFilters.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filtre paneli */}
          {showFilters && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-4">

              {/* Kategori chip'leri */}
              {categories.length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Kategori</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategoryId('')}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${!selectedCategoryId ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600'}`}
                    >
                      Tümü
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(String(cat.id) === selectedCategoryId ? '' : String(cat.id))}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${String(cat.id) === selectedCategoryId ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                {/* Teslimat tipi */}
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Teslimat</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeliveryType('')}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${deliveryType === '' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200'}`}
                    >
                      Tümü
                    </button>
                    <button
                      onClick={() => setDeliveryType(deliveryType === 'stock' ? '' : 'stock')}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${deliveryType === 'stock' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200'}`}
                    >
                      <Zap size={13} /> Anında Teslim
                    </button>
                    <button
                      onClick={() => setDeliveryType(deliveryType === 'manual' ? '' : 'manual')}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${deliveryType === 'manual' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200'}`}
                    >
                      <Clock size={13} /> Manuel
                    </button>
                  </div>
                </div>

                {/* Fiyat aralığı */}
                <div className="flex-1">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Fiyat Aralığı (₺)</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400"
                    />
                    <span className="text-slate-400 font-bold">—</span>
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aktif filtre chip'leri */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Aktif:</span>
              {activeFilters.map((f) => (
                <FilterChip key={f.key} label={f.label} onRemove={f.clear} />
              ))}
              <button
                onClick={clearAll}
                className="text-xs font-bold text-rose-500 hover:text-rose-700"
              >
                Tümünü temizle
              </button>
            </div>
          )}
        </div>
      </section>

      {/* İlanlar */}
      {loading ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          : 'flex flex-col gap-4'
        }>
          {Array.from({ length: 8 }).map((_, i) => (
            <ListingSkeleton key={i} list={viewMode === 'list'} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mb-4 text-5xl">🏪</div>
          <p className="mb-2 text-lg font-semibold text-slate-700">İlan bulunamadı.</p>
          <p className="text-sm text-slate-400">Filtreleri değiştirerek tekrar dene.</p>
          {activeFilters.length > 0 && (
            <button onClick={clearAll} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-100">
              <X size={14} /> Filtreleri temizle
            </button>
          )}
          {user && (
            <div className="mt-4">
              <Link to="/create" className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-500">
                <Plus size={16} /> İlk ilanı sen ekle
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            : 'flex flex-col gap-4'
          }>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                fallbackImage={defaultListingImage}
                compact={viewMode === 'list'}
              />
            ))}
          </div>

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:border-violet-300 hover:text-violet-600 disabled:opacity-40"
              >
                ← Önceki
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i).map((i) => {
                  if (totalPages > 7 && Math.abs(i - page) > 2 && i !== 0 && i !== totalPages - 1) {
                    if (i === 1 && page > 3) return <span key={i} className="px-1 text-slate-400">…</span>;
                    if (i === totalPages - 2 && page < totalPages - 4) return <span key={i} className="px-1 text-slate-400">…</span>;
                    if (Math.abs(i - page) > 2) return null;
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`h-9 w-9 rounded-xl text-sm font-bold transition-colors ${i === page ? 'bg-violet-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600'}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:border-violet-300 hover:text-violet-600 disabled:opacity-40"
              >
                Sonraki →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
