import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminDeleteProduct,
  adminGetCategories,
  adminGetProducts,
  adminSaveProduct,
  adminUploadImage,
} from '../../lib/adminApi';
import { productSlug } from '../../lib/api';

const PRODUCT_TYPE_OPTIONS = [
  { value: 'digital_code', label: 'Dijital Kod' },
  { value: 'account', label: 'Hesap' },
  { value: 'item', label: 'Item / Paket' },
  { value: 'service', label: 'Servis / Manuel Islem' },
];

const DELIVERY_TYPE_OPTIONS = [
  { value: 'automatic', label: 'Otomatik Teslim' },
  { value: 'manual', label: 'Manuel Teslim' },
];

const PRODUCT_STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'passive', label: 'Pasif', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'draft', label: 'Taslak', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'sold_out', label: 'Tukendi', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const DEFAULT_FORM = {
  title: '',
  slug: '',
  category_id: '',
  short_description: '',
  description: '',
  product_type: 'digital_code',
  delivery_type: 'automatic',
  status: 'active',
  price: '',
  sale_price: '',
  currency: 'TRY',
  cover_image: '',
  gallery: [],
  badge_text: '',
  estimated_delivery_text: '',
  stock_visibility: true,
  sort_order: 0,
  seo_title: '',
  seo_description: '',
  inventory_entries: [],
};

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function money(value) {
  return `${Number(value || 0).toFixed(2)} ₺`;
}

