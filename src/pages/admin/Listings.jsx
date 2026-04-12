import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminAddStocks,
  adminApplyListingDoping,
  adminClearListingDoping,
  adminDeleteListing,
  adminDeleteListingImage,
  adminDeleteStock,
  adminGetListings,
  adminGetStocks,
  adminUpdateListing,
  adminUpdateStock,
  adminUploadListingImage,
} from '../../lib/adminApi';
import { listingSlug } from '../../lib/api';
import { getListingCoverImage } from '../../lib/listingMedia';
import { formatDopingDuration, getDopingTypeMeta, getDopingRemainingLabel, getListingActiveDopingTypes } from '../../lib/doping';
import useSiteBrand from '../../hooks/useSiteBrand';

const STATUS_MAP = {
  active: { label: 'Aktif', colorClass: 'text-emerald-600 bg-emerald-50' },
  sold: { label: 'Satildi', colorClass: 'text-blue-600 bg-blue-50' },
  expired: { label: 'Suresi Doldu', colorClass: 'text-orange-600 bg-orange-50' },
  pending: { label: 'Bekliyor', colorClass: 'text-yellow-700 bg-yellow-50' },
  removed: { label: 'Kaldirildi', colorClass: 'text-red-600 bg-red-50' },
  inactive: { label: 'Pasif', colorClass: 'text-gray-600 bg-gray-100' },
  passive: { label: 'Pasif', colorClass: 'text-gray-600 bg-gray-100' },
};

function fmtDate(value) {
  return value ? new Date(value).toLocaleDateString('tr-TR') : '-';
}

function fmtDateTime(value) {
  return value ? new Date(value).toLocaleString('tr-TR') : '-';
}

function fmtMoney(value) {
  return `${Number(value || 0).toFixed(2)} ₺`;
}

