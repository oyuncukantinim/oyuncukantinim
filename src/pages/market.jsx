import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { getListings } from '../lib/api';
import { SORT_OPTIONS } from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import useSiteBrand from '../hooks/useSiteBrand';

function ListingSkeleton() {
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

export default function MarketPage() {
  const { user } = useAuth();
  const { defaultListingImage } = useSiteBrand();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get('category_id') || '');

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSort(searchParams.get('sort') || 'newest');
    setSelectedCategoryId(searchParams.get('category_id') || '');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const query = {};
    if (sort) query.sort = sort;
    if (search.trim()) query.search = search.trim();
    if (selectedCategoryId) query.category_id = selectedCategoryId;

    getListings(query)
      .then((response) => setListings(response.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sort, search, selectedCategoryId]);

  const resultLabel = useMemo(() => {
    if (loading) return 'İlanlar yükleniyor';
    if (listings.length === 1) return '1 ilan bulundu';
    return `${listings.length} ilan bulundu`;
  }, [listings.length, loading]);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 px-6 py-7 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-violet-700">
              Oyuncu Pazarı
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Topluluk ilanları tek yerde</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 md:text-base">
              Hesap, item ve hizmet ilanlarını güvenli şekilde keşfet. Arama yap, sırala ve sana uygun fırsatı hızlıca bul.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-left md:text-right">
              <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Durum</div>
              <div className="mt-1 text-sm font-extrabold text-emerald-700">{resultLabel}</div>
            </div>
            {user ? (
              <Link to="/create" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white shadow-[0_12px_25px_rgba(124,58,237,0.18)] transition-transform hover:-translate-y-0.5">
                <Plus size={18} /> İlan Ver
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="İlan ara..."
              className="input-field h-12 pl-10"
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <SlidersHorizontal size={16} className="text-slate-400" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ListingSkeleton key={`market-skeleton-${index}`} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mb-4 text-5xl">🏪</div>
          <p className="mb-2 text-lg font-semibold text-slate-700">Henüz ilan bulunamadı.</p>
          <p className="text-sm text-slate-400">
            Arama terimini değiştirerek tekrar deneyebilirsin.
          </p>
          {user ? (
            <Link to="/create" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-500">
              <Plus size={16} /> İlk ilanı sen ekle
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
          ))}
        </div>
      )}
    </div>
  );
}
