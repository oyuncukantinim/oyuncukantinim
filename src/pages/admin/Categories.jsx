import { useState, useEffect } from 'react';
import { useRef } from 'react';
import {
  Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  X, GripVertical, Tag, Filter, ToggleLeft, ToggleRight, Gamepad2,
  Upload, Image as ImageIcon, Loader2
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import PopularGamesManager from '../../components/admin/PopularGamesManager';
import {
  adminGetCategories, adminSaveCategory, adminDeleteCategory,
  adminGetCategoryAttributes, adminSaveCategoryAttribute, adminDeleteCategoryAttribute,
  adminUploadImage, adminReorderCategories,
  adminGetCategoryTypes, adminSaveCategoryType, adminDeleteCategoryType
} from '../../lib/adminApi';

const ATTR_TYPES = [
  { value: 'text',        label: 'Metin' },
  { value: 'number',      label: 'Sayı' },
  { value: 'select',      label: 'Tekli Seçim' },
  { value: 'multiselect', label: 'Çoklu Seçim' },
  { value: 'range',       label: 'Aralık (min-max)' },
  { value: 'boolean',     label: 'Evet/Hayır' },
];

const TYPE_COLOR_OPTIONS = [
  { label: 'Mor', value: 'from-violet-500 to-purple-600' },
  { label: 'Mavi', value: 'from-blue-500 to-cyan-600' },
  { label: 'Yeşil', value: 'from-emerald-500 to-green-600' },
  { label: 'Turuncu', value: 'from-orange-500 to-red-500' },
  { label: 'Sarı', value: 'from-yellow-400 to-orange-500' },
  { label: 'Pembe', value: 'from-pink-500 to-fuchsia-600' },
  { label: 'Kırmızı', value: 'from-rose-500 to-red-600' },
  { label: 'Camgöbeği', value: 'from-cyan-500 to-blue-600' },
  { label: 'Gri', value: 'from-slate-500 to-slate-700' },
  { label: 'Lacivert', value: 'from-indigo-500 to-blue-700' },
];

const CATEGORY_ROLE_OPTIONS = [
  {
    key: 'container',
    label: 'Klasör',
    node_type: 'container',
    content_type: 'neutral',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  {
    key: 'listing',
    label: 'İlan Kategorisi',
    node_type: 'sellable',
    content_type: 'listing',
    badgeClass: 'bg-violet-100 text-violet-700',
  },
  {
    key: 'product',
    label: 'Site Ürünü Kategorisi',
    node_type: 'sellable',
    content_type: 'product',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
];

const PRODUCT_LAYOUT_OPTIONS = [
  { value: 'editorial', label: 'Editoryal Vitrin' },
  { value: 'catalog', label: 'Katalog Grid' },
  { value: 'compact', label: 'Kompakt Raf' },
];

function getTypeColorMeta(value) {
  return TYPE_COLOR_OPTIONS.find((option) => option.value === value) || {
    label: 'Özel',
    value: value || 'from-gray-300 to-gray-500',
  };
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/İ/g,'i').replace(/I/g,'i').replace(/Ğ/g,'g').replace(/Ü/g,'u').replace(/Ş/g,'s').replace(/Ö/g,'o').replace(/Ç/g,'c')
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function getCategoryRoleMeta(category = {}) {
  if (category.node_type === 'container') {
    return CATEGORY_ROLE_OPTIONS[0];
  }
  if (category.content_type === 'product') {
    return CATEGORY_ROLE_OPTIONS[2];
  }
  return CATEGORY_ROLE_OPTIONS[1];
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
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [toast, setToast] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const fileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);
  const heroFileInputRef = useRef(null);

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catForm, setCatForm] = useState({
    name: '', slug: '', parent_id: '', icon: '🎮', sort_order: 0, is_active: 1,
    commission_rate: '', min_price: '', image: '', banner_image: '', type_id: '',
    node_type: 'sellable', content_type: 'listing', layout_variant: 'classic',
    accent_color: TYPE_COLOR_OPTIONS[0].value, hero_title: '', hero_subtitle: '', hero_image: '',
  });
  const [catSaving, setCatSaving] = useState(false);

  // Attribute panel
  const [attrCat, setAttrCat] = useState(null); // category whose attrs we're editing
  const [attrs, setAttrs] = useState([]);
  const [attrModal, setAttrModal] = useState(false);
  const [editAttr, setEditAttr] = useState(null);
  const [attrForm, setAttrForm] = useState({ name:'', slug:'', type:'text', options:'', range_min:'', range_max:'', is_required:0, is_filterable:1, sort_order:0 });
  const [attrSaving, setAttrSaving] = useState(false);

  const [dragId, setDragId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  // Category Types
  const [typesList, setTypesList] = useState([]);
  const [typeModal, setTypeModal] = useState(false);
  const [editType, setEditType] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', slug: '', icon: '🏷️', color: 'from-violet-500 to-purple-600', sort_order: 0, is_active: 1 });
  const [typeSaving, setTypeSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadCategories = () => {
    adminGetCategories().then(r => setCategories(r.data)).catch(() => {});
  };

  const loadTypes = () => {
    adminGetCategoryTypes().then(r => setTypesList(r.data || [])).catch(() => {});
  };

  useEffect(() => { loadCategories(); loadTypes(); }, []);

  const loadAttrs = (catId) => {
    adminGetCategoryAttributes(catId).then(r => setAttrs(r.data)).catch(() => setAttrs([]));
  };

  const buildCategoryPath = (categoryId) => {
    const parts = [];
    let current = categories.find((item) => Number(item.id) === Number(categoryId));
    while (current) {
      parts.unshift(current.name);
      current = current.parent_id ? categories.find((item) => Number(item.id) === Number(current.parent_id)) : null;
    }
    return parts.join(' > ');
  };

  const setCategoryRole = (role) => {
    setCatForm((prev) => {
      if (role.key === 'container') {
        return {
          ...prev,
          node_type: 'container',
          content_type: 'neutral',
          layout_variant: 'classic',
          commission_rate: '',
          min_price: '',
          accent_color: TYPE_COLOR_OPTIONS[0].value,
          hero_title: '',
          hero_subtitle: '',
          hero_image: '',
        };
      }
      if (role.key === 'product') {
        return {
          ...prev,
          node_type: 'sellable',
          content_type: 'product',
          layout_variant: prev.layout_variant === 'editorial' || prev.layout_variant === 'catalog' || prev.layout_variant === 'compact'
            ? prev.layout_variant
            : 'editorial',
          commission_rate: '',
          min_price: '',
        };
      }
      return {
        ...prev,
        node_type: 'sellable',
        content_type: 'listing',
        layout_variant: 'classic',
        accent_color: TYPE_COLOR_OPTIONS[0].value,
        hero_title: '',
        hero_subtitle: '',
        hero_image: '',
      };
    });
  };

  const handleDrop = (targetCat) => {
    if (!dragId || dragId === targetCat.id) return;
    const dragCat = categories.find(c => c.id === dragId);
    if (!dragCat) return;
    // Only allow reorder within same parent group
    if ((dragCat.parent_id || null) !== (targetCat.parent_id || null)) return;

    const siblings = categories
      .filter(c => (c.parent_id || null) === (dragCat.parent_id || null))
      .sort((a, b) => a.sort_order - b.sort_order);

    const fromIdx = siblings.findIndex(c => c.id === dragId);
    const toIdx = siblings.findIndex(c => c.id === targetCat.id);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...siblings];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const orders = reordered.map((c, i) => ({ id: c.id, sort_order: i }));
    adminReorderCategories(orders)
      .then(() => { showToast('Sıralama güncellendi.'); loadCategories(); })
      .catch(e => showToast(e.message));
  };

  // Build tree
  const roots = categories.filter(c => !c.parent_id);
  const children = (parentId) => categories.filter(c => c.parent_id == parentId);

  const openNewCat = (parentId = null) => {
    setEditCat(null);
    setCatForm({
      name: '', slug: '', parent_id: parentId || '', icon: '🎮', sort_order: 0, is_active: 1,
      commission_rate: '', min_price: '', image: '', banner_image: '', type_id: '',
      node_type: 'sellable', content_type: 'listing', layout_variant: 'classic',
      accent_color: TYPE_COLOR_OPTIONS[0].value, hero_title: '', hero_subtitle: '', hero_image: '',
    });
    setCatModal(true);
  };

  const openEditCat = (cat) => {
    setEditCat(cat);
    const roleMeta = getCategoryRoleMeta(cat);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id || '',
      icon: cat.icon,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
      commission_rate: cat.commission_rate ?? '',
      min_price: cat.min_price ?? '',
      image: cat.image || '',
      banner_image: cat.banner_image || '',
      type_id: cat.type_id || '',
      node_type: roleMeta.node_type,
      content_type: roleMeta.content_type,
      layout_variant: cat.layout_variant || (roleMeta.key === 'product' ? 'editorial' : 'classic'),
      accent_color: cat.accent_color || TYPE_COLOR_OPTIONS[0].value,
      hero_title: cat.hero_title || '',
      hero_subtitle: cat.hero_subtitle || '',
      hero_image: cat.hero_image || '',
    });
    setCatModal(true);
  };

  const openNewType = () => {
    setEditType(null);
    setTypeForm({ name: '', slug: '', icon: '🏷️', color: 'from-violet-500 to-purple-600', sort_order: 0, is_active: 1 });
    setTypeModal(true);
  };

  const openEditType = (type) => {
    setEditType(type);
    setTypeForm({ name: type.name, slug: type.slug, icon: type.icon, color: type.color, sort_order: type.sort_order, is_active: type.is_active });
    setTypeModal(true);
  };

  const handleSaveType = async () => {
    if (!typeForm.name || !typeForm.slug) { showToast('İsim ve URL gerekli.'); return; }
    setTypeSaving(true);
    try {
      await adminSaveCategoryType({ ...typeForm, id: editType?.id || null });
      showToast(editType ? 'Tür güncellendi.' : 'Tür oluşturuldu.');
      setTypeModal(false); loadTypes();
    } catch (e) { showToast(e.message); }
    finally { setTypeSaving(false); }
  };

  const handleDeleteType = async (type) => {
    if (!confirm(`"${type.name}" türünü sil? Bu türe bağlı kategorilerin türü kaldırılacak.`)) return;
    try { await adminDeleteCategoryType(type.id); showToast('Tür silindi.'); loadTypes(); }
    catch (e) { showToast(e.message); }
  };

  const handleSaveCat = async () => {
    const slug = String(catForm.slug || '').trim();
    if (!catForm.name || !slug) { showToast('İsim ve URL gerekli.'); return; }
    const duplicate = categories.find((category) => (
      String(category.slug || '').trim().toLowerCase() === slug.toLowerCase()
      && Number(category.id) !== Number(editCat?.id || 0)
    ));
    if (duplicate) { showToast('Bu URL zaten kullanılıyor.'); return; }
    setCatSaving(true);
    try {
      await adminSaveCategory({ ...catForm, slug, id: editCat?.id || null, parent_id: catForm.parent_id || null });
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
    const roleMeta = getCategoryRoleMeta(cat);
    return (
      <div>
        <div
          draggable={true}
          onDragStart={() => setDragId(cat.id)}
          onDragEnd={() => { setDragId(null); setDropTarget(null); }}
          onDragOver={e => { e.preventDefault(); setDropTarget(cat.id); }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={() => { handleDrop(cat); setDropTarget(null); }}
          className={`flex items-center gap-2 py-2.5 px-4 hover:bg-gray-50 group border-b border-gray-50 cursor-default transition-all ${depth > 0 ? 'bg-gray-50/50' : ''} ${dragId === cat.id ? 'opacity-40' : ''} ${dropTarget === cat.id && dragId !== cat.id ? 'border-l-4 border-l-violet-400 bg-violet-50/30' : ''}`}
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          <button className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 p-0.5">
            <GripVertical size={14} />
          </button>
          <div className="w-4 flex-shrink-0">
            {kids.length > 0 && (
              <button onClick={() => setExpanded(e => ({ ...e, [cat.id]: !e[cat.id] }))} className="text-gray-400 hover:text-gray-700">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>
                    <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
              {!cat.is_active && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">Pasif</span>}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${roleMeta.badgeClass}`}>{roleMeta.label}</span>
              {kids.length > 0 && <span className="text-[10px] text-gray-400">{kids.length} alt kategori</span>}
              {cat.attribute_count > 0 && <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-bold">{cat.attribute_count} özellik</span>}
              {cat.type_id && (() => { const t = typesList.find(x => x.id == cat.type_id); return t ? <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">{t.name}</span> : null; })()}
              {cat.content_type === 'listing' && cat.commission_rate !== null && cat.commission_rate !== undefined && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold">%{cat.commission_rate}</span>}
              {cat.content_type === 'listing' && cat.min_price !== null && cat.min_price !== undefined && <span className="text-[10px] bg-cyan-100 text-cyan-600 px-1.5 py-0.5 rounded-full font-bold">Min {cat.min_price}₺</span>}
              {cat.content_type === 'product' && cat.layout_variant && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">{cat.layout_variant}</span>}
            </div>
            <div className="text-xs text-gray-400">URL: {cat.slug}</div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {cat.content_type === 'listing' && cat.node_type === 'sellable' ? (
              <button onClick={() => openAttrPanel(cat)} title="Özellikler" className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600"><Filter size={13} /></button>
            ) : null}
            <button onClick={() => openNewCat(cat.id)} title="Alt Kategori Ekle" className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600"><Plus size={13} /></button>
            <button onClick={() => openEditCat(cat)} title="Düzenle" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Pencil size={13} /></button>
            <button onClick={() => handleDeleteCat(cat)} title="Sil" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
          </div>
        </div>
        {isExpanded && kids.map(k => <CategoryRow key={k.id} cat={k} depth={depth + 1} />)}
      </div>
    );
  };

  const selectedRoleMeta = getCategoryRoleMeta(catForm);
  const isListingCategory = selectedRoleMeta.key === 'listing';
  const isProductCategory = selectedRoleMeta.key === 'product';
  const parentOptions = categories.filter((category) => {
    if (Number(category.id) === Number(editCat?.id)) return false;
    return category.node_type === 'container';
  });

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800">Kategori Yönetimi</h2>
            <p className="text-sm text-gray-400">Klasör, ilan ve site ürünü kategorilerini aynı ağaçta yönetin; popüler kategori vitrini de burada kalsın.</p>
          </div>
          <div className="inline-flex rounded-2xl bg-gray-100 p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                activeTab === 'categories'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Tag size={16} />
              Kategoriler
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('popular')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                activeTab === 'popular'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Gamepad2 size={16} />
              Popüler Kategoriler
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('types')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                activeTab === 'types'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Tag size={16} />
              Kategori Türleri
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'categories' ? (
        <>
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
                {attrCat && attrCat.content_type === 'listing' && attrCat.node_type === 'sellable' && (
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
              ) : !(attrCat.content_type === 'listing' && attrCat.node_type === 'sellable') ? (
                <div className="px-5 py-10 text-center text-gray-400">
                  <Filter size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">Bu kategori için ilan filtresi kullanılmıyor.</p>
                  <p className="mt-1 text-xs">Özellik alanları sadece kullanıcı ilanı kategorilerinde aktif.</p>
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
        </>
      ) : activeTab === 'types' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-purple-600" />
              <div>
                <h3 className="font-extrabold text-gray-800">Kategori Türleri</h3>
                <p className="text-xs text-gray-400">Hesap, E-Pin, Item, Boost vb. türleri yönetin</p>
              </div>
            </div>
            <button onClick={openNewType} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
              <Plus size={13} /> Yeni Tür
            </button>
          </div>
          {typesList.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">Henüz tür yok.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {typesList.map(type => (
                <div key={type.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 group">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center text-white text-sm flex-shrink-0`}>
                    {type.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm">{type.name}</span>
                      {!type.is_active && <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">Pasif</span>}
                      <span className="text-[10px] text-gray-400">#{type.sort_order}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      URL: {type.slug} · {getTypeColorMeta(type.color).label}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditType(type)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Pencil size={13} /></button>
                    <button onClick={() => handleDeleteType(type)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <PopularGamesManager onToast={showToast} />
      )}

      {/* Kategori Modal */}
      {catModal && (
        <Modal title={editCat ? 'Kategori Düzenle' : 'Yeni Kategori'} onClose={() => setCatModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-gray-600">Kategori Rolü</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {CATEGORY_ROLE_OPTIONS.map((role) => {
                  const active = selectedRoleMeta.key === role.key;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => setCategoryRole(role)}
                      className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                        active
                          ? 'border-violet-400 bg-violet-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-gray-800">{role.label}</span>
                        {active ? <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-black text-white">Seçili</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

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
              <label className="block text-xs font-bold text-gray-600 mb-1.5">URL *</label>
              <input value={catForm.slug} onChange={e => setCatForm(f => ({...f, slug: e.target.value}))} placeholder="hesap-satisi" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-violet-400" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Üst Kategori</label>
              <select value={catForm.parent_id} onChange={e => setCatForm(f => ({...f, parent_id: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400">
                <option value="">— Ana Kategori —</option>
                {parentOptions.map(c => (
                  <option key={c.id} value={c.id}>{buildCategoryPath(c.id) || c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Kategori Türü</label>
              <select value={catForm.type_id} onChange={e => setCatForm(f => ({...f, type_id: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400">
                <option value="">— Tür Yok —</option>
                {typesList.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {isListingCategory && (
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
            )}

            {isProductCategory && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Liste Tasarımı</label>
                    <select value={catForm.layout_variant} onChange={e => setCatForm(f => ({ ...f, layout_variant: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400">
                      {PRODUCT_LAYOUT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Vurgu Rengi</label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {TYPE_COLOR_OPTIONS.map((option) => {
                        const active = catForm.accent_color === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setCatForm(f => ({ ...f, accent_color: option.value }))}
                            className={`rounded-xl border p-1.5 transition-all ${active ? 'border-emerald-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-emerald-300'}`}
                            title={option.label}
                          >
                            <div className={`h-6 rounded-lg bg-gradient-to-r ${option.value}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Hero Başlığı</label>
                    <input value={catForm.hero_title} onChange={e => setCatForm(f => ({...f, hero_title: e.target.value}))} placeholder="Örn: Resmi Valorant Ürünleri" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Hero Alt Metni</label>
                    <input value={catForm.hero_subtitle} onChange={e => setCatForm(f => ({...f, hero_subtitle: e.target.value}))} placeholder="Kategori üst açıklaması" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className="block text-xs font-bold text-gray-600">Hero Görseli</label>
                    <span className="text-[10px] font-semibold text-gray-400">Kategori üst alanı için</span>
                  </div>
                  <input
                    ref={heroFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setHeroUploading(true);
                      try {
                        const url = await adminUploadImage(file, 'categories', { preserveOriginal: true });
                        setCatForm(f => ({ ...f, hero_image: url }));
                        showToast('Hero görseli yüklendi.');
                      } catch (err) {
                        showToast(err.message);
                      } finally {
                        setHeroUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />

                  {catForm.hero_image ? (
                    <div className="relative h-36 w-full overflow-hidden rounded-xl border border-gray-200 bg-slate-100 group">
                      <img src={catForm.hero_image} alt="" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                        <button type="button" onClick={() => heroFileInputRef.current?.click()} className="bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <Upload size={12} /> Değiştir
                        </button>
                        <button type="button" onClick={() => setCatForm(f => ({ ...f, hero_image: '' }))} className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <X size={12} /> Kaldır
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => heroFileInputRef.current?.click()}
                      disabled={heroUploading}
                      className="w-full h-32 border-2 border-dashed border-emerald-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-emerald-400 hover:bg-white transition-all disabled:opacity-50"
                    >
                      {heroUploading ? (
                        <>
                          <Loader2 size={22} className="text-emerald-500 animate-spin" />
                          <span className="text-xs text-gray-500 font-semibold">Yükleniyor...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={22} className="text-gray-400" />
                          <span className="text-xs text-gray-500 font-semibold">Hero görseli seç</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="block text-xs font-bold text-gray-600">Kategori Görseli</label>
                <span className="text-[10px] font-semibold text-gray-400">PC: 160x250px</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImageUploading(true);
                  try {
                    const url = await adminUploadImage(file, 'categories');
                    setCatForm(f => ({ ...f, image: url }));
                    showToast('Kategori Görseli yüklendi.');
                  } catch (err) {
                    showToast(err.message);
                  } finally {
                    setImageUploading(false);
                    e.target.value = '';
                  }
                }}
              />

              {catForm.image ? (
                <div className="relative w-[160px] h-[250px] rounded-xl overflow-hidden border border-gray-200 group bg-slate-100">
                  <img src={catForm.image} alt="" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Upload size={12} /> Değiştir
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatForm(f => ({ ...f, image: '' }))}
                      className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <X size={12} /> Kaldır
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="w-[160px] h-[250px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-50 transition-all disabled:opacity-50"
                >
                  {imageUploading ? (
                    <>
                      <Loader2 size={22} className="text-violet-500 animate-spin" />
                      <span className="text-xs text-gray-500 font-semibold">Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={22} className="text-gray-400" />
                      <span className="text-xs text-gray-500 font-semibold">Kategori Görseli seç veya sürükle</span>
                      <span className="text-[10px] text-gray-400">JPG, PNG, GIF → otomatik WebP</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="block text-xs font-bold text-gray-600">Kategori Bannerı</label>
                <span className="text-[10px] font-semibold text-gray-400">PC: 1600x400px</span>
              </div>
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBannerUploading(true);
                  try {
                    const url = await adminUploadImage(file, 'categories', { preserveOriginal: true });
                    setCatForm(f => ({ ...f, banner_image: url }));
                    showToast('Banner yüklendi.');
                  } catch (err) {
                    showToast(err.message);
                  } finally {
                    setBannerUploading(false);
                    e.target.value = '';
                  }
                }}
              />

              {catForm.banner_image ? (
                <div className="relative h-40 w-full overflow-hidden rounded-xl border border-gray-200 group bg-slate-100">
                  <img src={catForm.banner_image} alt="" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Upload size={12} /> Değiştir
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatForm(f => ({ ...f, banner_image: '' }))}
                      className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <X size={12} /> Kaldır
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => bannerFileInputRef.current?.click()}
                  disabled={bannerUploading}
                  className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-50 transition-all disabled:opacity-50"
                >
                  {bannerUploading ? (
                    <>
                      <Loader2 size={22} className="text-violet-500 animate-spin" />
                      <span className="text-xs text-gray-500 font-semibold">Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={22} className="text-gray-400" />
                      <span className="text-xs text-gray-500 font-semibold">Banner seç veya sürükle</span>
                      <span className="text-[10px] text-gray-400">Kategori detay üst bloğunda görünür</span>
                    </>
                  )}
                </button>
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

      {/* Kategori Türü Modal */}
      {typeModal && (
        <Modal title={editType ? 'Türü Düzenle' : 'Yeni Kategori Türü'} onClose={() => setTypeModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">İkon</label>
                <input value={typeForm.icon} onChange={e => setTypeForm(f => ({...f, icon: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-center text-2xl focus:outline-none focus:border-violet-400" />
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Tür Adı *</label>
                <input value={typeForm.name} onChange={e => setTypeForm(f => ({...f, name: e.target.value, slug: slugify(e.target.value)}))} placeholder="Örn: Hesap" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">URL *</label>
              <input value={typeForm.slug} onChange={e => setTypeForm(f => ({...f, slug: e.target.value}))} placeholder="hesap" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-violet-400" />
            </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label className="block text-xs font-bold text-gray-600">Hazır Renk Teması</label>
                  <span className="text-[10px] font-semibold text-gray-400">Yalnızca hazır seçenekler</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TYPE_COLOR_OPTIONS.map((option) => {
                    const selected = typeForm.color === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTypeForm(f => ({ ...f, color: option.value }))}
                        className={`rounded-lg border px-2 py-1.5 text-left transition-all ${
                          selected
                            ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200'
                            : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
                        }`}
                      >
                        <div className={`mb-1.5 h-5 rounded-md bg-gradient-to-br ${option.value}`} />
                        <div className="text-[11px] font-bold leading-tight text-gray-700">{option.label}</div>
                      </button>
                    );
                  })}
                </div>
                <div className={`mt-3 h-8 rounded-xl bg-gradient-to-br ${typeForm.color || 'from-gray-200 to-gray-300'} flex items-center justify-center text-white text-xs font-bold`}>
                  {typeForm.icon} {typeForm.name || 'Önizleme'}
                </div>
              </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Sıra</label>
                <input type="number" value={typeForm.sort_order} onChange={e => setTypeForm(f => ({...f, sort_order: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Durum</label>
                <button onClick={() => setTypeForm(f => ({...f, is_active: f.is_active ? 0 : 1}))} className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm transition-all border ${typeForm.is_active ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                  {typeForm.is_active ? <><ToggleRight size={16} /> Aktif</> : <><ToggleLeft size={16} /> Pasif</>}
                </button>
              </div>
            </div>

            <button onClick={handleSaveType} disabled={typeSaving} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
              {typeSaving ? 'Kaydediliyor...' : (editType ? 'Güncelle' : 'Oluştur')}
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}



