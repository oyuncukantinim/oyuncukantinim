import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, Filter, Folder, Grid2X2, KeyRound, List, Plus, RotateCcw,
  Search, ShieldCheck, SlidersHorizontal, Star, UserRound, Wifi, X, Zap,
} from 'lucide-react';
import { getListings, getCategories } from '../lib/api';
import { SORT_OPTIONS } from '../data/catalog';
import { useAuth } from '../context/useAuth';
import ListingCard from '../components/ListingCard';
import useSiteBrand from '../hooks/useSiteBrand';

const PAGE_SIZE = 20;

function ListingSkeleton({ list }) {
  if (list) {
    return (
      <div className="flex animate-pulse gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-1/3 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-4 w-2/3 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-4 w-1/4 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="animate-pulse">
        <div className="h-40 w-full bg-slate-100 dark:bg-slate-800" />
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-4 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="h-4 w-3/4 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-10 w-28 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="h-6 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="h-8 w-14 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

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
      step += 1;
      setDisplayed(Math.round(start + (diff * step) / steps));
      if (step >= steps) {
        clearInterval(timer);
        prev.current = end;
      }
    }, 20);
    return () => clearInterval(timer);
  }, [value, loading]);

  if (loading) return <span className="animate-pulse">...</span>;
  return <span>{displayed}</span>;
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200">
      {label}
      <button onClick={onRemove} className="ml-0.5 rounded-full hover:text-violet-900 dark:hover:text-white" type="button">
        <X size={12} />
      </button>
    </span>
  );
}

function FilterSection({ icon: Icon, title, iconClass = 'text-violet-500', children }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100">
        <Icon size={15} className={iconClass} />
        {title}
      </div>
      {children}
    </section>
  );
}

function FilterInput({ icon: Icon = Search, ...props }) {
  return (
    <div className="relative">
      <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        {...props}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-300 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-500/60 dark:focus:bg-slate-800"
      />
    </div>
  );
}

