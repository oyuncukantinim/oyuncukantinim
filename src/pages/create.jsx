import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Image as ImageIcon, Plus, Trash2,
  Clock, Package, Info, Tag, Truck, Check, Upload
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';
import { addListing, deleteListingImage, uploadListingImage } from '../lib/api';
import CategoryPicker from '../components/CategoryPicker';
import useSiteBrand from '../hooks/useSiteBrand';
import { findDopingOption, formatDopingDuration, getDopingTypeMeta, normalizeDopingOptions } from '../lib/doping';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

async function fetchPublic(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const json = await res.json();
  return json.data;
}

const DELIVERY_HOURS = [1, 2, 4, 6, 12, 24, 48, 72];

const STEPS = [
  { id: 1, label: 'Kategori',       icon: Tag },
  { id: 2, label: 'İlan Bilgileri', icon: Info },
  { id: 3, label: 'Doping',         icon: Package },
];

function StepBar({ current }) {
  return (
    <div className="mb-8 grid w-full grid-cols-3 items-start">
      {STEPS.map((step, i) => {
        const done   = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="relative flex min-w-0 flex-col items-center">
            {i < STEPS.length - 1 && (
              <div className={`absolute left-[calc(50%+22px)] right-[calc(-50%+22px)] top-[18px] h-0.5 rounded-full ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
            <div className="relative z-10 flex flex-col items-center gap-1 text-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${done ? 'bg-emerald-500 text-white' : active ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <Check size={16} /> : <step.icon size={16} />}
              </div>
              <span className={`hidden max-w-[120px] text-xs font-bold leading-tight sm:block ${active ? 'text-violet-600' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CreatePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useCart();
  const {
    maxListingImages: defaultMaxImages,
    listingTitleMax: defaultTitleMax,
    listingDescMax: defaultDescMax,
    minListingPrice: defaultMinListingPrice,
    maxListingPrice: defaultMaxListingPrice,
    maxListingsPerUser,
    manualDeliveryMaxHours: defaultManualDeliveryMaxHours,
    stockItemMaxCount: defaultStockItemMaxCount,
    stockItemContentMax: defaultStockItemContentMax,
    dopingVitrineOptions: defaultVitrineOptions,
    dopingFeaturedOptions: defaultFeaturedOptions,
  } = useSiteBrand();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [catAttrs, setCatAttrs] = useState([]);
  const [attrValues, setAttrValues] = useState({});

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState(['']);
  const [coverIndex, setCoverIndex] = useState(0);

  const [deliveryType, setDeliveryType] = useState('manual');
  const [deliveryHours, setDeliveryHours] = useState(24);
  const [stocks, setStocks] = useState([{ content: '' }]);
  const [selectedDopings, setSelectedDopings] = useState({});
  const [vitrineOptions, setVitrineOptions] = useState(defaultVitrineOptions);
  const [featuredOptions, setFeaturedOptions] = useState(defaultFeaturedOptions);

  // Admin tarafından belirlenen limitler
  const [maxImages, setMaxImages] = useState(defaultMaxImages);
  const [titleMax, setTitleMax] = useState(defaultTitleMax);
  const [descMax, setDescMax] = useState(defaultDescMax);
  const [siteMinPrice, setSiteMinPrice] = useState(defaultMinListingPrice);
  const [siteMaxPrice, setSiteMaxPrice] = useState(defaultMaxListingPrice);
  const [manualDeliveryMaxHours, setManualDeliveryMaxHours] = useState(defaultManualDeliveryMaxHours);
  const [stockItemMaxCount, setStockItemMaxCount] = useState(defaultStockItemMaxCount);
  const [stockItemContentMax, setStockItemContentMax] = useState(defaultStockItemContentMax);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchPublic('get_categories_tree').then(d => setCategories(d || []));
    fetch(`${API_URL}?action=get_site_settings`)
      .then(r => r.json())
      .then(j => {
        if (j.status === 'success') {
          if (j.data.max_listing_images) setMaxImages(j.data.max_listing_images);
          if (j.data.listing_title_max)  setTitleMax(j.data.listing_title_max);
          if (j.data.listing_desc_max)   setDescMax(j.data.listing_desc_max);
          if (j.data.max_listing_price !== undefined && j.data.max_listing_price !== null && j.data.max_listing_price !== '') {
            setSiteMaxPrice(Number(j.data.max_listing_price));
          }
          if (j.data.manual_delivery_max_hours) {
            setManualDeliveryMaxHours(Number(j.data.manual_delivery_max_hours));
          }
          if (j.data.stock_item_max_count) {
            setStockItemMaxCount(Number(j.data.stock_item_max_count));
          }
          if (j.data.stock_item_content_max) {
            setStockItemContentMax(Number(j.data.stock_item_content_max));
          }
          setVitrineOptions(normalizeDopingOptions(j.data.listing_doping_vitrine_options, 'vitrine'));
          setFeaturedOptions(normalizeDopingOptions(j.data.listing_doping_featured_options, 'featured'));
          if (j.data.min_listing_price !== undefined && j.data.min_listing_price !== null && j.data.min_listing_price !== '') {
            setSiteMinPrice(Number(j.data.min_listing_price));
          }
        }
      })
      .catch(() => {});
  }, [user, navigate]);

  useEffect(() => {
    if (!selectedCategory) { setCatAttrs([]); setAttrValues({}); return; }
    fetchPublic('get_category_attributes', { category_id: selectedCategory.id })
      .then(d => {
        setCatAttrs(d || []);
        const def = {};
        (d || []).forEach(a => { def[a.slug] = a.type === 'multiselect' ? [] : ''; });
        setAttrValues(def);
      });
  }, [selectedCategory]);

  const effectiveCommission = selectedCategory?.effective_commission ?? selectedCategory?.commission_rate ?? null;
  const effectiveMinPrice   = selectedCategory?.effective_min_price ?? selectedCategory?.min_price ?? siteMinPrice;
  const priceNum   = parseFloat(price) || 0;
  const commission = priceNum * ((effectiveCommission ?? 10) / 100);
  const earnings   = priceNum - commission;
  const selectedDopingEntries = [
    selectedDopings.vitrine ? { type: 'vitrine', option: findDopingOption(vitrineOptions, selectedDopings.vitrine) } : null,
    selectedDopings.featured ? { type: 'featured', option: findDopingOption(featuredOptions, selectedDopings.featured) } : null,
  ].filter((entry) => entry?.option);
  const selectedDopingPrice = selectedDopingEntries.reduce((sum, entry) => sum + Number(entry.option.price || 0), 0);
  const validImages = images.filter(Boolean);

  const handlePriceChange = (value) => {
    if (value === '') {
      setPrice('');
      return;
    }

    setPrice(value);
  };

  const handlePriceBlur = () => {
    if (price === '' || effectiveMinPrice === null) return;
    const numeric = parseFloat(price);
    if (!Number.isNaN(numeric) && numeric < effectiveMinPrice) {
      setPrice(String(effectiveMinPrice));
    }
  };

  const canNext = () => {
    if (step === 1) return !!selectedCategory;
    if (step === 2) return canProceedFromInfo();
    if (step === 3) return true;
    return true;
  };

  const canProceedFromInfo = () => {
    const infoValid = !!title.trim() && !!price && priceNum > 0;
    if (!infoValid) return false;
    if (validImages.length < 1) return false;
    if (effectiveMinPrice !== null && priceNum < effectiveMinPrice) return false;
    if (siteMaxPrice !== null && priceNum > siteMaxPrice) return false;
    const attributesValid = catAttrs.filter(a => a.is_required).every(a => {
      const v = attrValues[a.slug];
      return v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0);
    });
    if (!attributesValid) return false;
    return canProceedFromDelivery();
  };

  const canProceedFromDelivery = () => {
    if (deliveryType === 'manual' && deliveryHours > manualDeliveryMaxHours) return false;
    if (deliveryType === 'stock' && stocks.length > stockItemMaxCount) return false;
    if (deliveryType === 'stock') return stocks.some(s => s.content.trim() !== '');
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const validStocks = stocks
        .map(s => ({ ...s, content: String(s.content || '').slice(0, stockItemContentMax) }))
        .filter(s => s.content.trim() !== '');
      if (siteMaxPrice !== null && priceNum > siteMaxPrice) {
        throw new Error(`Maksimum ilan fiyatı ${siteMaxPrice}₺ olabilir.`);
      }
      if (deliveryType === 'manual' && deliveryHours > manualDeliveryMaxHours) {
        throw new Error(`Manuel teslimat süresi en fazla ${manualDeliveryMaxHours} saat olabilir.`);
      }
      if (deliveryType === 'stock' && validStocks.length > stockItemMaxCount) {
        throw new Error('İzin verilen stok satırı sınırını aşıyorsun.');
      }
      if (validImages.length < 1) {
        throw new Error('En az 1 ilan görseli eklemelisin.');
      }
      const res = await addListing({
        title,
        price: priceNum,
        description,
        category:    selectedCategory?.slug || '',
        category_id: selectedCategory?.id   || null,
        images:      validImages,
        cover_index: coverIndex,
        delivery_type:  deliveryType,
        delivery_hours: deliveryHours,
        dopings: selectedDopingEntries.map((entry) => ({ type: entry.type, hours: entry.option.hours })),
        attributes:     attrValues,
        stocks: deliveryType === 'stock' ? validStocks : [],
      });
      if (selectedDopingPrice > 0 && res.data?.new_balance !== undefined) {
        updateUser({
          ...user,
          balance: Number(res.data.new_balance),
          ...(res.data.new_withdrawable_balance !== undefined
            ? { withdrawable_balance: Number(res.data.new_withdrawable_balance) }
            : {}),
        });
      }
      showToast('İlan başarıyla yayınlandı!');
      navigate('/profile');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addImage    = () => setImages(i => [...i, '']);
  const setImage    = (idx, val) => setImages(i => i.map((x, j) => j === idx ? val : x));

  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [deletingIdx, setDeletingIdx] = useState(null);
  const uploadImageFile = async (idx, file) => {
    setUploadingIdx(idx);
    const previousUrl = images[idx];
    try {
      const url = await uploadListingImage(file);
      setImage(idx, url);
      if (previousUrl && previousUrl !== url) {
        deleteListingImage(previousUrl).catch(() => {});
      }
      showToast('Görsel yüklendi ve filigran eklendi.');
    } catch (err) {
      showToast(err.message || 'Yükleme sırasında bir hata oluştu.');
    } finally {
      setUploadingIdx(null);
    }
  };
  const removeImage = async (idx) => {
    const imageUrl = images[idx];
    setDeletingIdx(idx);
    try {
      if (imageUrl) {
        await deleteListingImage(imageUrl);
      }
      setImages((current) => (current.length > 1 ? current.filter((_, j) => j !== idx) : ['']));
      setCoverIndex((current) => {
        if (images.length <= 1) return 0;
        if (current === idx) return 0;
        if (current > idx) return current - 1;
        return Math.min(current, images.length - 2);
      });
      if (imageUrl) showToast('Görsel Silindi');
    } catch (err) {
      showToast(err.message || 'Görsel silinemedi.');
    } finally {
      setDeletingIdx(null);
    }
  };

  const addStock       = () => {
    if (stocks.length >= stockItemMaxCount) {
      showToast('Daha fazla stok satırı ekleyemezsin.');
      return;
    }
    setStocks(s => [...s, { content: '' }]);
  };
  const removeStock    = (idx) => setStocks(s => s.filter((_, j) => j !== idx));
  const setStockField  = (idx, field, val) => setStocks(s => s.map((x, j) => {
    if (j !== idx) return x;
    const nextValue = field === 'content' ? String(val).slice(0, stockItemContentMax) : val;
    return { ...x, [field]: nextValue };
  }));

  const setAttr     = (slug, val) => setAttrValues(v => ({ ...v, [slug]: val }));
  const toggleMulti = (slug, opt) => {
    const cur = attrValues[slug] || [];
    setAttrValues(v => ({ ...v, [slug]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] }));
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Yeni İlan Oluştur</h1>
        <p className="mb-4 text-sm text-gray-500">Kullanıcı başına en fazla {maxListingsPerUser} ilan oluşturulabilir.</p>
        <StepBar current={step} />

        {/* ADIM 1: KATEGORİ */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">İlanınıza en uygun kategoriyi seçin. Varsa alt kategorilere devam edebilirsiniz.</p>
            <CategoryPicker categories={categories} value={selectedCategory?.id ?? null} onChange={setSelectedCategory} />
            {selectedCategory && (
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 text-sm space-y-1">
                <div className="font-bold text-violet-800">{selectedCategory.icon} {selectedCategory.name} seçildi</div>
                <div className="text-violet-600 flex flex-wrap gap-4 text-xs">
                  <span>Komisyon: <strong>%{effectiveCommission ?? 10}</strong></span>
                  {effectiveMinPrice !== null && <span>Minimum ilan fiyatı: <strong>{effectiveMinPrice}₺</strong></span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADIM 2: İLAN BİLGİLERİ */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-gray-700">İlan Başlığı *</label>
                <span className={`text-xs font-semibold ${title.length > titleMax ? 'text-red-500' : 'text-gray-400'}`}>{title.length}/{titleMax}</span>
              </div>
              <input
                value={title}
                onChange={e => e.target.value.length <= titleMax && setTitle(e.target.value)}
                placeholder="Örn: Platin Rank Valorant Hesabı"
                className={`input-field ${title.length >= titleMax ? 'border-orange-300' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Fiyat (₺) *
              </label>
              <input
                type="number"
                value={price}
                onChange={e => handlePriceChange(e.target.value)}
                onBlur={handlePriceBlur}
                placeholder={effectiveMinPrice !== null ? `${effectiveMinPrice}` : '0.00'}
                min={effectiveMinPrice || 1}
                step="0.01"
                className="input-field"
              />
              {effectiveMinPrice !== null && (
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Minimum ilan fiyatı: <strong className="text-cyan-600">{effectiveMinPrice}₺</strong></span>
                  <span>Bu alan minimum altına düşerse değer otomatik olarak güncellenir.</span>
                </div>
              )}
              {priceNum > 0 && (
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>Komisyon: <strong className="text-orange-500">-{commission.toFixed(2)}₺</strong> (%{effectiveCommission ?? 10})</span>
                  <span>Kazancınız: <strong className="text-emerald-600">{earnings.toFixed(2)}₺</strong></span>
                </div>
              )}
              {effectiveMinPrice !== null && priceNum > 0 && priceNum < effectiveMinPrice && (
                <div className="mt-2 text-xs font-semibold text-red-500">⚠️ Bu kategorinin minimum fiyatı {effectiveMinPrice}₺'dir.</div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-gray-700">Açıklama</label>
                <span className={`text-xs font-semibold ${description.length > descMax ? 'text-red-500' : 'text-gray-400'}`}>{description.length}/{descMax}</span>
              </div>
              <textarea
                value={description}
                onChange={e => e.target.value.length <= descMax && setDescription(e.target.value)}
                rows={5}
                placeholder="İlanınızı detaylıca açıklayın..."
                className={`input-field resize-none ${description.length >= descMax ? 'border-orange-300' : ''}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-gray-700">Görseller</label>
                <span className={`text-xs font-semibold ${validImages.length < 1 ? 'text-red-500' : 'text-gray-400'}`}>{validImages.length}/{maxImages}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {images.map((img, idx) => (
                  <div key={idx} className={`relative overflow-hidden rounded-2xl border bg-white p-2.5 shadow-sm transition-all ${coverIndex === idx ? 'border-violet-400 ring-2 ring-violet-100' : 'border-gray-100'}`}>
                    <button
                      onClick={() => setCoverIndex(idx)}
                      title="Kapak yap"
                      className={`absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-black shadow-sm transition-all ${coverIndex === idx ? 'bg-violet-600 text-white' : 'bg-white/90 text-gray-500 hover:bg-violet-50 hover:text-violet-600'}`}
                    >
                      <ImageIcon size={11} />
                      {coverIndex === idx ? 'Kapak' : `${idx + 1}`}
                    </button>
                    {(img || images.length > 1) && (
                      <button
                        onClick={() => removeImage(idx)}
                        disabled={uploadingIdx !== null || deletingIdx !== null}
                        className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/90 text-red-400 shadow-sm transition-colors hover:bg-red-50 disabled:opacity-40"
                      >
                        {deletingIdx === idx
                          ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                          : <Trash2 size={13} />}
                      </button>
                    )}
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                      {img ? (
                        <img src={img} alt={`Görsel ${idx + 1}`} className="h-28 w-full object-contain" />
                      ) : (
                        <div className="flex h-28 items-center justify-center px-3 text-center text-xs font-bold text-gray-400">
                          Henüz görsel seçilmedi
                        </div>
                      )}
                    </div>
                    <label title="Dosyadan yükle" className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-extrabold text-white shadow-sm shadow-violet-500/20 transition-colors hover:bg-violet-500">
                        {uploadingIdx === idx
                          ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
                          : <Upload size={14} />}
                        {img ? 'Değiştir' : 'Yükle'}
                        <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/bmp" className="hidden" disabled={uploadingIdx !== null || deletingIdx !== null} onChange={e => { if (e.target.files[0]) uploadImageFile(idx, e.target.files[0]); e.target.value = ''; }} />
                    </label>
                  </div>
                ))}
                {images.length < maxImages && (
                  <button onClick={addImage} className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-4 text-sm font-black text-violet-600 transition-all hover:border-violet-400 hover:bg-violet-50">
                    <Plus size={18} /> Görsel Ekle
                  </button>
                )}
              </div>
              {validImages.length < 1 && (
                <p className="mt-2 text-xs font-bold text-red-500">En az 1 ilan görseli eklemelisin.</p>
              )}
            </div>

            {catAttrs.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-slate-800">Özellikler</h3>
                  <p className="mt-1 text-xs text-slate-500">Kategoriye özel bilgileri ilan detaylarıyla birlikte buradan girebilirsiniz.</p>
                </div>
                <div className="space-y-5">
                  {catAttrs.map(attr => (
                    <div key={attr.slug}>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        {attr.name}
                        {attr.is_required
                          ? <span className="text-red-500 ml-1">*</span>
                          : <span className="text-gray-400 text-xs font-normal ml-1">(opsiyonel)</span>
                        }
                      </label>

                      {attr.type === 'text' && (
                        <input value={attrValues[attr.slug] || ''} onChange={e => setAttr(attr.slug, e.target.value)} className="input-field" />
                      )}
                      {attr.type === 'number' && (
                        <input type="number" value={attrValues[attr.slug] || ''} onChange={e => setAttr(attr.slug, e.target.value)} className="input-field" />
                      )}
                      {attr.type === 'boolean' && (
                        <div className="flex flex-wrap gap-2">
                          {['Evet', 'Hayır'].map(opt => (
                            <button key={opt} onClick={() => setAttr(attr.slug, opt)} className={`min-w-[92px] rounded-lg border px-3 py-2 text-xs font-bold transition-all ${attrValues[attr.slug] === opt ? 'border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-200' : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:bg-violet-50/50'}`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                      {attr.type === 'select' && Array.isArray(attr.options) && (
                        <div className="flex flex-wrap gap-2">
                          {attr.options.map(opt => (
                            <button key={opt} onClick={() => setAttr(attr.slug, opt)} className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${attrValues[attr.slug] === opt ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'}`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                      {attr.type === 'multiselect' && Array.isArray(attr.options) && (
                        <div className="flex flex-wrap gap-2">
                          {attr.options.map(opt => {
                            const sel = (attrValues[attr.slug] || []).includes(opt);
                            return (
                              <button key={opt} onClick={() => toggleMulti(attr.slug, opt)} className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${sel ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'}`}>
                                {sel && <Check size={11} className="inline mr-1" />}{opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {attr.type === 'range' && (
                        <div className="flex items-center gap-3">
                          <input type="number" value={(attrValues[attr.slug] || {}).min || ''} onChange={e => setAttr(attr.slug, { ...(attrValues[attr.slug] || {}), min: e.target.value })} placeholder={`Min${attr.options?.min !== undefined ? ` (${attr.options.min})` : ''}`} className="input-field flex-1" />
                          <span className="font-bold text-gray-400">—</span>
                          <input type="number" value={(attrValues[attr.slug] || {}).max || ''} onChange={e => setAttr(attr.slug, { ...(attrValues[attr.slug] || {}), max: e.target.value })} placeholder={`Max${attr.options?.max !== undefined ? ` (${attr.options.max})` : ''}`} className="input-field flex-1" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Truck size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Teslimat Bilgileri</h3>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { id: 'manual', icon: Clock,   title: 'Manuel Teslimat', desc: 'Alıcı ödedikten sonra belirttiğin sürede teslim edersin' },
                    { id: 'stock',  icon: Package, title: 'Stoklu (Otomatik)', desc: 'Ödeme anında sistem otomatik teslim eder' },
                  ].map(opt => (
                    <button key={opt.id} onClick={() => setDeliveryType(opt.id)} className={`rounded-2xl border-2 p-4 text-left transition-all ${deliveryType === opt.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-violet-200'}`}>
                      <opt.icon size={22} className={`mb-2 ${deliveryType === opt.id ? 'text-violet-600' : 'text-gray-400'}`} />
                      <div className={`text-sm font-bold ${deliveryType === opt.id ? 'text-violet-800' : 'text-gray-700'}`}>{opt.title}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-gray-500">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {deliveryType === 'manual' && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">Teslimat Süresi</label>
                    <div className="flex flex-wrap gap-2">
                      {DELIVERY_HOURS.filter(h => h <= manualDeliveryMaxHours).map(h => (
                        <button key={h} onClick={() => setDeliveryHours(h)} className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${deliveryHours === h ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300'}`}>
                          {h < 24 ? `${h} saat` : `${h / 24} gün`}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
                      Belirlediğiniz sürede teslim etmezseniz hesabınız uyarı alabilir. En yüksek süre: {manualDeliveryMaxHours} saat.
                    </div>
                  </div>
                )}

                {deliveryType === 'stock' && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Stoklar</label>
                    </div>
                    <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                      {stocks.map((stock, idx) => (
                        <div key={idx} className="relative border-b border-gray-100 last:border-b-0">
                          {stocks.length > 1 && (
                            <button onClick={() => removeStock(idx)} className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-500">
                              <Trash2 size={13} />
                            </button>
                          )}
                          <textarea value={stock.content} onChange={e => setStockField(idx, 'content', e.target.value)} maxLength={stockItemContentMax} placeholder="Stok içeriği - alıcı satın alınca bunu görecek" rows={3} className="w-full resize-none bg-transparent px-3 py-3 pr-10 font-mono text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:bg-violet-50/40" />
                        </div>
                      ))}
                    </div>
                    <button onClick={addStock} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 py-2.5 text-sm font-bold text-violet-600 transition-colors hover:bg-violet-50">
                      <Plus size={16} /> Stok Ekle
                    </button>
                    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
                      Stok bitince ilan otomatik kapanır. Yeni stok ekleyerek tekrar aktifleştirebilirsiniz.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* ADIM 3: DOPING */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">İlan Doping Seçimi</h3>
                <p className="mt-1 text-xs text-slate-500">İlanını yayınlarken istediğin paket ve süreyi seçebilirsin. Ücret seçilen paket kadar bakiyenden düşer.</p>
              </div>
            </div>

            <div className="space-y-4">
                {[
                  { type: 'vitrine', options: vitrineOptions },
                  { type: 'featured', options: featuredOptions },
                ].map(({ type, options }) => {
                  const meta = getDopingTypeMeta(type);
                  const dopingImage = options.find((option) => option.image)?.image;
                  const selectedHours = selectedDopings[type] ?? null;
                  return (
                    <div
                      key={type}
                      className={`w-full rounded-2xl border px-3 py-2.5 transition-all ${selectedHours ? `${meta.accentClass} shadow-sm` : `${meta.accentClass} opacity-95`}`}
                    >
                      <div className="flex items-start gap-3">
                        {dopingImage ? (
                          <img src={dopingImage} alt={meta.label} className="h-28 w-28 rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-400">{meta.label}</div>
                        )}
                        <div className="min-w-0 flex-1 self-start pt-0.5">
                          <div className="mb-1.5">
                            <div className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.buttonClass}`}>{meta.label}</div>
                          </div>
                          <p className="text-[11px] leading-4 text-slate-600">{meta.description}</p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDopings((prev) => ({ ...prev, [type]: null }))}
                              className={`inline-flex min-w-fit flex-col rounded-md border px-2.5 py-1.5 text-left transition-all ${!selectedHours ? 'border-slate-500 bg-white shadow-sm' : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white'}`}
                            >
                              <div className="text-base font-black leading-4 text-slate-900">🛇</div>
                              <div className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">Yok</div>
                            </button>
                            {options.map((option) => {
                              const selected = Number(selectedHours) === Number(option.hours);
                              const insufficient = Number(user?.balance || 0) < Number(option.price || 0);
                              return (
                                <button
                                  key={`${type}-${option.hours}`}
                                  type="button"
                                  onClick={() => setSelectedDopings((prev) => ({ ...prev, [type]: option.hours }))}
                                  className={`inline-flex min-w-fit flex-col rounded-md border px-2.5 py-1.5 text-left transition-all ${selected ? 'border-violet-500 bg-white shadow-sm shadow-violet-100' : 'border-slate-200 bg-white/80 hover:border-violet-200 hover:bg-white'}`}
                                >
                                  <div className="text-[11px] font-semibold leading-4 text-slate-500">{formatDopingDuration(option.hours)}</div>
                                  <div className="mt-0.5 text-[13px] font-black leading-4 text-emerald-600">{Number(option.price).toFixed(2)} ₺</div>
                                  {insufficient ? <div className="mt-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600">Yetersiz</div> : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {selectedDopingEntries.length ? (
              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-bold text-violet-900">
                    Seçili paketler: {selectedDopingEntries.map((entry) => `${getDopingTypeMeta(entry.type).label} · ${formatDopingDuration(entry.option.hours)}`).join(' + ')}
                  </div>
                  <div className="text-sm font-black text-violet-700">
                    {Number(selectedDopingPrice).toFixed(2)}₺
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Alt butonlar */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} /> Geri
            </button>
          )}
          <div className="flex-1" />
          {step < STEPS.length ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="flex items-center gap-2 btn-primary py-2.5 px-6 disabled:opacity-40 disabled:cursor-not-allowed">
              Devam <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving || !canNext()} className="flex items-center gap-2 btn-primary py-2.5 px-6 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Check size={16} /> İlanı Yayınla</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