function StockManagerModal({ listing, onClose, onRefresh, showToast }) {
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [stockInput, setStockInput] = useState('');
  const [stockSaving, setStockSaving] = useState(false);
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockContent, setEditingStockContent] = useState('');

  const loadStocks = useCallback(async () => {
    setStocksLoading(true);
    try {
      const response = await adminGetStocks(listing.id);
      setStocks(response.data || []);
    } catch (error) {
      showToast(error.message);
    } finally {
      setStocksLoading(false);
    }
  }, [listing.id, showToast]);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  const availableStockCount = stocks.filter((stock) => Number(stock.is_sold) !== 1).length;
  const soldStockCount = stocks.filter((stock) => Number(stock.is_sold) === 1).length;

  const handleAddStocks = async () => {
    const parsedStocks = stockInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [labelPart, ...contentParts] = line.includes('|') ? line.split('|') : [null, line];
        const hasLabel = contentParts.length > 0;
        return {
          label: hasLabel ? labelPart?.trim() || null : null,
          content: hasLabel ? contentParts.join('|').trim() : (labelPart || '').trim(),
        };
      })
      .filter((item) => item.content);

    if (parsedStocks.length === 0) {
      showToast('Eklemek icin en az bir stok satiri gir.');
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

  const handleUpdateStock = async (stockId) => {
    if (!editingStockContent.trim()) return;
    setStockSaving(true);
    try {
      await adminUpdateStock(stockId, editingStockContent.trim());
      showToast('Stok güncellendi.');
      setEditingStockId(null);
      await loadStocks();
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Stok Yonetimi</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Ilan #{listing.id} · {listing.title}
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="rounded-xl border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-extrabold text-gray-800">Stok Ozeti</h3>
              <p className="mt-0.5 text-xs text-gray-400">
                Toplam {stocks.length} kayit · {availableStockCount} aktif · {soldStockCount} satildi
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-600">Yeni Stok Ekle</label>
              <textarea
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                rows={5}
                placeholder={'Her satira bir stok gir.\nIstersen Etiket|Icerik formatini kullan.'}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-gray-400">Ornek: Hesap 1|eposta:sifre veya dogrudan stok icerigi</p>
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
              <div className="grid grid-cols-[72px_minmax(0,1fr)_100px_56px] gap-3 bg-gray-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                <span>ID</span>
                <span>Icerik</span>
                <span>Durum</span>
                <span className="text-right">Islem</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 bg-white">
                {stocksLoading ? (
                  <div className="px-3 py-6 text-center text-sm text-gray-400">Stoklar yukleniyor...</div>
                ) : stocks.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-gray-400">Bu ilanda henuz stok yok.</div>
                ) : (
                  stocks.map((stock) => {
                    const sold = Number(stock.is_sold) === 1;
                    return (
                      <div key={stock.id} className="grid grid-cols-[72px_minmax(0,1fr)_100px_56px] gap-3 px-3 py-3 text-xs items-start">
                        <span className="font-semibold text-gray-500">#{stock.id}</span>
                        <div className="min-w-0">
                          {editingStockId === stock.id ? (
                            <textarea
                              value={editingStockContent}
                              onChange={(e) => setEditingStockContent(e.target.value)}
                              rows={2}
                              className="w-full resize-none rounded-lg border border-violet-300 px-2 py-1.5 text-xs focus:border-violet-500 focus:outline-none"
                              autoFocus
                            />
                          ) : (
                            <>
                              <div className="break-words whitespace-pre-wrap text-gray-700 [overflow-wrap:anywhere]">{stock.content || '-'}</div>
                              {sold && stock.sold_at ? (
                                <div className="mt-1 text-[11px] text-gray-400">Satis: {fmtDateTime(stock.sold_at)}</div>
                              ) : null}
                            </>
                          )}
                        </div>
                        <span className={`inline-flex w-fit rounded-full px-2 py-1 text-[11px] font-bold ${sold ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {sold ? 'Satildi' : 'Aktif'}
                        </span>
                        <div className="flex justify-end gap-1">
                          {!sold ? (
                            editingStockId === stock.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStock(stock.id)}
                                  disabled={stockSaving}
                                  className="rounded-lg p-1.5 text-emerald-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                                  title="Kaydet"
                                >
                                  <CheckCircle size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingStockId(null)}
                                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
                                  title="Iptal"
                                >
                                  <X size={13} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => { setEditingStockId(stock.id); setEditingStockContent(stock.content || ''); }}
                                  disabled={stockSaving}
                                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-violet-50 hover:text-violet-600 disabled:opacity-50"
                                  title="Duzenle"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStock(stock.id)}
                                  disabled={stockSaving}
                                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                  title="Stoku sil"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )
                          ) : (
                            <span className="px-1.5 py-1 text-[11px] text-gray-300">-</span>
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
      </div>
    </div>
  );
}

function ListingDetailModal({
  listing,
  onClose,
  onRefresh,
  onManageStocks,
  showToast,
  vitrineOptions,
  featuredOptions,
  defaultListingImage,
}) {
  const originalImages = Array.isArray(listing.images) ? listing.images.filter(Boolean) : [];
  const [form, setForm] = useState({
    title: listing.title,
    price: listing.price,
    status: listing.status,
    description: listing.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState(originalImages.length ? originalImages : ['']);
  const [coverIndex, setCoverIndex] = useState(Number.isInteger(Number(listing.cover_index)) ? Number(listing.cover_index) : 0);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [pendingDeleteImages, setPendingDeleteImages] = useState([]);
  const maxImages = Math.max(5, originalImages.length);
  const [dopingType, setDopingType] = useState(getListingActiveDopingTypes(listing)[0] || 'vitrine');
  const [dopingHours, setDopingHours] = useState(null);
  const coverImage = images[coverIndex] || images.find(Boolean) || getListingCoverImage(listing, defaultListingImage);
  const activeDopingTypes = getListingActiveDopingTypes(listing);
  const currentDopingOptions = dopingType === 'vitrine' ? vitrineOptions : featuredOptions;
  const selectedDopingOption =
    currentDopingOptions.find((option) => Number(option.hours) === Number(dopingHours)) || currentDopingOptions[0] || null;

  useEffect(() => {
    if (!currentDopingOptions.length) {
      setDopingHours(null);
      return;
    }
    if (!currentDopingOptions.some((option) => Number(option.hours) === Number(dopingHours))) {
      setDopingHours(currentDopingOptions[0].hours);
    }
  }, [currentDopingOptions, dopingHours]);

  const addImage = () => setImages((current) => [...current, '']);
  const setImage = (idx, value) => setImages((current) => current.map((item, itemIdx) => (itemIdx === idx ? value : item)));
  const queueImageDeletion = (url) => {
    if (!url) return;
    if (originalImages.includes(url)) {
      setPendingDeleteImages((current) => (current.includes(url) ? current : [...current, url]));
      return;
    }
    adminDeleteListingImage(url).catch(() => {});
  };
  const removeImage = (idx) => {
    const imageUrl = images[idx];
    queueImageDeletion(imageUrl);
    setImages((current) => (current.length > 1 ? current.filter((_, itemIdx) => itemIdx !== idx) : ['']));
    setCoverIndex((current) => {
      if (images.length <= 1) return 0;
      if (current === idx) return 0;
      if (current > idx) return current - 1;
      return Math.min(current, images.length - 2);
    });
  };
  const uploadImageFile = async (idx, file) => {
    setUploadingIdx(idx);
    const previousUrl = images[idx];
    try {
      const url = await adminUploadListingImage(file);
      setImage(idx, url);
      if (previousUrl && previousUrl !== url) {
        queueImageDeletion(previousUrl);
      }
      showToast('Gorsel yuklendi ve filigran eklendi.');
    } catch (error) {
      showToast(error.message || 'Gorsel yuklenemedi.');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const nextImages = images.filter(Boolean);
      const nextCoverIndex = nextImages.length > 0 ? Math.min(Math.max(0, coverIndex), nextImages.length - 1) : 0;
      await adminUpdateListing({
        listing_id: listing.id,
        ...form,
        images: nextImages,
        cover_index: nextCoverIndex,
      });
      if (pendingDeleteImages.length > 0) {
        await Promise.allSettled(pendingDeleteImages.map((url) => adminDeleteListingImage(url)));
      }
      showToast('Ilan guncellendi.');
      onRefresh();
      onClose();
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Ilani kalici olarak sil?')) return;
    setSaving(true);
    try {
      await adminDeleteListing(listing.id);
      showToast('Ilan silindi.');
      onRefresh();
      onClose();
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyDoping = async () => {
    if (!selectedDopingOption) {
      showToast('Once bir doping paketi sec.');
      return;
    }

    setSaving(true);
    try {
      await adminApplyListingDoping({
        listing_id: listing.id,
        doping_type: dopingType,
        doping_hours: selectedDopingOption.hours,
      });
      showToast('Doping uygulandi.');
      onRefresh();
      onClose();
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClearDoping = async () => {
    setSaving(true);
    try {
      await adminClearListingDoping(listing.id, dopingType);
      showToast('Doping kaldirildi.');
      onRefresh();
      onClose();
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Ilan #{listing.id}</h2>
            <p className="mt-0.5 text-xs text-gray-400">{fmtDateTime(listing.created_at)}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4">
            {coverImage ? (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                <img src={coverImage} alt={listing.title} className="h-48 w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm font-semibold text-gray-400">
                Gorsel yok
              </div>
            )}

            <div className="space-y-1.5 rounded-xl bg-gray-50 p-3">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-gray-500">Satici</span>
                <span className="text-right font-bold text-gray-800">{listing.seller || '-'}</span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-gray-500">Kategori</span>
                <span className="text-right font-semibold text-gray-700">{listing.category || '-'}</span>
              </div>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-gray-500">Teslimat</span>
                <span className="text-right font-semibold text-gray-700">
                  {listing.delivery_type === 'stock' ? `Stoklu (${listing.stock_count || 0} aktif)` : 'Manuel'}
                </span>
              </div>
              {listing.expires_at ? (
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-500">Bitis</span>
                  <span className="text-right font-semibold text-gray-700">{fmtDateTime(listing.expires_at)}</span>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-gray-500">Goruntulenme</span>
                <span className="text-right font-semibold text-gray-700">{listing.view_count || 0}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3 rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-extrabold text-gray-900">Ilan Bilgileri</h3>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-600">Baslik</label>
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
                <label className="mb-1.5 block text-xs font-bold text-gray-600">Aciklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Ilan Gorselleri</h3>
                  <p className="text-[11px] font-semibold text-gray-400">WebP + filigranli yukleme</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gray-500">
                  {images.filter(Boolean).length}/{maxImages}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {images.map((imageUrl, idx) => (
                  <div key={idx} className={`relative overflow-hidden rounded-xl border bg-white p-2 shadow-sm ${coverIndex === idx ? 'border-violet-400 ring-2 ring-violet-100' : 'border-gray-100'}`}>
                    <button
                      type="button"
                      onClick={() => setCoverIndex(idx)}
                      disabled={!imageUrl}
                      title="Kapak yap"
                      className={`absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[9px] font-black shadow-sm transition-all disabled:opacity-40 ${coverIndex === idx ? 'bg-violet-600 text-white' : 'bg-white/90 text-gray-500 hover:bg-violet-50 hover:text-violet-600'}`}
                    >
                      <ImageIcon size={10} />
                      {coverIndex === idx ? 'Kapak' : `${idx + 1}`}
                    </button>
                    {(imageUrl || images.length > 1) ? (
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        disabled={saving || uploadingIdx !== null}
                        className="absolute right-2 top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-red-400 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : null}
                    <div className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      {imageUrl ? (
                        <img src={imageUrl} alt={`Gorsel ${idx + 1}`} className="h-28 w-full object-contain" />
                      ) : (
                        <div className="flex h-28 items-center justify-center px-2 text-center text-[10px] font-bold text-gray-400">
                          Gorsel yok
                        </div>
                      )}
                    </div>
                    <label className="mt-2 flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-violet-600 px-2 py-1.5 text-[10px] font-extrabold text-white shadow-sm shadow-violet-500/20 transition-colors hover:bg-violet-500">
                      {uploadingIdx === idx
                        ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-violet-300 border-t-white" />
                        : <Upload size={11} />}
                      {imageUrl ? 'Degistir' : 'Yukle'}
                      <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/bmp" className="hidden" disabled={saving || uploadingIdx !== null} onChange={(event) => { if (event.target.files[0]) uploadImageFile(idx, event.target.files[0]); event.target.value = ''; }} />
                    </label>
                  </div>
                ))}
                {images.length < maxImages ? (
                  <button
                    type="button"
                    onClick={addImage}
                    disabled={saving || uploadingIdx !== null}
                    className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-3 text-xs font-black text-violet-600 transition-all hover:border-violet-400 hover:bg-violet-50 disabled:opacity-40"
                  >
                    <Plus size={16} /> Gorsel Ekle
                  </button>
                ) : null}
              </div>
            </div>

          </div>
        </div>

        {/* Doping Yönetimi — tam genişlik, alt kısımda yatay düzen */}
        <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Doping Yonetimi</h3>
              <p className="mt-1 text-xs text-gray-500">Ilan icin admin tarafindan vitrin veya one cikar paketi tanimla.</p>
            </div>
            {activeDopingTypes.length ? (
              <div className="flex flex-wrap justify-end gap-1.5">
                {activeDopingTypes.map((type) => (
                  <span key={type} className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${getDopingTypeMeta(type).buttonClass}`}>
                    {getDopingTypeMeta(type).label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Sol: Doping tipi seçimi */}
            <div className="flex gap-2 lg:flex-col lg:w-48 shrink-0">
              {[
                { key: 'vitrine', options: vitrineOptions },
                { key: 'featured', options: featuredOptions },
              ].map((group) => {
                const meta = getDopingTypeMeta(group.key);
                const active = dopingType === group.key;
                const expiresAt = group.key === 'vitrine' ? listing.vitrine_expires_at : listing.featured_expires_at;
                const remaining = getDopingRemainingLabel(expiresAt);
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setDopingType(group.key)}
                    className={`flex-1 rounded-xl border p-2.5 text-left transition-all lg:flex-none ${active ? 'border-violet-500 bg-white shadow-sm' : 'border-slate-200 bg-white/70 hover:border-violet-200'}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.buttonClass}`}>{meta.label}</div>
                      {remaining ? (
                        <div className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">{remaining}</div>
                      ) : null}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold text-slate-400">{group.options.length} paket</div>
                  </button>
                );
              })}
            </div>

            {/* Orta: Süre paketleri */}
            <div className="flex-1">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">Sure Paketi</div>
              {currentDopingOptions.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {currentDopingOptions.map((option) => {
                    const active = Number(selectedDopingOption?.hours) === Number(option.hours);
                    return (
                      <button
                        key={`${dopingType}-${option.hours}`}
                        type="button"
                        onClick={() => setDopingHours(option.hours)}
                        className={`rounded-lg border px-3 py-2 text-left transition-all ${active ? 'border-violet-500 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-violet-200'}`}
                      >
                        <div className="text-sm font-black text-slate-900">{formatDopingDuration(option.hours)}</div>
                        <div className="text-xs font-semibold text-slate-500">{Number(option.price || 0).toFixed(2)} ₺</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-400">
                  Bu doping tipi icin ayar bulunmuyor.
                </div>
              )}
            </div>

            {/* Sağ: Butonlar */}
            <div className="flex gap-2 lg:flex-col lg:justify-start shrink-0">
              <button
                type="button"
                onClick={handleApplyDoping}
                disabled={saving || !selectedDopingOption}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
              >
                {saving ? 'Uygulaniyor...' : 'Doping Uygula'}
              </button>
              {activeDopingTypes.includes(dopingType) ? (
                <button
                  type="button"
                  onClick={handleClearDoping}
                  disabled={saving}
                  className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                >
                  Dopingi Kaldir
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Alt butonlar */}
        <div className="mt-4 flex flex-wrap gap-2">
          {listing.delivery_type === 'stock' ? (
            <button
              type="button"
              onClick={() => onManageStocks(listing)}
              className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-100"
            >
              <Package size={13} /> Stoklari Yonet
            </button>
          ) : null}
          <a
            href={listingSlug(listing.title, listing.id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:border-gray-300"
          >
            <ExternalLink size={13} /> Goruntule
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={13} />
            Sil
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
  const [stockListing, setStockListing] = useState(null);
  const { dopingVitrineOptions, dopingFeaturedOptions, defaultListingImage } = useSiteBrand();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    adminGetListings({ page, search, status: filterStatus })
      .then((response) => {
        setListings(response.data.listings || []);
        setTotal(response.data.total || 0);
        setPages(response.data.pages || 1);
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
      showToast('Durum guncellendi.');
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleDeleteListing = async (listing) => {
    if (!confirm(`"${listing.title}" ilanini kalici olarak sil?`)) return;
    try {
      await adminDeleteListing(listing.id);
      if (selectedListing?.id === listing.id) setSelectedListing(null);
      if (stockListing?.id === listing.id) setStockListing(null);
      showToast('Ilan silindi.');
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  const visibleListings = useMemo(() => listings || [], [listings]);

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
              placeholder="Baslik veya satici ara..."
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
            <option value="">Tum Durumlar</option>
            {Object.entries(STATUS_MAP).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h3 className="font-extrabold text-gray-800">Ilanlar</h3>
            <span className="text-sm text-gray-500">{total} ilan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Ilan</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 md:table-cell">Satici</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 sm:table-cell">Fiyat</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 lg:table-cell">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">Islemler</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Yukleniyor...
                    </td>
                  </tr>
                ) : visibleListings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Ilan bulunamadi.
                    </td>
                  </tr>
                ) : (
                  visibleListings.map((listing) => {
                    const statusMeta = STATUS_MAP[listing.status] || {
                      label: listing.status || 'Belirsiz',
                      colorClass: 'text-gray-600 bg-gray-100',
                    };
                    const coverImage = getListingCoverImage(listing, defaultListingImage);
                    const activeDopingTypes = getListingActiveDopingTypes(listing);

                    return (
                      <tr key={listing.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                              {coverImage ? (
                                <img src={coverImage} alt={listing.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">-</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="max-w-[200px] truncate font-bold text-gray-800">{listing.title}</div>
                              <div className="text-xs text-gray-400">
                                #{listing.id} · {listing.delivery_type === 'stock' ? `Stok(${listing.stock_count || 0})` : 'Manuel'}
                              </div>
                              {activeDopingTypes.length ? (
                                <div className="mt-1">
                                  <div className="flex flex-wrap gap-1">
                                    {activeDopingTypes.map((type) => (
                                      <span key={`${listing.id}-${type}`} className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${getDopingTypeMeta(type).buttonClass}`}>
                                        {getDopingTypeMeta(type).label}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
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
                              title="Detay / Duzenle"
                              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-violet-50 hover:text-violet-600"
                            >
                              <Pencil size={14} />
                            </button>
                            <a
                              href={listingSlug(listing.title, listing.id)}
                              target="_blank"
                              rel="noreferrer"
                              title="Goruntule"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                            >
                              <ExternalLink size={14} />
                            </a>
                            {listing.status !== 'active' ? (
                              <button
                                onClick={() => handleQuickStatus(listing.id, 'active')}
                                title="Aktiflestir"
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"
                              >
                                <CheckCircle size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleQuickStatus(listing.id, 'removed')}
                                title="Kaldir"
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
          onManageStocks={(nextListing) => setStockListing(nextListing)}
          showToast={showToast}
          vitrineOptions={dopingVitrineOptions}
          featuredOptions={dopingFeaturedOptions}
          defaultListingImage={defaultListingImage}
        />
      ) : null}

      {stockListing ? (
        <StockManagerModal
          listing={stockListing}
          onClose={() => setStockListing(null)}
          onRefresh={load}
          showToast={showToast}
        />
      ) : null}
    </AdminLayout>
  );
}
