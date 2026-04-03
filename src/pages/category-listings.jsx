import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Plus, Search, SlidersHorizontal, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

async function fetchPublic(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  const json = await res.json();
  return json.data;
}

function idFromCatSlug(slug) {
  const match = slug?.match(/-(\d+)$/);
  return match ? parseInt(match[1]) : null;
}

export default function CategoryListingsPage() {
  const { catSlug } = useParams();
  const { user } = useAuth();
  const catId = idFromCatSlug(catSlug);

  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [catAttrs, setCatAttrs] = useState([]);
  const [attrFilters, setAttrFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [subCatFilter, setSubCatFilter] = useState(null);

  // Load categories + listings + attributes
  useEffect(() => {
    if (!catId) return;
    Promise.all([
      fetchPublic('get_categories_tree'),
      fetchPublic('get_listings', { category_id: catId, sort }),
      fetchPublic('get_category_attributes', { category_id: catId }),
    ]).then(([cats, items, attrs]) => {
      setCategories(cats || []);
      const found = (cats || []).find(c => String(c.id) === String(catId));
      setCategory(found || null);
      setListings(items || []);
      const filterable = (attrs || []).filter(a => a.is_filterable);
      setCatAttrs(filterable);
      // Sıfırla filtreler
      const init = {};
      filterable.forEach(a => { init[a.slug] = ''; });
      setAttrFilters(init);
    }).finally(() => setLoading(false));
  }, [catId, sort]);

  const childCats = useMemo(() => categories.filter(c => c.parent_id == catId), [categories, catId]);

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    if (!category || !categories.length) return [];
    const parts = [];
    let cur = category;
    while (cur) {
      parts.unshift(cur);
      cur = cur.parent_id ? categories.find(c => String(c.id) === String(cur.parent_id)) : null;
    }
    return parts;
  }, [category, categories]);

  const filtered = useMemo(() => {
    let list = listings;
    if (subCatFilter) list = list.filter(l => l.category_id === subCatFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => l.title.toLowerCase().includes(q));
    }
    // Özellik filtreleri
    Object.entries(attrFilters).forEach(([slug, val]) => {
      if (!val) return;
      list = list.filter(l => {
        const attrs = l.attributes ? (typeof l.attributes === 'string' ? JSON.parse(l.attributes) : l.attributes) : {};
        const attrVal = attrs[slug];
        if (Array.isArray(attrVal)) return attrVal.some(v => String(v).toLowerCase().includes(val.toLowerCase()));
        return String(attrVal || '').toLowerCase().includes(val.toLowerCase());
      });
    });
    return list;
  }, [listings, subCatFilter, search, attrFilters]);

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
        <Link to="/" className="hover:text-violet-600 font-semibold">Ana Sayfa</Link>
        <ChevronRight size={12} />
        <Link to="/categories" className="hover:text-violet-600 font-semibold">Kategoriler</Link>
        {breadcrumb.map((bc, i) => (
          <span key={bc.id} className="flex items-center gap-1.5">
            <ChevronRight size={12} />
            {i === breadcrumb.length - 1 ? (
              <span className="text-gray-700 font-bold">{bc.icon} {bc.name}</span>
            ) : (
              <Link to={`/categories/${bc.slug}-${bc.id}`} className="hover:text-violet-600 font-semibold">{bc.icon} {bc.name}</Link>
            )}
          </span>
        ))}
      </nav>

      {/* Category Header */}
      <div className="card overflow-hidden">
        {category?.image ? (
          <div className="relative h-40">
            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-8">
              <div>
                <div className="text-4xl mb-1">{category?.icon}</div>
                <h1 className="text-3xl font-extrabold text-white">{category?.name}</h1>
                <p className="text-white/70 text-sm mt-1">{filtered.length} ilan bulundu</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-8 py-8 flex items-center gap-4">
            <span className="text-5xl">{category?.icon || <Tag size={40} />}</span>
            <div>
              <h1 className="text-3xl font-extrabold text-white">{category?.name || 'Kategori'}</h1>
              <p className="text-white/70 text-sm mt-1">{filtered.length} ilan bulundu</p>
            </div>
          </div>
        )}
      </div>

      {/* Sub-category chips */}
      {childCats.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSubCatFilter(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${!subCatFilter ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
          >
            Tümü
          </button>
          {childCats.map(c => (
            <button
              key={c.id}
              onClick={() => setSubCatFilter(subCatFilter === c.id ? null : c.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all border ${subCatFilter === c.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Özellik filtreleri */}
      {catAttrs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {catAttrs.map(attr => {
            if (attr.type === 'boolean') {
              return (
                <select
                  key={attr.slug}
                  value={attrFilters[attr.slug] || ''}
                  onChange={e => setAttrFilters(f => ({ ...f, [attr.slug]: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                >
                  <option value="">{attr.name}: Tümü</option>
                  <option value="Evet">Evet</option>
                  <option value="Hayır">Hayır</option>
                </select>
              );
            }
            if (attr.type === 'select' || attr.type === 'multiselect') {
              return (
                <select
                  key={attr.slug}
                  value={attrFilters[attr.slug] || ''}
                  onChange={e => setAttrFilters(f => ({ ...f, [attr.slug]: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400"
                >
                  <option value="">{attr.name}: Tümü</option>
                  {(attr.options || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              );
            }
            return (
              <input
                key={attr.slug}
                type="text"
                value={attrFilters[attr.slug] || ''}
                onChange={e => setAttrFilters(f => ({ ...f, [attr.slug]: e.target.value }))}
                placeholder={attr.name + ' ara...'}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
              />
            );
          })}
        </div>
      )}

      {/* Search + Sort + Add listing */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="İlanlarda ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-gray-400 flex-shrink-0" />
          <select value={sort} onChange={e => setSort(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-violet-400">
            <option value="newest">En Yeni</option>
            <option value="price-asc">Fiyat Artan</option>
            <option value="price-desc">Fiyat Azalan</option>
          </select>
        </div>
        {user && (
          <Link to="/create" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap">
            <Plus size={15} /> İlan Ekle
          </Link>
        )}
      </div>

      {/* Listings grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🏪</div>
          <p className="font-semibold text-lg mb-1">Bu kategoride henüz ilan yok.</p>
          {user && <Link to="/create" className="text-violet-600 font-bold hover:underline text-sm">İlk ilanı sen ekle!</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map(listing => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      )}
    </div>
  );
}