function inventoryPayloadToText(entry) {
  const payload = entry?.payload || {};
  if (payload.content) return String(payload.content);
  return Object.entries(payload)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

function statusMeta(status) {
  return PRODUCT_STATUS_OPTIONS.find((option) => option.value === status) || PRODUCT_STATUS_OPTIONS[0];
}

function InventoryRowEditor({ row, onChange, onRemove }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_180px_minmax(0,1fr)_auto]">
        <select
          value={row.entry_type}
          onChange={(e) => onChange({ ...row, entry_type: e.target.value })}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
        >
          <option value="code">Kod</option>
          <option value="account">Hesap</option>
          <option value="manual">Manuel</option>
          <option value="custom">Ozel</option>
        </select>
        <input
          value={row.label}
          onChange={(e) => onChange({ ...row, label: e.target.value })}
          placeholder="Etiket"
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
        />
        <textarea
          value={row.payloadText}
          onChange={(e) => onChange({ ...row, payloadText: e.target.value })}
          rows={3}
          placeholder="Teslim edilecek icerik"
          className="min-h-[92px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none resize-y"
        />
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...row, is_active: !row.is_active })}
            className={`rounded-xl px-3 py-2 text-xs font-black transition-colors ${
              row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {row.is_active ? 'Aktif' : 'Pasif'}
          </button>
          {!row.is_sold ? (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition-colors hover:bg-red-100"
            >
              Sil
            </button>
          ) : (
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-center text-[11px] font-black text-slate-500">
              Satildi
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductModal({ open, onClose, onSave, product, categories, showToast, saving }) {
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (!open) return;
    if (!product) {
      setForm({
        ...DEFAULT_FORM,
        category_id: categories[0]?.id || '',
      });
      return;
    }

    setForm({
      id: product.id,
      title: product.title || '',
      slug: product.slug || '',
      category_id: product.category_id || '',
      short_description: product.short_description || '',
      description: product.description || '',
      product_type: product.product_type || 'digital_code',
      delivery_type: product.delivery_type || 'automatic',
      status: product.status || 'active',
      price: product.price ?? '',
      sale_price: product.sale_price ?? '',
      currency: product.currency || 'TRY',
      cover_image: product.cover_image || '',
      gallery: Array.isArray(product.gallery) ? product.gallery : [],
      badge_text: product.badge_text || '',
      estimated_delivery_text: product.estimated_delivery_text || '',
      stock_visibility: Number(product.stock_visibility) === 1,
      sort_order: product.sort_order || 0,
      seo_title: product.seo_title || '',
      seo_description: product.seo_description || '',
      inventory_entries: (product.inventory_entries || []).map((entry) => ({
        id: entry.id,
        entry_type: entry.entry_type || 'code',
        label: entry.label || '',
        payloadText: inventoryPayloadToText(entry),
        is_active: Number(entry.is_active) === 1,
        is_sold: Number(entry.is_sold) === 1,
      })),
    });
  }, [open, product, categories]);

  const selectedCategory = useMemo(
    () => categories.find((item) => String(item.id) === String(form.category_id)) || null,
    [categories, form.category_id],
  );

  const addInventoryRow = () => {
    setForm((prev) => ({
      ...prev,
      inventory_entries: [
        ...prev.inventory_entries,
        { id: 0, entry_type: 'code', label: '', payloadText: '', is_active: true, is_sold: false },
      ],
    }));
  };

  const save = () => {
    onSave({
      ...form,
      inventory_entries: form.inventory_entries.map((row) => ({
        id: row.id || undefined,
        entry_type: row.entry_type,
        label: row.label,
        is_active: row.is_active ? 1 : 0,
        payload: row.payloadText.trim() ? { content: row.payloadText.trim() } : {},
      })),
    });
  };

  const uploadCover = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await adminUploadImage(file, 'products');
      setForm((prev) => ({ ...prev, cover_image: url }));
      showToast('Kapak gorseli yuklendi.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setUploadingCover(false);
    }
  };

  const uploadGallery = async (files) => {
    if (!files?.length) return;
    setUploadingGallery(true);
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const url = await adminUploadImage(file, 'products');
        uploaded.push(url);
      }
      setForm((prev) => ({ ...prev, gallery: [...prev.gallery, ...uploaded] }));
      showToast('Galeri gorselleri eklendi.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setUploadingGallery(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">{product ? 'Site Urunu Duzenle' : 'Yeni Site Urunu'}</h2>
            <p className="mt-0.5 text-xs font-semibold text-gray-400">Stok ve teslimat alanlari urunun kendi icinde yonetilir.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Tur</label>
                  <div className="flex h-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                    <Box size={20} className="text-violet-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Urun Basligi *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value, slug: slugify(e.target.value) }))}
                    placeholder="Orn: Valorant 475 VP Resmi Kod"
                    className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">URL *</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                    className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-mono focus:border-violet-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Kategori *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                  >
                    <option value="">Kategori sec</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Urun Tipi</label>
                  <select
                    value={form.product_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, product_type: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                  >
                    {PRODUCT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Teslimat Tipi</label>
                  <select
                    value={form.delivery_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, delivery_type: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                  >
                    {DELIVERY_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Durum</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                  >
                    {PRODUCT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Kisa Aciklama</label>
                  <input
                    value={form.short_description}
                    onChange={(e) => setForm((prev) => ({ ...prev, short_description: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Rozet Metni</label>
                  <input
                    value={form.badge_text}
                    onChange={(e) => setForm((prev) => ({ ...prev, badge_text: e.target.value }))}
                    placeholder="Orn: Resmi Satis"
                    className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-600">Detay Aciklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none resize-y"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Normal Fiyat *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Indirimli Fiyat</label>
                  <input type="number" min="0" step="0.01" value={form.sale_price} onChange={(e) => setForm((prev) => ({ ...prev, sale_price: e.target.value }))} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Teslimat Notu</label>
                  <input value={form.estimated_delivery_text} onChange={(e) => setForm((prev) => ({ ...prev, estimated_delivery_text: e.target.value }))} placeholder="Orn: 5-30 dk" className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">Sira</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">SEO Title</label>
                  <input value={form.seo_title} onChange={(e) => setForm((prev) => ({ ...prev, seo_title: e.target.value }))} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-600">SEO Description</label>
                  <input value={form.seo_description} onChange={(e) => setForm((prev) => ({ ...prev, seo_description: e.target.value }))} className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none" />
                </div>
              </div>

              <button type="button" onClick={() => setForm((prev) => ({ ...prev, stock_visibility: !prev.stock_visibility }))} className={`inline-flex rounded-xl px-3 py-2 text-xs font-black ${form.stock_visibility ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {form.stock_visibility ? 'Stok bilgisi gorunur' : 'Stok bilgisi gizli'}
              </button>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-gray-800">Stok / Teslimat Icerigi</h3>
                  <p className="mt-1 text-xs text-gray-400">Her sey bu urunun icinde yonetilir; ayri stok sayfasi yok.</p>
                </div>
                <button type="button" onClick={addInventoryRow} className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white hover:bg-violet-500">
                  <Plus size={13} /> Satir Ekle
                </button>
              </div>

              {form.inventory_entries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                  {form.delivery_type === 'automatic'
                    ? 'Otomatik teslim urunlerinde en az bir aktif satir bulunmali.'
                    : 'Manuel teslim urunleri icin istersen teslim satirlari veya notlar ekleyebilirsin.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {form.inventory_entries.map((row, index) => (
                    <InventoryRowEditor
                      key={row.id || `new-${index}`}
                      row={row}
                      onChange={(nextRow) => setForm((prev) => ({
                        ...prev,
                        inventory_entries: prev.inventory_entries.map((item, itemIndex) => (itemIndex === index ? nextRow : item)),
                      }))}
                      onRemove={() => setForm((prev) => ({
                        ...prev,
                        inventory_entries: prev.inventory_entries.filter((_, itemIndex) => itemIndex !== index),
                      }))}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-800">Kapak Gorseli</h3>
                <button type="button" onClick={() => coverInputRef.current?.click()} className="inline-flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100">
                  {uploadingCover ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {form.cover_image ? 'Degistir' : 'Yukle'}
                </button>
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadCover(e.target.files?.[0])} />
              {form.cover_image ? (
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-slate-50">
                  <img src={form.cover_image} alt="" className="aspect-[4/3] w-full object-cover" />
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, cover_image: '' }))} className="absolute right-3 top-3 rounded-xl bg-black/70 px-2 py-1 text-[11px] font-black text-white hover:bg-black">
                    Kaldir
                  </button>
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-gray-300">
                  <ImageIcon size={30} />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-800">Galeri</h3>
                <button type="button" onClick={() => galleryInputRef.current?.click()} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-100">
                  {uploadingGallery ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Gorsel Ekle
                </button>
              </div>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadGallery(e.target.files)} />
              {form.gallery.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm text-gray-400">
                  Galeri bos. Sadece kapakla da yayinlayabilirsin.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {form.gallery.map((image, index) => (
                    <div key={`${image}-${index}`} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
                      <img src={image} alt="" className="aspect-square w-full object-cover" />
                      <button type="button" onClick={() => setForm((prev) => ({ ...prev, gallery: prev.gallery.filter((_, itemIndex) => itemIndex !== index) }))} className="absolute right-1.5 top-1.5 rounded-lg bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-950 p-4 text-white shadow-xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">Canli Onizleme</p>
                  <h3 className="mt-1 font-extrabold">{form.title || 'Urun Basligi'}</h3>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${statusMeta(form.status).tone}`}>
                  {statusMeta(form.status).label}
                </span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {form.cover_image ? (
                  <img src={form.cover_image} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/20 text-white/35">
                    <Package size={34} />
                  </div>
                )}
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-white/80">{selectedCategory?.name || 'Kategori'}</span>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black text-emerald-300">
                      {DELIVERY_TYPE_OPTIONS.find((item) => item.value === form.delivery_type)?.label || 'Teslimat'}
                    </span>
                    {form.badge_text ? <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-[10px] font-black text-violet-200">{form.badge_text}</span> : null}
                  </div>
                  <p className="text-sm font-semibold text-white/75">{form.short_description || 'Kisa aciklama burada gorunur.'}</p>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      {form.sale_price ? <p className="text-xs font-bold text-white/35 line-through">{money(form.price)}</p> : null}
                      <p className="text-2xl font-black text-emerald-300">{money(form.sale_price || form.price)}</p>
                    </div>
                    <div className="text-right text-[11px] font-semibold text-white/55">
                      <div>{form.delivery_type === 'automatic' ? 'Aninda teslim' : (form.estimated_delivery_text || 'Manuel teslim')}</div>
                      <div>{form.stock_visibility ? `${form.inventory_entries.filter((item) => item.is_active && !item.is_sold).length} aktif stok` : 'Stok gizli'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-white/45">
                <span>{productSlug(form.title || 'urun', form.id || 0)}</span>
                <span className="inline-flex items-center gap-1"><ShieldCheck size={12} /> Site Urunu</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-black text-gray-600 hover:bg-gray-50">
            Vazgec
          </button>
          <button type="button" onClick={save} disabled={saving || uploadingCover || uploadingGallery} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-500 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Edit3 size={15} />}
            {product ? 'Urunu Kaydet' : 'Urunu Olustur'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductListCard({ product, onEdit, onDelete }) {
  const meta = statusMeta(product.status);
  const currentPrice = Number(product.current_price ?? product.sale_price ?? product.price ?? 0);
  const basePrice = Number(product.price ?? 0);

  return (
    <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-[132px_minmax(0,1fr)]">
        <div className="relative bg-slate-100">
          {product.cover_image ? (
            <img src={product.cover_image} alt={product.title} className="h-full w-full object-contain p-2 md:min-h-[132px]" />
          ) : (
            <div className="flex h-full min-h-[132px] items-center justify-center bg-gradient-to-br from-violet-100 to-cyan-100 text-violet-400">
              <Package size={24} />
            </div>
          )}
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${meta.tone}`}>{meta.label}</span>
            <span className="rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-black text-slate-700">
              Site Urunu
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-2 p-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-gray-400">
              <span>{product.category_name || 'Kategori yok'}</span>
              <span>•</span>
              <span>{PRODUCT_TYPE_OPTIONS.find((item) => item.value === product.product_type)?.label || product.product_type}</span>
              <span>•</span>
              <span>{DELIVERY_TYPE_OPTIONS.find((item) => item.value === product.delivery_type)?.label || product.delivery_type}</span>
            </div>
            <div>
              <h3 className="line-clamp-1 text-[15px] font-extrabold leading-tight text-gray-900">{product.title}</h3>
              <p className="mt-0.5 text-xs font-semibold text-gray-400">/{product.product_path || productSlug(product.title, product.id)}</p>
            </div>
            <p className="line-clamp-2 text-[11px] leading-4 text-gray-500">
              {product.short_description || product.description || 'Bu urun icin henuz kisa aciklama eklenmedi.'}
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-100 pt-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-gray-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">Aktif stok: {Number(product.available_stock_count || 0)}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5">Toplam satir: {Number(product.inventory_count || 0)}</span>
              {product.badge_text ? <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-700">{product.badge_text}</span> : null}
            </div>
            <div className="flex items-center justify-between gap-2.5">
              <div className="text-right">
                {product.sale_price ? <div className="text-[11px] font-bold text-gray-300 line-through">{money(basePrice)}</div> : null}
                <div className="text-lg font-black leading-none text-emerald-600">{money(currentPrice)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="inline-flex items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[10px] font-black text-violet-700 hover:bg-violet-100"
                >
                  <Edit3 size={13} /> Duzenle
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(product)}
                  className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-black text-red-600 hover:bg-red-100"
                >
                  <Trash2 size={13} /> Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const productCategories = useMemo(
    () => categories.filter((item) => item.node_type === 'sellable' && item.content_type === 'product'),
    [categories],
  );

  const loadCategories = useCallback(async () => {
    try {
      const response = await adminGetCategories();
      setCategories(response.data || []);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminGetProducts({
        page,
        search,
        status: statusFilter,
        product_type: typeFilter,
        delivery_type: deliveryFilter,
      });
      setProducts(response.data.products || []);
      setTotal(Number(response.data.total || 0));
      setPages(Number(response.data.pages || 1));
    } catch (error) {
      showToast(error.message);
      setProducts([]);
      setTotal(0);
      setPages(1);
    } finally {
      setLoading(false);
    }
  }, [deliveryFilter, page, search, showToast, statusFilter, typeFilter]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openCreate = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    if (!payload.title?.trim() || !payload.slug?.trim() || !payload.category_id || !payload.price) {
      showToast('Baslik, URL, kategori ve fiyat zorunlu.');
      return;
    }

    setSaving(true);
    try {
      await adminSaveProduct(payload);
      showToast(selectedProduct ? 'Urun guncellendi.' : 'Urun olusturuldu.');
      setModalOpen(false);
      setSelectedProduct(null);
      loadProducts();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`"${product.title}" urununu silmek istiyor musun?`)) return;
    try {
      await adminDeleteProduct(product.id);
      showToast('Urun silindi.');
      loadProducts();
    } catch (error) {
      showToast(error.message);
    }
  };

  return (
    <AdminLayout>
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-2xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="space-y-5">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Site Urunleri</h1>
              <p className="mt-1 text-sm font-semibold text-gray-400">
                Resmi urun, hesap, item ve manuel teslim urunlerini tek panelden yonetin.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition-colors hover:bg-violet-500"
            >
              <Plus size={16} /> Yeni Site Urunu
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Urun ara..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-violet-400 focus:outline-none"
              />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none">
              <option value="">Tum durumlar</option>
              {PRODUCT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none">
              <option value="">Tum urun tipleri</option>
              {PRODUCT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select value={deliveryFilter} onChange={(e) => { setDeliveryFilter(e.target.value); setPage(1); }} className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none">
              <option value="">Tum teslim tipleri</option>
              {DELIVERY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400">
            <span>{total} urun</span>
            <span>•</span>
            <span>{productCategories.length} site urunu kategorisi</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-violet-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
              <Package size={28} />
            </div>
            <h2 className="text-xl font-extrabold text-gray-800">Henuz site urunu yok</h2>
            <p className="mt-2 text-sm font-semibold text-gray-400">
              Ilk urunu ekledikten sonra stok, teslimat ve siparis akisi ayni yerden yonetilecek.
            </p>
            <button type="button" onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white hover:bg-violet-500">
              <Plus size={15} /> Ilk site urununu olustur
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <ProductListCard key={product.id} product={product} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <span className="text-sm font-semibold text-gray-400">Sayfa {page} / {pages}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Geri
              </button>
              <button type="button" disabled={page >= pages} onClick={() => setPage((prev) => Math.min(pages, prev + 1))} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Ileri
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleSave}
        product={selectedProduct}
        categories={productCategories}
        showToast={showToast}
        saving={saving}
      />
    </AdminLayout>
  );
}
