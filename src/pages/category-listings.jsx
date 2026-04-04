import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Plus, Search, SlidersHorizontal, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import useSiteBrand from '../hooks/useSiteBrand';

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
  return match ? parseInt(match[1], 10) : null;
}

function buildCatSlug(cat) {
  return `${cat.slug}-${cat.id}`;
}

function CategoryCard({ cat }) {
  return (
    <Link to={`/categories/${buildCatSlug(cat)}`}>
      <div className="group relative mx-auto flex h-[250px] w-[160px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
        {cat.image ? (
          <img src={cat.image} alt={cat.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-400 to-violet-500">
            <span className="text-6xl opacity-30">{cat.icon}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
          <div className="max-w-full rounded-xl bg-black/42 px-3 py-1.5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-[1px]">
            <div className="line-clamp-2 text-sm font-bold leading-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
              {cat.name}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CategoryListingsPage() {
  const { catSlug } = useParams();
  const { user } = useAuth();
  const { defaultListingImage } = useSiteBrand();
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

  useEffect(() => {
    if (!catId) return;
    setLoading(true);
    Promise.all([
      fetchPublic('get_categories_tree'),
      fetchPublic('get_listings', { category_id: catId, sort }),
      fetchPublic('get_category_attributes', { category_id: catId }),
    ])
      .then(([cats, items, attrs]) => {
        const safeCats = cats || [];
        const found = safeCats.find((c) => String(c.id) === String(catId));
        const safeAttrs = (attrs || []).filter((a) => a.is_filterable);
        const initFilters = {};
        safeAttrs.forEach((a) => {
          initFilters[a.slug] = '';
        });

        setCategories(safeCats);
        setCategory(found || null);
        setListings(items || []);
        setCatAttrs(safeAttrs);
        setAttrFilters(initFilters);
        setSubCatFilter(null);
      })
      .finally(() => setLoading(false));
  }, [catId, sort]);

  const childCats = useMemo(
    () => categories.filter((c) => String(c.parent_id) === String(catId)),
    [categories, catId],
  );

  const hasChildren = childCats.length > 0;

  const breadcrumb = useMemo(() => {
    if (!category || !categories.length) return [];
    const parts = [];
    let current = category;
    while (current) {
      parts.unshift(current);
      current = current.parent_id
        ? categories.find((c) => String(c.id) === String(current.parent_id))
        : null;
    }
    return parts;
  }, [category, categories]);

  const filtered = useMemo(() => {
    let list = listings;
    if (subCatFilter) list = list.filter((l) => String(l.category_id) === String(subCatFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.title.toLowerCase().includes(q));
    }
    Object.entries(attrFilters).forEach(([slug, val]) => {
      if (!val) return;
      list = list.filter((l) => {
        const attrs = l.attributes
          ? (typeof l.attributes === 'string' ? JSON.parse(l.attributes) : l.attributes)
          : {};
        const attrVal = attrs[slug];
        if (Array.isArray(attrVal)) return attrVal.some((v) => String(v).toLowerCase().includes(val.toLowerCase()));
        return String(attrVal || '').toLowerCase().includes(val.toLowerCase());
      });
    });
    return list;
  }, [listings, subCatFilter, search, attrFilters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
        <Link to="/" className="font-semibold hover:text-violet-600">Ana Sayfa</Link>
        <ChevronRight size={12} />
        <Link to="/categories" className="font-semibold hover:text-violet-600">Kategoriler</Link>
        {breadcrumb.map((bc, index) => (
          <span key={bc.id} className="flex items-center gap-1.5">
            <ChevronRight size={12} />
            {index === breadcrumb.length - 1 ? (
              <span className="font-bold text-gray-700">{bc.name}</span>
            ) : (
              <Link to={`/categories/${buildCatSlug(bc)}`} className="font-semibold hover:text-violet-600">
                {bc.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="card overflow-hidden">
        {category?.banner_image ? (
          <div className="relative h-40 bg-slate-100">
            <img src={category.banner_image} alt={category.name} className="h-full w-full object-contain" />
            <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/70 to-transparent px-8">
              <div>
                <h1 className="text-3xl font-extrabold text-white">{category?.name}</h1>
                <p className="mt-1 text-sm text-white/70">
                  {hasChildren ? `${childCats.length} alt kategori bulundu` : `${filtered.length} ilan bulundu`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-8 py-8">
            <h1 className="text-3xl font-extrabold text-white">{category?.name || 'Kategori'}</h1>
            <p className="mt-1 text-sm text-white/70">
              {hasChildren ? `${childCats.length} alt kategori bulundu` : `${filtered.length} ilan bulundu`}
            </p>
          </div>
        )}
      </div>

      {hasChildren ? (
        <>
          <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
            Bu kategorinin alt kategorileri var. Devam etmek için bir alt kategori seç.
          </div>
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {childCats.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} />
            ))}
          </div>
        </>
      ) : (
        <>
          {catAttrs.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {catAttrs.map((attr) => {
                if (attr.type === 'boolean') {
                  return (
                    <select
                      key={attr.slug}
                      value={attrFilters[attr.slug] || ''}
                      onChange={(e) => setAttrFilters((f) => ({ ...f, [attr.slug]: e.target.value }))}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
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
                      onChange={(e) => setAttrFilters((f) => ({ ...f, [attr.slug]: e.target.value }))}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                    >
                      <option value="">{attr.name}: Tümü</option>
                      {(attr.options || []).map((opt) => (
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
                    onChange={(e) => setAttrFilters((f) => ({ ...f, [attr.slug]: e.target.value }))}
                    placeholder={`${attr.name} ara...`}
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                  />
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İlanlarda ara..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-violet-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="flex-shrink-0 text-gray-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
              >
                <option value="newest">En Yeni</option>
                <option value="price-asc">Fiyat Artan</option>
                <option value="price-desc">Fiyat Azalan</option>
              </select>
            </div>
            {user && (
              <Link
                to="/create"
                className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500"
              >
                <Plus size={15} /> İlan Ekle
              </Link>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <div className="mb-3 text-5xl">🏪</div>
              <p className="mb-1 text-lg font-semibold">Bu kategoride henüz ilan yok.</p>
              {user && (
                <Link to="/create" className="text-sm font-bold text-violet-600 hover:underline">
                  İlk ilanı sen ekle!
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((listing) => (
                <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