function FilterToggle({ checked, onChange, icon: Icon, label, accent = 'violet' }) {
  const colors = {
    violet: checked ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-400/60 dark:bg-violet-500/15 dark:text-violet-100' : '',
    emerald: checked ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/15 dark:text-emerald-100' : '',
    cyan: checked ? 'border-cyan-400 bg-cyan-50 text-cyan-700 dark:border-cyan-400/60 dark:bg-cyan-500/15 dark:text-cyan-100' : '',
    amber: checked ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-400/60 dark:bg-amber-500/15 dark:text-amber-100' : '',
  };
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-black transition-all ${checked ? colors[accent] : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200 hover:bg-white dark:border-slate-700 dark:bg-slate-800/75 dark:text-slate-300 dark:hover:border-violet-500/45 dark:hover:bg-slate-800'}`}
    >
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-current bg-current/10' : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'}`}>
        {checked ? <span className="h-2 w-2 rounded-sm bg-current" /> : null}
      </span>
      {Icon ? <Icon size={14} className="shrink-0" /> : null}
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

function CategoryMark({ cat }) {
  const icon = String(cat.icon || '').trim();
  if (icon && /^https?:\/\//i.test(icon)) {
    return <img src={icon} alt="" className="h-8 w-8 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base dark:bg-slate-800">
      {icon || <Folder size={15} />}
    </span>
  );
}

function MarketFilterPanel({
  categories,
  draft,
  setDraft,
  categorySearch,
  setCategorySearch,
  onApply,
  onClear,
}) {
  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLocaleLowerCase('tr-TR');
    if (!query) return categories;
    return categories.filter((cat) => String(cat.name || '').toLocaleLowerCase('tr-TR').includes(query));
  }, [categories, categorySearch]);

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/80">
        <SlidersHorizontal size={18} className="text-violet-500" />
        <h2 className="text-base font-black text-slate-900 dark:text-white">Filtrele</h2>
      </div>

      <div className="space-y-5 p-5">
        <FilterSection icon={Folder} title="Kategoriler" iconClass="text-blue-500">
          <FilterInput
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Kategori ara..."
          />
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => setField('selectedCategoryId', '')}
              className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-black transition-colors ${!draft.selectedCategoryId ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-100' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200">
                <Star size={15} />
              </span>
              Tüm kategoriler
            </button>
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setField('selectedCategoryId', String(cat.id) === draft.selectedCategoryId ? '' : String(cat.id))}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-black transition-colors ${String(cat.id) === draft.selectedCategoryId ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-100' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
              >
                <CategoryMark cat={cat} />
                <span className="min-w-0 truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection icon={Filter} title="Fiyat Aralığı (₺)" iconClass="text-emerald-500">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              value={draft.minPrice}
              onChange={(e) => setField('minPrice', e.target.value)}
              placeholder="En az"
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
            />
            <input
              type="number"
              min="0"
              value={draft.maxPrice}
              onChange={(e) => setField('maxPrice', e.target.value)}
              placeholder="En çok"
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
            />
          </div>
        </FilterSection>

        <FilterSection icon={UserRound} title="Satıcı Filtrele" iconClass="text-violet-500">
          <FilterInput
            icon={Search}
            value={draft.sellerSearch}
            onChange={(e) => setField('sellerSearch', e.target.value)}
            placeholder="Satıcı adı..."
          />
        </FilterSection>

        <FilterSection icon={KeyRound} title="Kelime Filtrele" iconClass="text-orange-500">
          <FilterInput
            icon={Search}
            value={draft.search}
            onChange={(e) => setField('search', e.target.value)}
            placeholder="Arama kelimesi..."
          />
          <FilterToggle
            checked={draft.includeDescription}
            onChange={(value) => setField('includeDescription', value)}
            label="İlan açıklamalarını dahil et"
          />
        </FilterSection>

        <FilterSection icon={Star} title="Diğer Özellikler" iconClass="text-yellow-500">
          <div className="space-y-2">
            <FilterToggle
              checked={draft.onlineOnly}
              onChange={(value) => setField('onlineOnly', value)}
              icon={Wifi}
              label="Çevrimiçi Satıcı"
              accent="emerald"
            />
            <FilterToggle
              checked={draft.deliveryType === 'stock'}
              onChange={(value) => setField('deliveryType', value ? 'stock' : '')}
              icon={Zap}
              label="Otomatik Teslimat"
              accent="amber"
            />
            <FilterToggle
              checked={draft.trustedOnly}
              onChange={(value) => setField('trustedOnly', value)}
              icon={ShieldCheck}
              label="Güvenilir Satıcı"
              accent="cyan"
            />
          </div>
        </FilterSection>

        <button
          type="button"
          onClick={onApply}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 hover:shadow-violet-500/30"
        >
          <Filter size={16} /> Filtre Uygula
        </button>
        <button
          type="button"
          onClick={onClear}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition-colors hover:border-rose-200 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <RotateCcw size={15} /> Filtreleri Temizle
        </button>
      </div>
    </div>
  );
}

const EMPTY_FILTERS = {
  search: '',
  sellerSearch: '',
  selectedCategoryId: '',
  deliveryType: '',
  minPrice: '',
  maxPrice: '',
  includeDescription: false,
  onlineOnly: false,
  trustedOnly: false,
};

export default function MarketPage() {
  const { user } = useAuth();
  const { defaultListingImage } = useSiteBrand();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [categorySearch, setCategorySearch] = useState('');
  const [sort, setSort] = useState('newest');

  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [viewMode, setViewMode] = useState('grid');
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getCategories()
      .then((res) => {
        const flat = (res.data || []).filter((c) => c.is_active);
        const parentIds = new Set(flat.map((c) => c.parent_id).filter(Boolean));
        setCategories(flat.filter((c) => !parentIds.has(c.id)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = {
      paginate: '1',
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      sort,
    };
    if (filters.search.trim()) {
      query.search = filters.search.trim();
      query.include_description = filters.includeDescription ? '1' : '0';
    }
    if (filters.sellerSearch.trim()) query.seller_search = filters.sellerSearch.trim();
    if (filters.selectedCategoryId) query.category_id = filters.selectedCategoryId;
    if (filters.deliveryType) query.delivery_type = filters.deliveryType;
    if (filters.minPrice !== '') query.min_price = filters.minPrice;
    if (filters.maxPrice !== '') query.max_price = filters.maxPrice;
    if (filters.onlineOnly) query.online_seller = '1';
    if (filters.trustedOnly) query.identity_verified_seller = '1';

    getListings(query)
      .then((res) => {
        const data = res.data || {};
        setListings(data.listings || []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters, sort, page]);

  useEffect(() => { setPage(0); }, [filters, sort]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const applyFilters = () => {
    setFilters({ ...draftFilters });
    setPage(0);
    setShowFilters(false);
  };

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
    setCategorySearch('');
    setSort('newest');
    setPage(0);
    setShowFilters(false);
  };

  const activeFilters = [];
  if (filters.search.trim()) activeFilters.push({ key: 'search', label: `"${filters.search.trim()}"`, clear: () => setFilters((prev) => ({ ...prev, search: '', includeDescription: false })) });
  if (filters.search.trim() && filters.includeDescription) activeFilters.push({ key: 'desc', label: 'Açıklama dahil', clear: () => setFilters((prev) => ({ ...prev, includeDescription: false })) });
  if (filters.sellerSearch.trim()) activeFilters.push({ key: 'seller', label: `Satıcı: ${filters.sellerSearch.trim()}`, clear: () => setFilters((prev) => ({ ...prev, sellerSearch: '' })) });
  if (filters.selectedCategoryId) {
    const cat = categories.find((c) => String(c.id) === String(filters.selectedCategoryId));
    activeFilters.push({ key: 'cat', label: cat?.name || 'Kategori', clear: () => setFilters((prev) => ({ ...prev, selectedCategoryId: '' })) });
  }
  if (filters.deliveryType) activeFilters.push({ key: 'delivery', label: 'Otomatik Teslimat', clear: () => setFilters((prev) => ({ ...prev, deliveryType: '' })) });
  if (filters.minPrice !== '') activeFilters.push({ key: 'min', label: `Min ${filters.minPrice} ₺`, clear: () => setFilters((prev) => ({ ...prev, minPrice: '' })) });
  if (filters.maxPrice !== '') activeFilters.push({ key: 'max', label: `Max ${filters.maxPrice} ₺`, clear: () => setFilters((prev) => ({ ...prev, maxPrice: '' })) });
  if (filters.onlineOnly) activeFilters.push({ key: 'online', label: 'Çevrimiçi Satıcı', clear: () => setFilters((prev) => ({ ...prev, onlineOnly: false })) });
  if (filters.trustedOnly) activeFilters.push({ key: 'trusted', label: 'Güvenilir Satıcı', clear: () => setFilters((prev) => ({ ...prev, trustedOnly: false })) });

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const filterPanel = (
    <MarketFilterPanel
      categories={categories}
      draft={draftFilters}
      setDraft={setDraftFilters}
      categorySearch={categorySearch}
      setCategorySearch={setCategorySearch}
      onApply={applyFilters}
      onClear={clearAll}
    />
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 px-6 py-7 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200">
              Oyuncu Pazarı
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Topluluk ilanları tek yerde
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300 md:text-base">
              Hesap, item ve hizmet ilanlarını güvenli şekilde keşfet.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-left dark:border-emerald-500/25 dark:bg-emerald-500/10 md:text-right">
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-200">
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

      <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            {filterPanel}
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  <AnimatedCount value={total} loading={loading} /> ilan
                </div>
                <div className="mt-0.5 text-xs font-semibold text-slate-400">
                  Filtreler seçiliyse sonuçlar anlık olarak buna göre listelenir.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-violet-200 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 lg:hidden"
                >
                  <SlidersHorizontal size={16} />
                  Filtrele
                  {activeFilters.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-black text-white">
                      {activeFilters.length}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                  <SlidersHorizontal size={16} className="text-slate-400" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-slate-700 outline-none dark:text-slate-100"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-white text-violet-600 shadow dark:bg-slate-700 dark:text-violet-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    title="Grid görünüm"
                    type="button"
                  >
                    <Grid2X2 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-lg p-1.5 transition-colors ${viewMode === 'list' ? 'bg-white text-violet-600 shadow dark:bg-slate-700 dark:text-violet-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    title="Liste görünüm"
                    type="button"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400">Aktif:</span>
                {activeFilters.map((f) => (
                  <FilterChip key={f.key} label={f.label} onRemove={f.clear} />
                ))}
                <button
                  onClick={clearAll}
                  className="text-xs font-bold text-rose-500 hover:text-rose-700"
                  type="button"
                >
                  Tümünü temizle
                </button>
              </div>
            )}
          </section>

          {loading ? (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
              : 'flex flex-col gap-4'
            }>
              {Array.from({ length: 8 }).map((_, i) => (
                <ListingSkeleton key={i} list={viewMode === 'list'} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 text-5xl">🏪</div>
              <p className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-100">İlan bulunamadı.</p>
              <p className="text-sm text-slate-400">Filtreleri değiştirerek tekrar dene.</p>
              {activeFilters.length > 0 && (
                <button onClick={clearAll} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-200" type="button">
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
                ? 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
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

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:border-violet-300 hover:text-violet-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    type="button"
                  >
                    Önceki
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i).map((i) => {
                      if (totalPages > 7 && Math.abs(i - page) > 2 && i !== 0 && i !== totalPages - 1) {
                        if (i === 1 && page > 3) return <span key={i} className="px-1 text-slate-400">...</span>;
                        if (i === totalPages - 2 && page < totalPages - 4) return <span key={i} className="px-1 text-slate-400">...</span>;
                        if (Math.abs(i - page) > 2) return null;
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => setPage(i)}
                          className={`h-9 w-9 rounded-xl text-sm font-bold transition-colors ${i === page ? 'bg-violet-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}
                          type="button"
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:border-violet-300 hover:text-violet-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    type="button"
                  >
                    Sonraki
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55"
            onClick={() => setShowFilters(false)}
            aria-label="Filtre panelini kapat"
          />
          <div className="absolute inset-y-0 left-0 w-[min(88vw,360px)] overflow-y-auto bg-white p-4 shadow-2xl dark:bg-slate-950">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-black text-slate-900 dark:text-white">Pazar Filtreleri</div>
              <button type="button" onClick={() => setShowFilters(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </div>
  );
}
