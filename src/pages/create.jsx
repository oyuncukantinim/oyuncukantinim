import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Image as ImageIcon, Plus, Trash2,
  Clock, Package, Info, Tag, Truck, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { addListing } from '../lib/api';
import CategoryPicker from '../components/CategoryPicker';
import { isValidImageUrl, ALLOWED_DOMAINS_LABEL } from '../lib/imageUrl';
import useSiteBrand from '../hooks/useSiteBrand';

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
  { id: 3, label: 'Teslimat',       icon: Truck },
];

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, i) => {
        const done   = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex-1 flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${done ? 'bg-emerald-500 text-white' : active ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <Check size={16} /> : <step.icon size={16} />}
              </div>
              <span className={`text-xs font-bold hidden sm:block ${active ? 'text-violet-600' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full ${done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CreatePage() {
  const { user } = useAuth();
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

  // Admin tarafından belirlenen limitler
  const [maxImages, setMaxImages] = useState(defaultMaxImages);
  const [titleMax, setTitleMax] = useState(defaultTitleMax);
  const [descMax, setDescMax] = useState(defaultDescMax);
  const [siteMinPrice, setSiteMinPrice] = useState(defaultMinListingPrice);
  const [siteMaxPrice, setSiteMaxPrice] = useState(defaultMaxListingPrice);
  const [manualDeliveryMaxHours, setManualDeliveryMaxHours] = useState(defaultManualDeliveryMaxHours);
  const [stockItemMaxCount, setStockItemMaxCount] = useState(defaultStockItemMaxCount);

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
    if (step === 3) {
      if (deliveryType === 'manual' && deliveryHours > manualDeliveryMaxHours) return false;
      if (deliveryType === 'stock' && stocks.length > stockItemMaxCount) return false;
      if (deliveryType === 'stock') return stocks.some(s => s.content.trim() !== '');
      return true;
    }
    return true;
  };

  const canProceedFromInfo = () => {
    const infoValid = !!title.trim() && !!price && priceNum > 0;
    if (!infoValid) return false;
    if (effectiveMinPrice !== null && priceNum < effectiveMinPrice) return false;
    if (siteMaxPrice !== null && priceNum > siteMaxPrice) return false;
    return catAttrs.filter(a => a.is_required).every(a => {
      const v = attrValues[a.slug];
      return v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0);
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const validStocks = stocks.filter(s => s.content.trim() !== '');
      if (siteMaxPrice !== null && priceNum > siteMaxPrice) {
        throw new Error(`Maksimum ilan fiyatı ${siteMaxPrice}₺ olabilir.`);
      }
      if (deliveryType === 'manual' && deliveryHours > manualDeliveryMaxHours) {
        throw new Error(`Manuel teslimat süresi en fazla ${manualDeliveryMaxHours} saat olabilir.`);
      }
      if (deliveryType === 'stock' && validStocks.length > stockItemMaxCount) {
        throw new Error(`En fazla ${stockItemMaxCount} stok satırı ekleyebilirsin.`);
      }
      await addListing({
        title,
        price: priceNum,
        description,
        category:    selectedCategory?.slug || '',
        category_id: selectedCategory?.id   || null,
        images:      images.filter(Boolean),
        cover_index: coverIndex,
        delivery_type:  deliveryType,
        delivery_hours: deliveryHours,
        attributes:     attrValues,
        stocks: deliveryType === 'stock' ? validStocks : [],
      });
      showToast('İlan başarıyla yayınlandı!');
      navigate('/profile');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addImage    = () => setImages(i => [...i, '']);
  const removeImage = (idx) => setImages(i => i.filter((_, j) => j !== idx));
  const setImage    = (idx, val) => setImages(i => i.map((x, j) => j === idx ? val : x));

  const addStock       = () => {
    if (stocks.length >= stockItemMaxCount) {
      showToast(`En fazla ${stockItemMaxCount} stok satırı ekleyebilirsin.`);
      return;
    }
    setStocks(s => [...s, { content: '' }]);
  };
  const removeStock    = (idx) => setStocks(s => s.filter((_, j) => j !== idx));
  const setStockField  = (idx, field, val) => setStocks(s => s.map((x, j) => j === idx ? { ...x, [field]: val } : x));

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
                <label className="block text-sm font-bold text-gray-700">Görseller (URL)</label>
                <span className="text-xs text-gray-400">{images.filter(Boolean).length}/{maxImages}</span>
              </div>
              <div className="space-y-2">
                {images.map((img, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex gap-2 items-center">
                      <button onClick={() => setCoverIndex(idx)} title="Kapak yap" className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all ${coverIndex === idx ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'}`}>
                        <ImageIcon size={14} className={coverIndex === idx ? 'text-violet-600' : 'text-gray-400'} />
                      </button>
                      <input value={img} onChange={e => setImage(idx, e.target.value)} placeholder={`Görsel ${idx + 1} URL`} className={`input-field flex-1 text-sm ${img && !isValidImageUrl(img) ? 'border-red-300 focus:border-red-400' : ''}`} />
                      {images.length > 1 && <button onClick={() => removeImage(idx)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 flex-shrink-0"><Trash2 size={14} /></button>}
                    </div>
                    {img && !isValidImageUrl(img) && (
                      <p className="pl-10 text-[11px] text-red-500">Geçersiz URL. İzin verilen: {ALLOWED_DOMAINS_LABEL}</p>
                    )}
                  </div>
                ))}
                {images.length < maxImages && (
                  <button onClick={addImage} className="text-sm text-violet-600 hover:text-violet-500 font-bold flex items-center gap-1 mt-1">
                    <Plus size={14} /> Görsel Ekle
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-gray-400">Kamera ikonuna tıklayarak kapak görselini seçebilirsiniz.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold text-slate-800">Özellikler</h3>
                <p className="mt-1 text-xs text-slate-500">Kategoriye özel bilgileri ilan detaylarıyla birlikte buradan girebilirsiniz.</p>
              </div>
              {catAttrs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-400">
                  Bu kategori için özel özellik tanımlanmamış.
                </div>
              ) : (
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
                        <div className="flex gap-3">
                          {['Evet', 'Hayır'].map(opt => (
                            <button key={opt} onClick={() => setAttr(attr.slug, opt)} className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${attrValues[attr.slug] === opt ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
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
              )}
            </div>
          </div>
        )}
        {/* ADIM 3: TESLİMAT */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'manual', icon: Clock,   title: 'Manuel Teslimat', desc: 'Alıcı ödedikten sonra belirttiğin sürede teslim edersin' },
                { id: 'stock',  icon: Package, title: 'Stoklu (Otomatik)', desc: 'Ödeme anında sistem otomatik teslim eder' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setDeliveryType(opt.id)} className={`p-4 rounded-2xl border-2 text-left transition-all ${deliveryType === opt.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-200'}`}>
                  <opt.icon size={22} className={`mb-2 ${deliveryType === opt.id ? 'text-violet-600' : 'text-gray-400'}`} />
                  <div className={`font-bold text-sm ${deliveryType === opt.id ? 'text-violet-800' : 'text-gray-700'}`}>{opt.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{opt.desc}</div>
                </button>
              ))}
            </div>

            {deliveryType === 'manual' && (
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Teslimat Süresi</label>
                <div className="flex flex-wrap gap-2">
                  {DELIVERY_HOURS.filter(h => h <= manualDeliveryMaxHours).map(h => (
                    <button key={h} onClick={() => setDeliveryHours(h)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${deliveryHours === h ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'}`}>
                      {h < 24 ? `${h} saat` : `${h / 24} gün`}
                    </button>
                  ))}
                </div>
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
                  ⚠️ Belirlediğiniz sürede teslim etmezseniz hesabınız uyarı alabilir. En yüksek süre: {manualDeliveryMaxHours} saat.
                </div>
              </div>
            )}

            {deliveryType === 'stock' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-gray-700">Stok Kalemleri</label>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{stocks.filter(s => s.content.trim()).length}/{stockItemMaxCount} adet</span>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {stocks.map((stock, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500">Stok #{idx + 1}</span>
                        {stocks.length > 1 && <button onClick={() => removeStock(idx)} className="p-1 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={13} /></button>}
                      </div>
                      <textarea value={stock.content} onChange={e => setStockField(idx, 'content', e.target.value)} placeholder="Stok içeriği — alıcı satın alınca bunu görecek" rows={3} className="input-field text-xs resize-none w-full font-mono" />
                    </div>
                  ))}
                </div>
                <button onClick={addStock} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-violet-300 rounded-xl text-violet-600 font-bold text-sm hover:bg-violet-50 transition-colors">
                  <Plus size={16} /> Stok Ekle
                </button>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700 font-medium">
                  💡 Stok bitince ilan otomatik kapanır. Yeni stok ekleyerek tekrar aktifleştirebilirsiniz.
                </div>
              </div>
            )}
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

