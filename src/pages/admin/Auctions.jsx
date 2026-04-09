import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  Gavel,
  LoaderCircle,
  Plus,
  Save,
  Search,
  StopCircle,
  Upload,
  XCircle,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminCancelAuction,
  adminCreateAuction,
  adminEndAuction,
  adminGetAuction,
  adminGetAuctions,
  adminGetCategories,
  adminUpdateAuction,
  adminUploadImage,
} from '../../lib/adminApi';
import { auctionSlug } from '../../lib/api';
import { formatAuctionMoney, getAuctionStatusMeta } from '../../lib/auctions';

const EMPTY_FORM = {
  title: '',
  category_id: '',
  description: '',
  start_price: '1',
  min_increment: '1',
  reserve_price: '',
  buy_now_price: '',
  start_at: '',
  end_at: '',
  status: 'scheduled',
  images_text: '',
  cover_index: '0',
};

const STATUS_FILTERS = [
  { id: 'all', label: 'Tum durumlar' },
  { id: 'live', label: 'Canli' },
  { id: 'scheduled', label: 'Planli' },
  { id: 'ended', label: 'Biten' },
  { id: 'cancelled', label: 'Iptal' },
  { id: 'draft', label: 'Taslak' },
];

function fmtDateTime(value) {
  return value ? new Date(value).toLocaleString('tr-TR') : '-';
}

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toApiDateTime(value) {
  return value ? value.replace('T', ' ') + ':00' : '';
}

