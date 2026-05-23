import { useState, useEffect } from 'react';
import { useRef } from 'react';
import {
  Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  X, GripVertical, Tag, Filter, ToggleLeft, ToggleRight, Gamepad2,
  Upload, Image as ImageIcon, Loader2, FolderTree, Layers3
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import PopularGamesManager from '../../components/admin/PopularGamesManager';
import { makeSlug as slugify } from '../../lib/api';
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

const TAB_ITEMS = [
  { key: 'categories', label: 'Kategori Ağacı', icon: FolderTree, tone: 'from-violet-500 to-fuchsia-500' },
  { key: 'popular', label: 'Popüler Kategoriler', icon: Gamepad2, tone: 'from-orange-500 to-rose-500' },
  { key: 'types', label: 'Kategori Türleri', icon: Layers3, tone: 'from-cyan-500 to-blue-500' },
];

function getTypeColorMeta(value) {
  return TYPE_COLOR_OPTIONS.find((option) => option.value === value) || {
    label: 'Özel',
    value: value || 'from-gray-300 to-gray-500',
  };
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
  const fileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);

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
      await adminSaveCategory({
        ...catForm,
        slug,
        id: editCat?.id || null,
        parent_id: catForm.parent_id || null,
        hero_title: '',
        hero_subtitle: '',
        hero_image: '',
      });
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
    const roleTone = roleMeta.key === 'product'
      ? 'from-emerald-500 to-cyan-500'
      : roleMeta.key === 'container'
        ? 'from-slate-500 to-slate-700'
        : 'from-violet-500 to-fuchsia-500';
    const typeMeta = cat.type_id ? typesList.find(x => x.id == cat.type_id) : null;
    return (
      <div className="px-3">
        <div
          draggable={true}
          onDragStart={() => setDragId(cat.id)}
          onDragEnd={() => { setDragId(null); setDropTarget(null); }}
          onDragOver={e => { e.preventDefault(); setDropTarget(cat.id); }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={() => { handleDrop(cat); setDropTarget(null); }}
          className={`group my-2 flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/40 hover:shadow-md ${depth > 0 ? 'bg-slate-50/80' : 'bg-white'} ${dragId === cat.id ? 'opacity-40' : ''} ${dropTarget === cat.id && dragId !== cat.id ? 'border-violet-400 bg-violet-50 shadow-md' : 'border-slate-100'}`}
          style={{ marginLeft: `${depth * 22}px` }}
        >
          <button className="shrink-0 cursor-grab rounded-xl p-1.5 text-slate-300 transition-colors hover:bg-white hover:text-slate-500 active:cursor-grabbing">
            <GripVertical size={15} />
          </button>

          <button
            type="button"
            disabled={kids.length === 0}
            onClick={() => setExpanded(e => ({ ...e, [cat.id]: !e[cat.id] }))}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-400 transition-colors hover:border-violet-200 hover:text-violet-600 disabled:opacity-30"
          >
            {kids.length > 0 ? (isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />) : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
          </button>

          <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${roleTone} text-xl text-white shadow-sm`}>
            {cat.image ? (
              <img src={cat.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{cat.icon || '🎮'}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-black text-slate-900">{cat.name}</span>
              {!cat.is_active && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-500">Pasif</span>}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${roleMeta.badgeClass}`}>{roleMeta.label}</span>
              {typeMeta ? <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-black text-purple-600">{typeMeta.name}</span> : null}
              {kids.length > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">{kids.length} alt</span>}
              {cat.attribute_count > 0 && <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-black text-cyan-600">{cat.attribute_count} özellik</span>}
              {cat.content_type === 'listing' && cat.commission_rate !== null && cat.commission_rate !== undefined && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-600">%{cat.commission_rate}</span>}
              {cat.content_type === 'listing' && cat.min_price !== null && cat.min_price !== undefined && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600">Min {cat.min_price}₺</span>}
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-slate-400">
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500">/{cat.slug}</span>
              <span>#{cat.sort_order}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
            {cat.content_type === 'listing' && cat.node_type === 'sellable' ? (
              <button onClick={() => openAttrPanel(cat)} title="Özellikler" className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-violet-100 hover:text-violet-700"><Filter size={14} /></button>
            ) : null}
            <button onClick={() => openNewCat(cat.id)} title="Alt Kategori Ekle" className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-emerald-100 hover:text-emerald-700"><Plus size={14} /></button>
            <button onClick={() => openEditCat(cat)} title="Düzenle" className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-blue-100 hover:text-blue-700"><Pencil size={14} /></button>
            <button onClick={() => handleDeleteCat(cat)} title="Sil" className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600"><Trash2 size={14} /></button>
          </div>
        </div>
        {isExpanded && kids.map(k => <CategoryRow key={k.id} cat={k} depth={depth + 1} />)}
      </div>
    );
  };

  const selectedRoleMeta = getCategoryRoleMeta(catForm);
  const isListingCategory = selectedRoleMeta.key === 'listing';
  const parentOptions = categories.filter((category) => {
    if (Number(category.id) === Number(editCat?.id)) return false;
    return category.node_type === 'container';
  });

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="mb-5 grid gap-2 rounded-[22px] border border-slate-200 bg-white p-1.5 shadow-sm sm:grid-cols-3">
        {TAB_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition-all ${
                active
                  ? `bg-gradient-to-r ${item.tone} text-white shadow-lg`
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'categories' ? (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
            {/* Kategori Ağacı */}
            <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <FolderTree size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900">Kategori Ağacı</h3>
                    <p className="text-xs font-semibold text-slate-400">Sürükle bırak ile aynı seviyede sıralayın.</p>
                  </div>
                </div>
                <button onClick={() => openNewCat()} className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-violet-300">
                  <Plus size={13} /> Yeni Kategori
                </button>
              </div>
              <div className="max-h-[680px] overflow-y-auto py-2">
                {roots.length === 0
                  ? <div className="px-5 py-14 text-center text-sm font-semibold text-slate-400">Henüz kategori yok.</div>
                  : roots.map(cat => <CategoryRow key={cat.id} cat={cat} />)
                }
              </div>
            </div>

            {/* Özellik Editörü */}
            <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-cyan-50/80 to-white px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                    <Filter size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900">
                      {attrCat ? `"${attrCat.name}" Özellikleri` : 'Özellik Filtreleri'}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">İlan kategorileri için filtre alanlarını yönetin.</p>
                  </div>
                </div>
                {attrCat && attrCat.content_type === 'listing' && attrCat.node_type === 'sellable' && (
                  <button onClick={openNewAttr} className="flex items-center gap-1.5 rounded-2xl bg-cyan-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-cyan-100 transition-colors hover:bg-cyan-500">
                    <Plus size={13} /> Özellik Ekle
                  </button>
                )}
              </div>

              {!attrCat ? (
                <div className="px-5 py-16 text-center text-slate-400">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100">
                    <Filter size={26} className="opacity-60" />
                  </div>
                  <p className="text-sm font-semibold">Bir ilan kategorisinin filtrelerini düzenlemek için sol listeden kategori seçin.</p>
                </div>
              ) : !(attrCat.content_type === 'listing' && attrCat.node_type === 'sellable') ? (
                <div className="px-5 py-14 text-center text-slate-400">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
                    <Filter size={26} />
                  </div>
                  <p className="text-sm font-bold text-slate-600">Bu kategori için ilan filtresi kullanılmıyor.</p>
                  <p className="mt-1 text-xs font-semibold">Özellik alanları sadece kullanıcı ilanı kategorilerinde aktif.</p>
                </div>
              ) : attrs.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm font-semibold text-slate-400">Bu kategoriye henüz özellik eklenmemiş.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {attrs.map(attr => (
                    <div key={attr.id} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-cyan-50/40">
                      <GripVertical size={14} className="flex-shrink-0 text-slate-300" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-800">{attr.name}</span>
                          <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                            {ATTR_TYPES.find(t => t.value === attr.type)?.label || attr.type}
                          </span>
                          {attr.is_required == 1 && <span className="rounded-lg bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">Zorunlu</span>}
                          {attr.is_filterable == 1 && <span className="rounded-lg bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold text-cyan-600">Filtreli</span>}
                        </div>
                        <div className="mt-1 font-mono text-xs text-slate-400">/{attr.slug}</div>
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
                      <div className="flex gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                        <button onClick={() => openEditAttr(attr)} className="rounded-xl p-2 text-slate-400 hover:bg-blue-100 hover:text-blue-700"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteAttr(attr.id)} className="rounded-xl p-2 text-slate-400 hover:bg-red-100 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : activeTab === 'types' ? (
        <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Layers3 size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900">Kategori Türleri</h3>
                <p className="text-xs font-semibold text-slate-400">Hesap, E-Pin, Item, Boost vb. türleri yönetin.</p>
              </div>
            </div>
            <button onClick={openNewType} className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5">
              <Plus size={13} /> Yeni Tür
            </button>
          </div>
          {typesList.length === 0 ? (
            <div className="px-5 py-14 text-center text-sm font-semibold text-slate-400">Henüz tür yok.</div>
          ) : (
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {typesList.map(type => (
                <div key={type.id} className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${type.color} text-lg text-white shadow-sm`}>
                    {type.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-black text-slate-900">{type.name}</span>
                      {!type.is_active && <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">Pasif</span>}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-400">
                      /{type.slug} · {getTypeColorMeta(type.color).label} · #{type.sort_order}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditType(type)} className="rounded-xl p-2 text-slate-400 hover:bg-blue-100 hover:text-blue-700"><Pencil size={14} /></button>
                    <button onClick={() => handleDeleteType(type)} className="rounded-xl p-2 text-slate-400 hover:bg-red-100 hover:text-red-600"><Trash2 size={14} /></button>
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

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Kategori Adı *</label>
              <input value={catForm.name} onChange={e => setCatForm(f => ({...f, name: e.target.value, slug: slugify(e.target.value)}))} placeholder="Örn: Hesap Satışı" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
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
                    const url = await adminUploadImage(file, 'categories', { variant: 'category_image' });
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
                      <span className="text-[10px] text-gray-400">160x250px WebP olarak kaydedilir</span>
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
                    const url = await adminUploadImage(file, 'categories', { variant: 'category_banner' });
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
                      <span className="text-[10px] text-gray-400">1600x400px WebP olarak kaydedilir</span>
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



