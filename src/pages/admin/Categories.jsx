import { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  X, GripVertical, Tag, Filter, ToggleLeft, ToggleRight
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetCategories, adminSaveCategory, adminDeleteCategory,
  adminGetCategoryAttributes, adminSaveCategoryAttribute, adminDeleteCategoryAttribute
} from '../../lib/adminApi';

const ATTR_TYPES = [
  { value: 'text',        label: 'Metin' },
  { value: 'number',      label: 'Sayı' },
  { value: 'select',      label: 'Tekli Seçim' },
  { value: 'multiselect', label: 'Çoklu Seçim' },
  { value: 'range',       label: 'Aralık (min-max)' },
  { value: 'boolean',     label: 'Evet/Hayır' },
];

function slugify(str) {
  return str.toLowerCase()
    .replace(/İ/g,'i').replace(/I/g,'i').replace(/Ğ/g,'g').replace(/Ü/g,'u').replace(/Ş/g,'s').replace(/Ö/g,'o').replace(/Ç/g,'c')
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [toast, setToast] = useState('');

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catForm, setCatForm] = useState({ name:'', slug:'', parent_id:'', icon:'🎮', sort_order:0, is_active:1, commission_rate:'', min_price:'', image:'' });
  const [catSaving, setCatSaving] = useState(false);

  // Attribute panel
  const [attrCat, setAttrCat] = useState(null); // category whose attrs we're editing
  const [attrs, setAttrs] = useState([]);
  const [attrModal, setAttrModal] = useState(false);
  const [editAttr, setEditAttr] = useState(null);
  const [attrForm, setAttrForm] = useState({ name:'', slug:'', type:'text', options:'', range_min:'', range_max:'', is_required:0, is_filterable:1, sort_order:0 });
  const [attrSaving, setAttrSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadCategories = () => {
    adminGetCategories().then(r => setCategories(r.data)).catch(() => {});
  };

  useEffect(() => { loadCategories(); }, []);

  const loadAttrs = (catId) => {
    adminGetCategoryAttributes(catId).then(r => setAttrs(r.data)).catch(() => setAttrs([]));
  };

  // Build tree
  const roots = categories.filter(c => !c.parent_id);
  const children = (parentId) => categories.filter(c => c.parent_id == parentId);

  const openNewCat = (parentId = null) => {
    setEditCat(null);
    setCatForm({ name:'', slug:'', parent_id: parentId || '', icon:'🎮', sort_order:0, is_active:1 });
    setCatModal(true);
  };

  const openEditCat = (cat) => {
    setEditCat(cat);
    setCatForm({ name: cat.name, slug: cat.slug, parent_id: cat.parent_id || '', icon: cat.icon, sort_order: cat.sort_order, is_active: cat.is_active, commission_rate: cat.commission_rate ?? '', min_price: cat.min_price ?? '', image: cat.image || '' });
    setCatModal(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.name) { showToast('İsim gerekli.'); return; }
    setCatSaving(true);
    try {
      await adminSaveCategory({ ...catForm, id: editCat?.id || null, parent_id: catForm.parent_id || null });
      showToast(editCat ? 'Kategori güncellendi.' : 'Kategori oluşturuldu.');
      setCatModal(false); loadCategories();
    } catch (e) { showToast(e.message); }
    finally { setCatSaving(false); }
  };

  const handleDeleteCat = async (cat) => {
    const hasChildren = categories.some(c => c.parent_id == cat.id);
    if (hasChildren && !confirm(`"${cat.name}" altında alt kategoriler var. Silerken onlar da silinecek. Devam?`)) return;
    else if (!hasChildren && !confirm(`"${cat.name}" kategorisini sil?`)) return;
    try { await adminDeleteCategory(cat.id); showToast('Silindi.'); loadCategories(); if (attrCat?.id === cat.id) setAttrCat(null); }
    catch (e) { showToast(e.message); }
  };

  const openAttrPanel = (cat) => {
    setAttrCat(cat);
    loadAttrs(cat.id);
  };

  const openNewAttr = () => {
    setEditAttr(null);
    setAttrForm({ name:'', slug:'', type:'text', options:'', range_min:'', range_max:'', is_required:0, is_filterable:1, sort_order:0 });
    setAttrModal(true);
  };

  const openEditAttr = (attr) => {
    setEditAttr(attr);
    let options = '';
    let range_min = '', range_max = '';
    if (attr.type === 'range' && attr.options) {
      range_min = attr.options.min ?? '';
      range_max = attr.options.max ?? '';
    } else if (attr.options) {
      options = Array.isArray(attr.options) ? attr.options.join('\n') : '';
    }
    setAttrForm({ name: attr.name, slug: attr.slug, type: attr.type, options, range_min, range_max, is_required: attr.is_required, is_filterable: attr.is_filterable, sort_order: attr.sort_order });
    setAttrModal(true);
  };

  const handleSaveAttr = async () => {
    if (!attrForm.name || !attrForm.type) { showToast('İsim ve tür gerekli.'); return; }
    setAttrSaving(true);
    try {
      let options = null;
      if (['select','multiselect'].includes(attrForm.type)) {
        options = attrForm.options.split('\n').map(s => s.trim()).filter(Boolean);
      } else if (attrForm.type === 'range') {
        options = { min: Number(attrForm.range_min) || 0, max: Number(attrForm.range_max) || 100 };
      }
      await adminSaveCategoryAttribute({
        ...attrForm, id: editAttr?.id || null,
        category_id: attrCat.id, options,
      });
      showToast(editAttr ? 'Özellik güncellendi.' : 'Özellik eklendi.');
      setAttrModal(false); loadAttrs(attrCat.id);
    } catch (e) { showToast(e.message); }
    finally { setAttrSaving(false); }
  };

  const handleDeleteAttr = async (id) => {
    if (!confirm('Özelliği sil?')) return;
    try { await adminDeleteCategoryAttribute(id); showToast('Silindi.'); loadAttrs(attrCat.id); }
    catch (e) { showToast(e.message); }
  };

  const CategoryRow = ({ cat, depth = 0 }) => {
    const kids = children(cat.id);
    const isExpanded = expanded[cat.id];
    return (
      <div>
        <div className={`flex items-center gap-2 py-2.5 px-4 hover:bg-gray-50 group border-b border-gray-50 ${depth > 0 ? 'bg-gray-50/50' : ''}`} style={{ paddingLeft: `${16 + depth * 24}px` }}>
          <div className="w-4 flex-shrink-0">
            {kids.length > 0 && (
              <button onClick={() => setExpanded(e => ({ ...e, [cat.id]: !e[cat.id] }))} className="text-gray-400 hover:text-gray-700">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>
          <span className="text-lg w-6 text-center flex-shrink-0">{cat.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
              {!cat.is_active && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">Pasif</span>}
              {kids.length > 0 && <span className="text-[10px] text-gray-400">{kids.length} alt kategori</span>}
              {cat.attribute_count > 0 && <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold">{cat.attribute_count} özellik</span>}
              {cat.commission_rate !== null && cat.commission_rate !== undefined && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">%{cat.commission_rate}</span>}
              {cat.min_price !== null && cat.min_price !== undefined && <span className="text-[10px] bg-cyan-100 text-cyan-600 px-1.5 py-0.5 rounded-full font-bold">Min {cat.min_price}₺</span>}
            </div>
            <div className="text-xs text-gray-400">{cat.slug}</div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openAttrPanel(cat)} title="Özellikler" className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600"><Filter size={13} /></button>
            <button onClick={() => openNewCat(cat.id)} title="Alt Kategori Ekle" className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600"><Plus size={13} /></button>
            <button onClick={() => openEditCat(cat)} title="Düzenle" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Pencil size={13} /></button>
            <button onClick={() => handleDeleteCat(cat)} title="Sil" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
          </div>
        </div>
        {isExpanded && kids.map(k => <CategoryRow key={k.id} cat={k} depth={depth + 1} />)}
      </div>
    );
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori Ağacı */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-violet-600" />
              <h3 className="font-extrabold text-gray-800">Kategoriler</h3>
            </div>
            <button onClick={() => openNewCat()} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
              <Plus size={13} /> Yeni Kategori
            </button>
          </div>
          <div>
            {roots.length === 0
              ? <div className="px-5 py-8 text-center text-gray-400 text-sm">Henüz kategori yok.</div>
              : roots.map(cat => <CategoryRow key={cat.id} cat={cat} />)
            }
          </div>
        </div>

        {/* Özellik Editörü */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-violet-600" />
              <h3 className="font-extrabold text-gray-800">
                {attrCat ? `"${attrCat.name}" Özellikleri` : 'Özellik Filtreleri'}
              </h3>
            </div>
            {attrCat && (
              <button onClick={openNewAttr} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                <Plus size={13} /> Özellik Ekle
              </button>
            )}
          </div>

          {!attrCat ? (
            <div className="px-5 py-12 text-center text-gray-400">
              <Filter size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Bir kategoriye tıklayarak <br /> özelliklerini düzenleyebilirsiniz.</p>
            </div>
          ) : attrs.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">Bu kategoriye henüz özellik eklenmemiş.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {attrs.map(attr => (
                <div key={attr.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 group">
                  <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{attr.name}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">
                        {ATTR_TYPES.find(t => t.value === attr.type)?.label || attr.type}
                      </span>
                      {attr.is_required == 1 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">Zorunlu</span>}
                      {attr.is_filterable == 1 && <span className="text-[10px] bg-cyan-100 text-cyan-600 px-1.5 py-0.5 rounded font-bold">Filtreli</span>}
                    </div>
                    <div className="text-xs text-gray-400">{attr.slug}</div>
                    {Array.isArray(attr.options) && attr.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {attr.options.slice(0,5).map(o => (
                          <span key={o} className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded">{o}</span>
                        ))}
                        {attr.options.length > 5 && <span className="text-[10px] text-gray-400">+{attr.options.length - 5}</span>}
                      </div>
                    )}
                    {attr.type === 'range' && attr.options && (
                      <div className="text-xs text-gray-400 mt-0.5">{attr.options.min} — {attr.options.max}</div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditAttr(attr)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Pencil size={13} /></button>
                    <button onClick={() => handleDeleteAttr(attr.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kategori Modal */}
      {catModal && (
        <Modal title={editCat ? 'Kategori Düzenle' : 'Yeni Kategori'} onClose={() => setCatModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">İkon</label>
                <input value={catForm.icon} onChange={e => setCatForm(f => ({...f, icon: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-center text-2xl focus:outline-none focus:border-violet-400" />
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Kategori Adı *</label>
                <input value={catForm.name} onChange={e => setCatForm(f => ({...f, name: e.target.value, slug: slugify(e.target.value)}))} placeholder="Örn: Hesap Satışı" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Slug (URL) *</label>
              <input value={catForm.slug} onChange={e => setCatForm(f => ({...f, slug: e.target.value}))} placeholder="hesap-satisi" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-violet-400" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Üst Kategori</label>
              <select value={catForm.parent_id} onChange={e => setCatForm(f => ({...f, parent_id: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400">
                <option value="">— Ana Kategori —</option>
                {categories.filter(c => !c.parent_id && c.id !== editCat?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Komisyon Oranı (%)</label>
                <input type="number" step="0.01" min="0" max="100" value={catForm.commission_rate} onChange={e => setCatForm(f => ({...f, commission_rate: e.target.value}))} placeholder="Site geneli" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Min. Fiyat (₺)</label>
                <input type="number" step="0.01" min="0" value={catForm.min_price} onChange={e => setCatForm(f => ({...f, min_price: e.target.value}))} placeholder="Yok" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Görsel URL (WebP)</label>
              <input value={catForm.image} onChange={e => setCatForm(f => ({...f, image: e.target.value}))} placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              {catForm.image && (
                <img src={catForm.image} alt="" className="mt-2 w-full h-24 object-cover rounded-xl border border-gray-200" onError={e => e.target.style.display='none'} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Sıra</label>
                <input type="number" value={catForm.sort_order} onChange={e => setCatForm(f => ({...f, sort_order: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Durum</label>
                <button onClick={() => setCatForm(f => ({...f, is_active: f.is_active ? 0 : 1}))} className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm transition-all border ${catForm.is_active ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                  {catForm.is_active ? <><ToggleRight size={16} /> Aktif</> : <><ToggleLeft size={16} /> Pasif</>}
                </button>
              </div>
            </div>

            <button onClick={handleSaveCat} disabled={catSaving} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
              {catSaving ? 'Kaydediliyor...' : (editCat ? 'Güncelle' : 'Oluştur')}
            </button>
          </div>
        </Modal>
      )}

      {/* Özellik Modal */}
      {attrModal && attrCat && (
        <Modal title={editAttr ? 'Özellik Düzenle' : `"${attrCat.name}" — Yeni Özellik`} onClose={() => setAttrModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Özellik Adı *</label>
                <input value={attrForm.name} onChange={e => setAttrForm(f => ({...f, name: e.target.value, slug: slugify(e.target.value)}))} placeholder="Örn: Sunucu" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Slug</label>
                <input value={attrForm.slug} onChange={e => setAttrForm(f => ({...f, slug: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-violet-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Tür *</label>
              <div className="grid grid-cols-3 gap-2">
                {ATTR_TYPES.map(t => (
                  <button key={t.value} onClick={() => setAttrForm(f => ({...f, type: t.value}))} className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${attrForm.type === t.value ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {['select','multiselect'].includes(attrForm.type) && (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Seçenekler (her satıra bir tane)</label>
                <textarea value={attrForm.options} onChange={e => setAttrForm(f => ({...f, options: e.target.value}))} rows={5} placeholder="TR&#10;EUW&#10;EUNE&#10;NA" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none font-mono" />
              </div>
            )}

            {attrForm.type === 'range' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Min Değer</label>
                  <input type="number" value={attrForm.range_min} onChange={e => setAttrForm(f => ({...f, range_min: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Max Değer</label>
                  <input type="number" value={attrForm.range_max} onChange={e => setAttrForm(f => ({...f, range_max: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setAttrForm(f => ({...f, is_required: f.is_required ? 0 : 1}))} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-sm border transition-all ${attrForm.is_required ? 'bg-red-50 border-red-300 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                {attrForm.is_required ? <ToggleRight size={15}/> : <ToggleLeft size={15}/>} Zorunlu
              </button>
              <button onClick={() => setAttrForm(f => ({...f, is_filterable: f.is_filterable ? 0 : 1}))} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-sm border transition-all ${attrForm.is_filterable ? 'bg-cyan-50 border-cyan-300 text-cyan-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                {attrForm.is_filterable ? <ToggleRight size={15}/> : <ToggleLeft size={15}/>} Filtreli
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Sıra</label>
              <input type="number" value={attrForm.sort_order} onChange={e => setAttrForm(f => ({...f, sort_order: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
            </div>

            <button onClick={handleSaveAttr} disabled={attrSaving} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
              {attrSaving ? 'Kaydediliyor...' : (editAttr ? 'Güncelle' : 'Özellik Ekle')}
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
