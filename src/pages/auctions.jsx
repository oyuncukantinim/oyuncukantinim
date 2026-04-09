import { useEffect, useMemo, useState } from 'react';
import { Gavel, Search } from 'lucide-react';
import { getAuctions } from '../lib/api';
import AuctionCard from '../components/AuctionCard';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

const STATUS_TABS = [
  { id: 'live', label: 'Canli' },
  { id: 'scheduled', label: 'Yaklasan' },
  { id: 'ended', label: 'Tamamlanan' },
];

export default function AuctionsPage() {
  const [status, setStatus] = useState('live');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}?action=get_categories_tree`)
      .then((response) => response.json())
      .then((json) => setCategories((json.data || []).filter((category) => !category.parent_id)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    getAuctions({
      status,
      search: search.trim() || undefined,
      category_id: categoryId || undefined,
      limit: 30,
    })
      .then((response) => setAuctions(response.data || []))
      .catch(() => setAuctions([]))
      .finally(() => setLoading(false));
  }, [status, search, categoryId]);

  const headline = useMemo(() => {
    if (status === 'scheduled') return 'Yaklasan acik arttirmalar';
    if (status === 'ended') return 'Tamamlanan acik arttirmalar';
    return 'Canli acik arttirmalar';
  }, [status]);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-amber-950 to-orange-700 px-6 py-8 text-white shadow-2xl shadow-orange-900/10 md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-100">
              <Gavel size={13} />
              Acik Arttirma
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Koleksiyonluk urunler ve ozel firsatlar icin teklif ver</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-100/80 md:text-base">
              Bu alan normal pazardan ayridir. Tum acik arttirmalar admin tarafindan olusturulur, kullanicilar yalnizca teklif verir.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-100/70">Gorunen</div>
            <div className="mt-2 text-4xl font-black">{auctions.length}</div>
            <div className="mt-1 text-xs font-semibold text-amber-100/70">aktif sonuc</div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setLoading(true);
                  setStatus(tab.id);
                }}
                className={`rounded-full px-4 py-2 text-sm font-black transition-all ${
                  status === tab.id
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] lg:min-w-[560px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setLoading(true);
                  setSearch(event.target.value);
                }}
                placeholder="Acik arttirma ara..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-amber-400"
              />
            </div>
            <select
              value={categoryId}
              onChange={(event) => {
                setLoading(true);
                setCategoryId(event.target.value);
              }}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400"
            >
              <option value="">Tum kategoriler</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{headline}</h2>
            <p className="mt-1 text-sm text-slate-400">Teklif, sure ve kategoriye gore acik arttirmalari buradan takip edebilirsin.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="animate-pulse">
                  <div className="aspect-[4/3] bg-slate-100" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-24 rounded-full bg-slate-100" />
                    <div className="h-6 w-3/4 rounded-full bg-slate-100" />
                    <div className="h-24 rounded-2xl bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
              <Gavel size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Bu filtrede acik arttirma bulunamadi</h3>
            <p className="mt-2 text-sm text-slate-400">Durumu veya arama kelimesini degistirerek tekrar deneyebilirsin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