function imagesFromText(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formFromAuction(auction) {
  if (!auction) return EMPTY_FORM;
  return {
    title: auction.title || '',
    category_id: auction.category_id ? String(auction.category_id) : '',
    description: auction.description || '',
    start_price: String(auction.start_price ?? '1'),
    min_increment: String(auction.min_increment ?? '1'),
    reserve_price: auction.reserve_price ?? '',
    buy_now_price: auction.buy_now_price ?? '',
    start_at: toInputDateTime(auction.start_at),
    end_at: toInputDateTime(auction.end_at),
    status: auction.status || 'scheduled',
    images_text: Array.isArray(auction.images) ? auction.images.join('\n') : '',
    cover_index: String(auction.cover_index ?? 0),
  };
}

export default function AdminAuctionsPage() {
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [categories, setCategories] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 3000);
  }, []);

  const loadAuctions = useCallback(async ({ keepSelection = true } = {}) => {
    setLoading(true);
    try {
      const response = await adminGetAuctions({
        status: filters.status,
        search: filters.search.trim() || undefined,
        limit: 80,
      });
      const items = response.data || [];
      setAuctions(items);

      if (!keepSelection || !selectedId) {
        setSelectedId(items[0]?.id || null);
      } else if (!items.some((item) => item.id === selectedId)) {
        setSelectedId(items[0]?.id || null);
      }
    } catch (error) {
      showToast(error.message);
      setAuctions([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.status, selectedId, showToast]);

  const loadDetail = useCallback(async (auctionId) => {
    if (!auctionId) {
      setDetail(null);
      setForm(EMPTY_FORM);
      return;
    }

    setDetailLoading(true);
    try {
      const response = await adminGetAuction(auctionId);
      setDetail(response.data || null);
      setForm(formFromAuction(response.data?.auction));
    } catch (error) {
      showToast(error.message);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    adminGetCategories()
      .then((response) => setCategories(response.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAuctions({ keepSelection: true });
  }, [loadAuctions]);

  useEffect(() => {
    loadDetail(selectedId);
  }, [loadDetail, selectedId]);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  const selectedAuction = detail?.auction || null;
  const selectedStatusMeta = useMemo(
    () => getAuctionStatusMeta(selectedAuction?.status),
    [selectedAuction?.status]
  );

  const handleInput = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    category_id: Number(form.category_id),
    description: form.description.trim(),
    start_price: Number(form.start_price || 0),
    min_increment: Number(form.min_increment || 0),
    reserve_price: form.reserve_price === '' ? '' : Number(form.reserve_price),
    buy_now_price: form.buy_now_price === '' ? '' : Number(form.buy_now_price),
    start_at: toApiDateTime(form.start_at),
    end_at: toApiDateTime(form.end_at),
    status: form.status,
    images: imagesFromText(form.images_text),
    cover_index: Number(form.cover_index || 0),
  });

  const handleCreate = async () => {
    setSaving(true);
    try {
      const response = await adminCreateAuction(buildPayload());
      showToast(response.message || 'Acik artirma olusturuldu.');
      await loadAuctions({ keepSelection: false });
      if (response.data?.id) {
        setSelectedId(response.data.id);
      }
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAuction) {
      showToast('Guncellemek icin bir acik artirma sec.');
      return;
    }

    setSaving(true);
    try {
      const response = await adminUpdateAuction({
        auction_id: selectedAuction.id,
        ...buildPayload(),
      });
      showToast(response.message || 'Acik artirma guncellendi.');
      await loadAuctions();
      await loadDetail(selectedAuction.id);
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await adminUploadImage(file, 'auctions', { preserveOriginal: true });
      setForm((current) => ({
        ...current,
        images_text: [current.images_text.trim(), url].filter(Boolean).join('\n'),
      }));
      showToast('Gorsel yuklendi.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleCancelAuction = async () => {
    if (!selectedAuction || !window.confirm('Bu acik artirmayi iptal etmek istiyor musun?')) return;
    try {
      const response = await adminCancelAuction(selectedAuction.id);
      showToast(response.message || 'Acik artirma iptal edildi.');
      await loadAuctions();
      await loadDetail(selectedAuction.id);
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleEndAuction = async () => {
    if (!selectedAuction || !window.confirm('Bu acik artirmayi hemen bitirmek istiyor musun?')) return;
    try {
      const response = await adminEndAuction(selectedAuction.id);
      showToast(response.message || 'Acik artirma sonlandirildi.');
      await loadAuctions();
      await loadDetail(selectedAuction.id);
    } catch (error) {
      showToast(error.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900 p-6 text-white shadow-2xl shadow-slate-900/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-100">
                <Gavel size={13} />
                Admin Acik Arttirma
              </div>
              <h1 className="text-3xl font-black tracking-tight">Normal ilanlardan tamamen ayri acik arttirma yonetimi</h1>
              <p className="mt-3 text-sm leading-6 text-amber-100/75">
                Bu alanda sadece admin tarafindan olusturulan acik arttirmalari yonetebilir, teklifleri inceleyebilir ve sureci manuel sonlandirabilirsin.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setDetail(null);
                  setForm(EMPTY_FORM);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition-colors hover:bg-amber-200"
              >
                <Plus size={16} />
                Yeni Acik Arttirma
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={filters.search}
                    onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                    placeholder="Acik arttirma ara..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400"
                  />
                </div>
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400"
                >
                  {STATUS_FILTERS.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Acik Arttirma Listesi</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{auctions.length} kayit</p>
                </div>
              </div>

              <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm font-semibold text-slate-400">
                    <LoaderCircle size={16} className="animate-spin" />
                    Yukleniyor...
                  </div>
                ) : auctions.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm font-semibold text-slate-400">Acik arttirma bulunamadi.</div>
                ) : (
                  auctions.map((auction) => {
                    const statusMeta = getAuctionStatusMeta(auction.status);
                    const active = selectedId === auction.id;
                    return (
                      <button
                        key={auction.id}
                        type="button"
                        onClick={() => setSelectedId(auction.id)}
                        className={`block w-full border-b border-slate-100 px-4 py-4 text-left transition-colors last:border-b-0 ${
                          active ? 'bg-amber-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-slate-900">{auction.title}</div>
                            <div className="mt-1 text-xs font-semibold text-slate-400">
                              #{auction.id} · {auction.category_name || 'Kategori yok'}
                            </div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>{auction.bid_count} teklif</span>
                          <span>{formatAuctionMoney(auction.current_price || auction.start_price)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {selectedAuction ? `Acik Arttirma #${selectedAuction.id}` : 'Yeni Acik Arttirma'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {selectedAuction
                      ? 'Secili kaydi guncelleyebilir veya manuel olarak yonetebilirsin.'
                      : 'Bu formdan tamamen ayri bir acik arttirma olusturabilirsin.'}
                  </p>
                </div>
                {selectedAuction ? (
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={auctionSlug(selectedAuction.title, selectedAuction.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition-colors hover:border-amber-300 hover:text-amber-600"
                    >
                      <Eye size={16} />
                      Onizle
                    </a>
                    <button
                      type="button"
                      onClick={handleEndAuction}
                      className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 px-4 py-2.5 text-sm font-black text-orange-600 transition-colors hover:bg-orange-50"
                    >
                      <StopCircle size={16} />
                      Bitir
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAuction}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-black text-red-600 transition-colors hover:bg-red-50"
                    >
                      <XCircle size={16} />
                      Iptal Et
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Baslik</span>
                  <input value={form.title} onChange={(e) => handleInput('title', e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Kategori</span>
                  <select value={form.category_id} onChange={(e) => handleInput('category_id', e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400">
                    <option value="">Kategori sec</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Aciklama</span>
                  <textarea value={form.description} onChange={(e) => handleInput('description', e.target.value)} rows={5} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-amber-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Baslangic Fiyati</span>
                  <input type="number" min="0" step="0.01" value={form.start_price} onChange={(e) => handleInput('start_price', e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Min. Artis</span>
                  <input type="number" min="0" step="0.01" value={form.min_increment} onChange={(e) => handleInput('min_increment', e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Rezerv Fiyat</span>
                  <input type="number" min="0" step="0.01" value={form.reserve_price} onChange={(e) => handleInput('reserve_price', e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Hemen Al Fiyati</span>
                  <input type="number" min="0" step="0.01" value={form.buy_now_price} onChange={(e) => handleInput('buy_now_price', e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Baslangic Zamani</span>
                  <input type="datetime-local" value={form.start_at} onChange={(e) => handleInput('start_at', e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Bitis Zamani</span>
                  <input type="datetime-local" value={form.end_at} onChange={(e) => handleInput('end_at', e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Durum</span>
                  <select value={form.status} onChange={(e) => handleInput('status', e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400">
                    <option value="draft">Taslak</option>
                    <option value="scheduled">Planli</option>
                    <option value="cancelled">Iptal</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Kapak Index</span>
                  <input type="number" min="0" step="1" value={form.cover_index} onChange={(e) => handleInput('cover_index', e.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-amber-400" />
                </label>
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Gorseller</span>
                  <textarea value={form.images_text} onChange={(e) => handleInput('images_text', e.target.value)} rows={5} placeholder="Her satira bir gorsel URL ekle" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-amber-400" />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition-colors hover:border-amber-300 hover:text-amber-600">
                  <Upload size={16} />
                  {uploading ? 'Yukleniyor...' : 'Gorsel Yukle'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>

                <div className="flex flex-wrap gap-2">
                  {selectedAuction ? (
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={saving || detailLoading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-amber-500 hover:text-slate-950 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {saving ? 'Kaydediliyor...' : 'Guncelle'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                    >
                      <Plus size={16} />
                      {saving ? 'Olusturuluyor...' : 'Olustur'}
                    </button>
                  )}
                </div>
              </div>

              {selectedAuction ? (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Durum</div>
                    <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${selectedStatusMeta.className}`}>
                      {selectedStatusMeta.label}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Lider Teklif</div>
                    <div className="mt-2 text-lg font-black text-emerald-600">{formatAuctionMoney(selectedAuction.current_price || selectedAuction.start_price)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">Kazanan</div>
                    <div className="mt-2 text-sm font-black text-slate-900">{selectedAuction.winner_username || 'Henuz yok'}</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="text-lg font-black text-slate-900">Teklif Gecmisi</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Secili acik arttirmanin en guncel teklifleri</p>
                </div>
                <div className="max-h-96 overflow-y-auto p-4">
                  {detailLoading ? (
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                      <LoaderCircle size={16} className="animate-spin" />
                      Detay yukleniyor...
                    </div>
                  ) : detail?.bids?.length ? (
                    <div className="space-y-3">
                      {detail.bids.map((bid) => (
                        <div key={bid.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-black text-slate-900">{bid.username}</div>
                              <div className="mt-1 text-xs font-semibold text-slate-400">{fmtDateTime(bid.created_at)}</div>
                              <div className="mt-1 text-[11px] font-semibold text-slate-400">{bid.ip_address || 'IP yok'}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-base font-black text-emerald-600">{formatAuctionMoney(bid.amount)}</div>
                              <div className={`mt-1 text-[11px] font-black uppercase tracking-wide ${bid.is_winning ? 'text-amber-600' : 'text-slate-400'}`}>
                                {bid.is_winning ? 'Lider' : 'Teklif'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-400">
                      Henuz teklif yok.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="text-lg font-black text-slate-900">Etkinlik Gecmisi</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Olusturma, guncelleme ve bitirme loglari</p>
                </div>
                <div className="max-h-96 overflow-y-auto p-4">
                  {detailLoading ? (
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                      <LoaderCircle size={16} className="animate-spin" />
                      Kayitlar yukleniyor...
                    </div>
                  ) : detail?.events?.length ? (
                    <div className="space-y-3">
                      {detail.events.map((event) => (
                        <div key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                              <AlertTriangle size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-black uppercase tracking-wide text-slate-800">{event.event_type}</div>
                              <div className="mt-1 text-xs font-semibold text-slate-400">{fmtDateTime(event.created_at)}</div>
                              {event.payload ? (
                                <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-semibold text-slate-200">
                                  {JSON.stringify(event.payload, null, 2)}
                                </pre>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-400">
                      Henuz etkinlik kaydi yok.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {toast ? (
          <div className="fixed bottom-5 right-5 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-2xl">
            {toast}
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
