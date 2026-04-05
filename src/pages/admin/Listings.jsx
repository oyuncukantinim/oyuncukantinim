import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Pencil,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminAddStocks, adminDeleteListing, adminDeleteStock, adminGetListings, adminGetStocks, adminUpdateListing } from '../../lib/adminApi';
import { listingSlug } from '../../lib/api';

const STATUS_MAP = {
  active: { label: 'Aktif', colorClass: 'text-emerald-600 bg-emerald-50' },
  sold: { label: 'Satıldı', colorClass: 'text-blue-600 bg-blue-50' },
  expired: { label: 'Süresi Doldu', colorClass: 'text-orange-600 bg-orange-50' },
  pending: { label: 'Bekliyor', colorClass: 'text-yellow-700 bg-yellow-50' },
  removed: { label: 'Kaldırıldı', colorClass: 'text-red-600 bg-red-50' },
  inactive: { label: 'Pasif', colorClass: 'text-gray-600 bg-gray-100' },
  passive: { label: 'Pasif', colorClass: 'text-gray-600 bg-gray-100' },
};

function ListingDetailModal({ listing, onClose, onRefresh, showToast }) {
  const [form, setForm] = useState({
    title: listing.title,
    price: listing.price,
    status: listing.status,
    description: listing.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [stockInput, setStockInput] = useState('');
  const [stockSaving, setStockSaving] = useState(false);

  const loadStocks = useCallback(async () => {
    if (listing.delivery_type !== 'stock') return;
    setStocksLoading(true);
    try {
      const response = await adminGetStocks(listing.id);
      setStocks(response.data || []);
    } catch (error) {
      showToast(error.message);
    } finally {
      setStocksLoading(false);
    }
  }, [listing.delivery_type, listing.id, showToast]);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateListing({ listing_id: listing.id, ...form });
      showToast('İlan güncellendi.');
      onRefresh();
      onClose();
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('İlanı kalıcı olarak sil?')) return;
    setSaving(true);
    try {
      await adminDeleteListing(listing.id);
      showToast('İlan silindi.');
      onRefresh();
      onClose();
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fmtDateTime = (value) => (value ? new Date(value).toLocaleString('tr-TR') : '—');
  const availableStockCount = listing.delivery_type === 'stock'
    ? stocks.filter((stock) => Number(stock.is_sold) !== 1).length
    : Number(listing.stock_count || 0);
  const soldStockCount = stocks.filter((stock) => Number(stock.is_sold) === 1).length;

  const handleAddStocks = async () => {
    const parsedStocks = stockInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [labelPart, ...contentParts] = line.includes('|') ? line.split('|') : [null, line];
        const content = contentParts.join('|').trim();
        const label = labelPart?.trim() || null;
        return {
          label: contentParts.length > 0 ? label : null,
          content: contentParts.length > 0 ? content : (labelPart || '').trim(),
        };
      })
      .filter((item) => item.content);

    if (parsedStocks.length === 0) {
      showToast('Eklemek için en az bir stok satırı girin.');
      return;
    }

    setStockSaving(true);
    try {
      await adminAddStocks({ listing_id: listing.id, stocks: parsedStocks });
      showToast(`${parsedStocks.length} stok eklendi.`);
      setStockInput('');
      await loadStocks();
      onRefresh();
    } catch (error) {
      showToast(error.message);
    } finally {
      setStockSaving(false);
    }
  };

  const handleDeleteStock = async (stockId) => {
    if (!confirm('Bu stok kalemini silmek istiyor musun?')) return;
    setStockSaving(true);
    try {
      await adminDeleteStock(stockId);
      showToast('Stok silindi.');
      await loadStocks();
      onRefresh();
    } catch (error) {
      showToast(error.message);
    } finally {
      setStockSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">İlan #{listing.id}</h2>
            <p className="mt-0.5 text-xs text-gray-400">{fmtDateTime(listing.created_at)}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {listing.images?.[0] ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-gray-100">
            <img src={listing.images[0]} alt={listing.title} className="h-40 w-full object-cover" />
          </div>
        ) : null}

        <div className="mb-4 space-y-1.5 rounded-xl bg-gray-50 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Satıcı</span>
            <span className="font-bold text-gray-800">{listing.seller || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Kategori</span>
            <span className="font-semibold text-gray-700">{listing.category || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Teslimat</span>
            <span className="font-semibold text-gray-700">
              {listing.delivery_type === 'stock' ? `Stoklu (${availableStockCount} aktif)` : 'Manuel'}
            </span>
          </div>
          {listing.delivery_type === 'stock' ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Satılan Stok</span>
              <span className="font-semibold text-gray-700">{soldStockCount}</span>
            </div>
          ) : null}
          {listing.expires_at ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bitiş</span>
              <span className="font-semibold text-gray-700">{fmtDateTime(listing.expires_at)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Görüntülenme</span>
            <span className="font-semibold text-gray-700">{listing.view_count || 0}</span>
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-600">Başlık</label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-600">Fiyat (₺)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-600">Durum</label>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
              >
                {Object.entries(STATUS_MAP).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-600">Açıklama</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
            />
          </div>
        </div>

        {listing.delivery_type === 'stock' ? (
          <div className="mb-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">Stok Yönetimi</h3>
                <p className="mt-0.5 text-xs text-gray-400">
                  Toplam {stocks.length} kayıt · {availableStockCount} aktif · {soldStockCount} satıldı
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-600">Yeni Stok Ekle</label>
                <textarea
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  rows={4}
                  placeholder={'Her satıra bir stok gir.\nİstersen Etiket|İçerik formatını kullan.'}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-gray-400">Örnek: Hesap 1|eposta:sifre veya doğrudan stok içeriği</p>
                  <button
                    type="button"
                    onClick={handleAddStocks}
                    disabled={stockSaving}
                    className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                  >
                    {stockSaving ? 'Ekleniyor...' : 'Stok Ekle'}
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-100">
                <div className="grid grid-cols-[72px_minmax(0,2.4fr)_minmax(0,1.1fr)_100px_56px] gap-3 bg-gray-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  <span>ID</span>
                  <span>İçerik</span>
                  <span>Etiket</span>
                  <span>Durum</span>
                  <span className="text-right">İşlem</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 bg-white">
                  {stocksLoading ? (
                    <div className="px-3 py-6 text-center text-sm text-gray-400">Stoklar yükleniyor...</div>
                  ) : stocks.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-gray-400">Bu ilanda henüz stok yok.</div>
                  ) : (
                    stocks.map((stock) => {
                      const sold = Number(stock.is_sold) === 1;
                      return (
                        <div key={stock.id} className="grid grid-cols-[72px_minmax(0,2.4fr)_minmax(0,1.1fr)_100px_56px] gap-3 px-3 py-3 text-xs items-start">
                          <span className="font-semibold text-gray-500">#{stock.id}</span>
                          <div className="min-w-0">
                            <div className="break-words whitespace-pre-wrap text-gray-700 [overflow-wrap:anywhere]">{stock.content || '—'}</div>
                            {sold && stock.sold_at ? (
                              <div className="mt-1 text-[11px] text-gray-400">Satış: {fmtDateTime(stock.sold_at)}</div>
                            ) : null}
                          </div>
                          <span className="break-words text-gray-600 [overflow-wrap:anywhere]">{stock.label || '—'}</span>
                          <span className={`inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-bold ${sold ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {sold ? 'Satıldı' : 'Aktif'}
                          </span>
                          <div className="flex justify-end">
                            {!sold ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteStock(stock.id)}
                                disabled={stockSaving}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                title="Stoku sil"
                              >
                                <Trash2 size={13} />
                              </button>
                            ) : (
                              <span className="px-1.5 py-1 text-[11px] text-gray-300">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex gap-2">
          <a
            href={listingSlug(listing.title, listing.id)}
            target="_blank"
            rel="noreferrer"
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:border-gray-300"
          >
            <ExternalLink size={13} /> Görüntüle
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-violet-600 py-2 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    adminGetListings({ page, search, status: filterStatus })
      .then((r) => {
        setListings(r.data.listings || []);
        setTotal(r.data.total || 0);
        setPages(r.data.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const handleQuickStatus = async (id, status) => {
    try {
      await adminUpdateListing({ listing_id: id, status });
      showToast('Durum güncellendi.');
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleDeleteListing = async (listing) => {
    if (!confirm(`"${listing.title}" ilanını kalıcı olarak sil?`)) return;
    try {
      await adminDeleteListing(listing.id);
      if (selectedListing?.id === listing.id) setSelectedListing(null);
      showToast('İlan silindi.');
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  const fmtMoney = (value) => `${Number(value || 0).toFixed(2)} ₺`;
  const fmtDate = (value) => (value ? new Date(value).toLocaleDateString('tr-TR') : '—');

  return (
    <AdminLayout>
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Başlık veya satıcı ara..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-violet-400 focus:outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_MAP).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className="font-extrabold text-gray-800">İlanlar</h3>
            <span className="text-sm text-gray-500">{total} ilan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">İlan</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 md:table-cell">Satıcı</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 sm:table-cell">Fiyat</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 lg:table-cell">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      İlan bulunamadı.
                    </td>
                  </tr>
                ) : (
                  listings.map((listing) => {
                    const statusMeta = STATUS_MAP[listing.status] || {
                      label: listing.status || 'Belirsiz',
                      colorClass: 'text-gray-600 bg-gray-100',
                    };

                    return (
                      <tr key={listing.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                              {listing.images?.[0] ? (
                                <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">—</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="max-w-[180px] truncate font-bold text-gray-800">{listing.title}</div>
                              <div className="text-xs text-gray-400">
                                #{listing.id} · {listing.delivery_type === 'stock' ? `Stok(${listing.stock_count})` : 'Manuel'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{listing.seller}</td>
                        <td className="hidden px-4 py-3 font-bold text-emerald-600 sm:table-cell">{fmtMoney(listing.price)}</td>
                        <td className="hidden px-4 py-3 text-xs text-gray-400 lg:table-cell">{fmtDate(listing.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusMeta.colorClass}`}>{statusMeta.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedListing(listing)}
                              title="Detay / Düzenle"
                              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-violet-50 hover:text-violet-600"
                            >
                              <Pencil size={14} />
                            </button>
                            <a
                              href={listingSlug(listing.title, listing.id)}
                              target="_blank"
                              rel="noreferrer"
                              title="Görüntüle"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                            >
                              <ExternalLink size={14} />
                            </a>
                            {listing.status !== 'active' ? (
                              <button
                                onClick={() => handleQuickStatus(listing.id, 'active')}
                                title="Aktifleştir"
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"
                              >
                                <CheckCircle size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleQuickStatus(listing.id, 'removed')}
                                title="Kaldır"
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-50 hover:text-orange-500"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteListing(listing)}
                              title="Sil"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 ? (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <span className="text-xs text-gray-500">
                Sayfa {page} / {pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
                  disabled={page === pages}
                  className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {selectedListing ? (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onRefresh={load}
          showToast={showToast}
        />
      ) : null}
    </AdminLayout>
  );
}
