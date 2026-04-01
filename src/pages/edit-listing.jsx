import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Image as ImageIcon, Plus, Trash2, Clock, Package, Layers, Check, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  getMyListing, updateListing, getPublicSettings, appendListingStocks, deleteListingStock,
  listingSlug,
} from '../lib/api';
import CategoryPicker from '../components/CategoryPicker';
import { GAMES } from '../data/catalog';
import { setPageSeo, clearPageSeoJsonLd } from '../lib/seo';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

async function fetchPublic(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const json = await res.json();
  return json.data;
}

const DEFAULT_DELIVERY_HOURS = [1, 2, 4, 6, 12, 24, 48, 72];

export default function EditListingPage() {
  const { id } = useParams();
  const listingId = parseInt(id, 10);
  const { user } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [catAttrs, setCatAttrs] = useState([]);
  const [attrValues, setAttrValues] = useState({});

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [gameName, setGameName] = useState('');
  const [images, setImages] = useState(['']);
  const [coverIndex, setCoverIndex] = useState(0);
  const [deliveryHours, setDeliveryHours] = useState(24);
  const [deliveryHourOptions, setDeliveryHourOptions] = useState(DEFAULT_DELIVERY_HOURS);
  const [stocks, setStocks] = useState([]);
  const [pendingStocks, setPendingStocks] = useState([{ content: '', label: '' }]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getPublicSettings()
      .then(r => {
        const raw = r.data?.manual_delivery_hours || '';
        const nums = raw.split(/[,;\s]+/).map(s => parseInt(s, 10)).filter(n => n > 0);
        setDeliveryHourOptions(nums.length ? [...new Set(nums)].sort((a, b) => a - b) : DEFAULT_DELIVERY_HOURS);
      })
      .catch(() => setDeliveryHourOptions(DEFAULT_DELIVERY_HOURS));
  }, [user, navigate]);

  useEffect(() => {
    if (!user || !listingId) return;
    let ok = true;
    (async () => {
      setLoading(true);
      try {
        const [tree, res] = await Promise.all([
          fetchPublic('get_categories_tree'),
          getMyListing(listingId),
        ]);
        if (!ok) return;
        const l = res.data;
        if (!l || l.status !== 'active') {
          showToast(l ? 'Yalnızca aktif ilanlar düzenlenebilir.' : 'İlan bulunamadı.');
          navigate('/profile');
          return;
        }
        setCategories(tree || []);
        setListing(l);
        setTitle(l.title || '');
        setPrice(String(l.price ?? ''));
        setDescription(l.description || '');
        setGameName(l.game_name || '');
        setImages((l.images && l.images.length) ? l.images : ['']);
        setCoverIndex(l.cover_index || 0);
        setDeliveryHours(l.delivery_hours || 24);
        setStocks(l.stocks || []);
        const cat = (tree || []).find(c => c.id === l.category_id);
        setSelectedCategory(cat || null);
        if (l.category_id) {
          const attrs = await fetchPublic('get_category_attributes', { category_id: l.category_id });
          setCatAttrs(attrs || []);
          const existing = l.attributes && typeof l.attributes === 'object' ? l.attributes : {};
          const def = {};
          (attrs || []).forEach(a => {
            def[a.slug] = existing[a.slug] !== undefined ? existing[a.slug] : (a.type === 'multiselect' ? [] : '');
          });
          setAttrValues(def);
        } else {
          setCatAttrs([]);
          setAttrValues({});
        }
        setPageSeo({ title: `İlan düzenle: ${l.title}`, description: `${l.title} — Oyuncu Kantinim ilan düzenleme.` });
      } catch (e) {
        showToast(e.message || 'Yüklenemedi');
        navigate('/profile');
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, [user, listingId, navigate, showToast]);

  useEffect(() => () => clearPageSeoJsonLd(), []);

  useEffect(() => {
    if (!listing || !selectedCategory) return;
    if (selectedCategory.id === listing.category_id) return;
    fetchPublic('get_category_attributes', { category_id: selectedCategory.id }).then(d => {
      setCatAttrs(d || []);
      const def = {};
      (d || []).forEach(a => { def[a.slug] = a.type === 'multiselect' ? [] : ''; });
      setAttrValues(def);
    });
  }, [selectedCategory?.id, listing?.id, listing?.category_id]);

  useEffect(() => {
    if (deliveryHourOptions.length && !deliveryHourOptions.includes(deliveryHours)) {
      setDeliveryHours(deliveryHourOptions[0]);
    }
  }, [deliveryHourOptions, deliveryHours]);

  const effectiveCommission = selectedCategory?.commission_rate ?? null;
  const effectiveMinPrice = selectedCategory?.min_price ?? null;
  const priceNum = parseFloat(price) || 0;
  const commission = priceNum * ((effectiveCommission ?? 10) / 100);
  const earnings = priceNum - commission;
  const deliveryType = listing?.delivery_type || 'manual';

  const attrsValid = useMemo(() => catAttrs.filter(a => a.is_required).every(a => {
    const v = attrValues[a.slug];
    return v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0);
  }), [catAttrs, attrValues]);

  const canSave = title.trim() && price && priceNum > 0 && selectedCategory
    && (effectiveMinPrice === null || effectiveMinPrice === undefined || priceNum >= effectiveMinPrice)
    && attrsValid;

  const setAttr = (slug, val) => setAttrValues(v => ({ ...v, [slug]: val }));
  const toggleMulti = (slug, opt) => {
    const cur = attrValues[slug] || [];
    setAttrValues(v => ({ ...v, [slug]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] }));
  };

  const handleDeleteStock = async (stockId, isSold) => {
    if (isSold) return;
    if (!confirm('Bu stok satırını silinsin mi?')) return;
    try {
      await deleteListingStock(stockId);
      setStocks(s => s.filter(x => x.id !== stockId));
      showToast('Stok silindi.');
    } catch (e) { showToast(e.message); }
  };

  const handleSave = async () => {
    if (!canSave) { showToast('Zorunlu alanları doldurun.'); return; }
    setSaving(true);
    try {
      await updateListing({
        listing_id: listingId,
        title: title.trim(),
        price: priceNum,
        description,
        game_name: gameName,
        category_id: selectedCategory.id,
        images: images.filter(Boolean),
        cover_index: coverIndex,
        attributes: attrValues,
        delivery_hours: deliveryType === 'manual' ? deliveryHours : undefined,
      });
      const toAdd = pendingStocks.filter(s => s.content.trim());
      if (deliveryType === 'stock' && toAdd.length > 0) {
        await appendListingStocks({ listing_id: listingId, stocks: toAdd });
        setPendingStocks([{ content: '', label: '' }]);
      }
      showToast('İlan güncellendi.');
      const res = await getMyListing(listingId);
      setListing(res.data);
      setStocks(res.data.stocks || []);
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!listing) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">İlanı düzenle</h1>
            <p className="text-sm text-gray-500">Teslimat türü değiştirilemez. Stoklu ilanlara yeni stok ekleyebilirsiniz.</p>
          </div>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
              <Layers size={16} className="text-violet-600" /> Kategori ve özellikler
            </h2>
            <CategoryPicker categories={categories} value={selectedCategory?.id ?? null} onChange={setSelectedCategory} />
            {selectedCategory && (
              <div className="text-xs text-violet-700 bg-violet-50 rounded-xl px-3 py-2">
                Komisyon: %{effectiveCommission ?? 10}
                {effectiveMinPrice != null && <> · Min fiyat: {effectiveMinPrice}₺</>}
              </div>
            )}
            {selectedCategory && catAttrs.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                {catAttrs.map(attr => (
                  <div key={attr.slug}>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      {attr.name}
                      {attr.is_required ? <span className="text-red-500 ml-1">*</span> : <span className="text-gray-400 text-xs font-normal ml-1">(opsiyonel)</span>}
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
                          <button type="button" key={opt} onClick={() => setAttr(attr.slug, opt)} className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${attrValues[attr.slug] === opt ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                    {attr.type === 'select' && Array.isArray(attr.options) && (
                      <div className="flex flex-wrap gap-2">
                        {attr.options.map(opt => (
                          <button type="button" key={opt} onClick={() => setAttr(attr.slug, opt)} className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${attrValues[attr.slug] === opt ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
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
                            <button type="button" key={opt} onClick={() => toggleMulti(attr.slug, opt)} className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${sel ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {sel && <Check size={11} className="inline mr-1" />}{opt}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {attr.type === 'range' && (
                      <div className="flex items-center gap-3">
                        <input type="number" value={(attrValues[attr.slug] || {}).min || ''} onChange={e => setAttr(attr.slug, { ...(attrValues[attr.slug] || {}), min: e.target.value })} className="input-field flex-1" />
                        <span className="text-gray-400 font-bold">—</span>
                        <input type="number" value={(attrValues[attr.slug] || {}).max || ''} onChange={e => setAttr(attr.slug, { ...(attrValues[attr.slug] || {}), max: e.target.value })} className="input-field flex-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-extrabold text-gray-800">İlan bilgileri</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Başlık *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Oyun</label>
              <input value={gameName} onChange={e => setGameName(e.target.value)} list="games-list-edit" className="input-field" />
              <datalist id="games-list-edit">
                {(GAMES || []).map(g => <option key={g.id} value={g.name} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Fiyat (₺) *</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} min={effectiveMinPrice || 1} step="0.01" className="input-field" />
              {priceNum > 0 && (
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span>Komisyon: <strong className="text-orange-500">-{commission.toFixed(2)}₺</strong> (%{effectiveCommission ?? 10})</span>
                  <span>Kazancınız: <strong className="text-emerald-600">{earnings.toFixed(2)}₺</strong></span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Açıklama</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Görseller (URL)</label>
              <div className="space-y-2">
                {images.map((img, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <button type="button" onClick={() => setCoverIndex(idx)} title="Kapak" className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${coverIndex === idx ? 'border-violet-500 bg-violet-50' : 'border-gray-200'}`}>
                      <ImageIcon size={14} className={coverIndex === idx ? 'text-violet-600' : 'text-gray-400'} />
                    </button>
                    <input value={img} onChange={e => setImages(im => im.map((x, j) => j === idx ? e.target.value : x))} className="input-field flex-1 text-sm" />
                    {images.length > 1 && (
                      <button type="button" onClick={() => setImages(im => im.filter((_, j) => j !== idx))} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
                {images.length < 8 && (
                  <button type="button" onClick={() => setImages(im => [...im, ''])} className="text-sm text-violet-600 font-bold flex items-center gap-1">
                    <Plus size={14} /> Görsel Ekle
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
              {deliveryType === 'stock' ? <Package size={16} className="text-violet-600" /> : <Clock size={16} className="text-violet-600" />}
              Teslimat
            </h2>
            <div className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-xl ${deliveryType === 'stock' ? 'bg-cyan-50 text-cyan-800' : 'bg-amber-50 text-amber-800'}`}>
              {deliveryType === 'stock' ? 'Stoklu (otomatik)' : 'Manuel teslimat'}
            </div>

            {deliveryType === 'manual' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Teslimat süresi</label>
                <div className="flex flex-wrap gap-2">
                  {deliveryHourOptions.map(h => (
                    <button type="button" key={h} onClick={() => setDeliveryHours(h)} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${deliveryHours === h ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {h < 24 ? `${h} saat` : h % 24 === 0 ? `${h / 24} gün` : `${h} saat`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {deliveryType === 'stock' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500">Mevcut stoklar</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stocks.map(s => (
                    <div key={s.id} className={`text-xs p-2 rounded-lg border ${s.is_sold ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-white border-violet-100'}`}>
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-mono truncate flex-1">{s.label || 'Stok'}{s.is_sold ? ' · Satıldı' : ''}</span>
                        {!s.is_sold && (
                          <button type="button" onClick={() => handleDeleteStock(s.id, s.is_sold)} className="text-red-500 flex-shrink-0"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs font-bold text-gray-500 pt-1">Yeni stok ekle</div>
                {pendingStocks.map((stock, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-2">
                    <input value={stock.label} onChange={e => setPendingStocks(ps => ps.map((x, j) => j === idx ? { ...x, label: e.target.value } : x))} placeholder="Etiket (opsiyonel)" className="input-field text-xs" />
                    <textarea value={stock.content} onChange={e => setPendingStocks(ps => ps.map((x, j) => j === idx ? { ...x, content: e.target.value } : x))} placeholder="İçerik" rows={2} className="input-field text-xs font-mono resize-none w-full" />
                    {pendingStocks.length > 1 && (
                      <button type="button" onClick={() => setPendingStocks(ps => ps.filter((_, j) => j !== idx))} className="text-xs text-red-500 font-bold">Kaldır</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setPendingStocks(ps => [...ps, { content: '', label: '' }])} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-violet-300 rounded-xl text-violet-600 font-bold text-sm">
                  <Plus size={16} /> Stok satırı ekle
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          <Link to={listingSlug(listing.title, listing.id)} className="btn-secondary py-2.5 px-4 text-sm">İlana git</Link>
          <div className="flex-1" />
          <button type="button" onClick={handleSave} disabled={saving || !canSave} className="btn-primary py-2.5 px-6 disabled:opacity-40">
            {saving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
