import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { getCategories, getCategoryAttributes, getListings, getProducts } from '../lib/api';
import ListingCard from '../components/ListingCard';
import ProductCard from '../components/ProductCard';
import Breadcrumb from '../components/Breadcrumb';
import useSiteBrand from '../hooks/useSiteBrand';

function idFromCatSlug(slug) {
  const match = slug?.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

function buildCatSlug(cat) {
  return `${cat.slug}-${cat.id}`;
}

function CategoryCard({ cat }) {
  const isProduct = cat.content_type === 'product';

  return (
    <Link to={`/categories/${buildCatSlug(cat)}`}>
      <div className="group relative mx-auto flex h-[250px] w-[160px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
        {cat.image ? (
          <img src={cat.image} alt={cat.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center ${isProduct ? 'bg-gradient-to-br from-slate-900 via-violet-900 to-cyan-700' : 'bg-gradient-to-br from-indigo-400 to-violet-500'}`}>
            <span className="text-6xl opacity-30">{cat.icon}</span>
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
          {cat.node_type === 'container' ? 'Klasor' : (isProduct ? 'Site Urunu' : 'Ilan')}
        </div>

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

function ProductCategoryView({ category, products, search, setSearch, sort, setSort }) {
  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter((product) => String(product.title || '').toLowerCase().includes(query));
    }
    return list;
  }, [products, search]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#faf7ff,#f2f7ff)] px-5 py-5 dark:border-slate-800 dark:bg-[linear-gradient(135deg,rgba(139,92,246,0.08),rgba(56,189,248,0.06))] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                Site Urunleri
              </div>
              <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                {category.hero_title || category.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                {category.hero_subtitle || 'Bu kategoride resmi site urunleri daha kompakt yatay bloklar halinde listelenir. Hedef, e-pin sitelerindeki gibi hizli tarama ve net fiyat odakli bir deneyim sunmaktir.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{products.length} urun</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">Resmi Satis</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Site urunlerinde ara..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-500"
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950">
            <SlidersHorizontal size={16} className="text-slate-400 dark:text-slate-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none dark:text-slate-200"
            >
              <option value="featured" className="text-slate-900 dark:bg-slate-900 dark:text-white">One Cikanlar</option>
              <option value="newest" className="text-slate-900 dark:bg-slate-900 dark:text-white">En Yeni</option>
              <option value="price-asc" className="text-slate-900 dark:bg-slate-900 dark:text-white">Fiyat Artan</option>
              <option value="price-desc" className="text-slate-900 dark:bg-slate-900 dark:text-white">Fiyat Azalan</option>
            </select>
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 text-5xl">🎮</div>
          <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">Bu kategoride gosterilecek site urunu yok.</p>
          <p className="mt-2 text-sm font-semibold text-slate-400 dark:text-slate-500">Urunler eklendiginde bu alan yatay market listesi olarak dolacak.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
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
  const [products, setProducts] = useState([]);
  const [catAttrs, setCatAttrs] = useState([]);
  const [attrFilters, setAttrFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    if (!catId) return;
    setLoading(true);
    setSearch('');
    getCategories()
      .then((response) => {
        const safeCategories = response.data || [];
        const found = safeCategories.find((item) => String(item.id) === String(catId)) || null;
        setCategories(safeCategories);
        setCategory(found);

        if (!found) {
          setListings([]);
          setProducts([]);
          setCatAttrs([]);
          setAttrFilters({});
          return;
        }

        if (found.node_type === 'container') {
          setListings([]);
          setProducts([]);
          setCatAttrs([]);
          setAttrFilters({});
          return;
        }

        if (found.content_type === 'product') {
          return getProducts({ category_id: catId, sort }).then((productResponse) => {
            setProducts(productResponse.data || []);
            setListings([]);
            setCatAttrs([]);
            setAttrFilters({});
          });
        }

        return Promise.all([
          getListings({ category_id: catId, sort }).then((listingResponse) => listingResponse.data || []),
          getCategoryAttributes(catId).then((attrResponse) => attrResponse.data || []),
        ]).then(([listingItems, attrs]) => {
          const safeAttrs = (attrs || []).filter((attr) => attr.is_filterable);
          const nextFilters = {};
          safeAttrs.forEach((attr) => {
            nextFilters[attr.slug] = '';
          });
          setListings(listingItems || []);
          setProducts([]);
          setCatAttrs(safeAttrs);
          setAttrFilters(nextFilters);
        });
      })
      .finally(() => setLoading(false));
  }, [catId, sort]);

  const childCats = useMemo(
    () => categories.filter((item) => String(item.parent_id) === String(catId)),
    [categories, catId],
  );

  const breadcrumb = useMemo(() => {
    if (!category || !categories.length) return [];
    const parts = [];
    let current = category;
    while (current) {
      parts.unshift(current);
      current = current.parent_id
        ? categories.find((item) => String(item.id) === String(current.parent_id))
        : null;
    }
    return parts;
  }, [category, categories]);

  const filteredListings = useMemo(() => {
    let list = listings;
    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter((listing) => String(listing.title || '').toLowerCase().includes(query));
    }
    Object.entries(attrFilters).forEach(([slug, value]) => {
      if (!value) return;
      list = list.filter((listing) => {
        const attrs = listing.attributes
          ? (typeof listing.attributes === 'string' ? JSON.parse(listing.attributes) : listing.attributes)
          : {};
        const attrValue = attrs[slug];
        if (Array.isArray(attrValue)) return attrValue.some((item) => String(item).toLowerCase().includes(value.toLowerCase()));
        return String(attrValue || '').toLowerCase().includes(value.toLowerCase());
      });
    });
    return list;
  }, [attrFilters, listings, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Ana Sayfa', to: '/' },
          { label: 'Kategoriler', to: '/categories' },
          ...breadcrumb.map((item, index) => ({
            label: item.name,
            to: index === breadcrumb.length - 1 ? undefined : `/categories/${buildCatSlug(item)}`,
          })),
        ]}
      />

      {!category ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-gray-400 shadow-sm">
          Kategori bulunamadi.
        </div>
      ) : category.node_type === 'container' ? (
        <>
          <div className="card overflow-hidden">
            {category.banner_image ? (
              <div className="relative h-40 bg-slate-100">
                <img src={category.banner_image} alt={category.name} className="h-full w-full object-cover object-center" />
                <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/70 to-transparent px-8">
                  <div>
                    <h1 className="text-3xl font-extrabold text-white">{category.name}</h1>
                    <p className="mt-1 text-sm text-white/70">{childCats.length} alt kategori bulundu</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-8 py-8">
                <h1 className="text-3xl font-extrabold text-white">{category.name}</h1>
                <p className="mt-1 text-sm text-white/70">{childCats.length} alt kategori bulundu</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
            Bu kategori bir klasor gorevi gorur. Devam etmek icin alt kategorilerden birini sec.
          </div>

          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {childCats.map((item) => (
              <CategoryCard key={item.id} cat={item} />
            ))}
          </div>
        </>
      ) : category.content_type === 'product' ? (
        <ProductCategoryView
          category={category}
          products={products}
          search={search}
          setSearch={setSearch}
          sort={sort}
          setSort={setSort}
        />
      ) : (
        <>
          <div className="card overflow-hidden">
            {category.banner_image ? (
              <div className="relative h-40 bg-slate-100">
                <img src={category.banner_image} alt={category.name} className="h-full w-full object-cover object-center" />
                <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/70 to-transparent px-8">
                  <div>
                    <h1 className="text-3xl font-extrabold text-white">{category.name}</h1>
                    <p className="mt-1 text-sm text-white/70">{filteredListings.length} ilan bulundu</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-8 py-8">
                <h1 className="text-3xl font-extrabold text-white">{category.name}</h1>
                <p className="mt-1 text-sm text-white/70">{filteredListings.length} ilan bulundu</p>
              </div>
            )}
          </div>

          {catAttrs.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {catAttrs.map((attr) => {
                if (attr.type === 'boolean') {
                  return (
                    <select
                      key={attr.slug}
                      value={attrFilters[attr.slug] || ''}
                      onChange={(e) => setAttrFilters((prev) => ({ ...prev, [attr.slug]: e.target.value }))}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                    >
                      <option value="">{attr.name}: Tumu</option>
                      <option value="Evet">Evet</option>
                      <option value="Hayir">Hayir</option>
                    </select>
                  );
                }
                if (attr.type === 'select' || attr.type === 'multiselect') {
                  return (
                    <select
                      key={attr.slug}
                      value={attrFilters[attr.slug] || ''}
                      onChange={(e) => setAttrFilters((prev) => ({ ...prev, [attr.slug]: e.target.value }))}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                    >
                      <option value="">{attr.name}: Tumu</option>
                      {(attr.options || []).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  );
                }
                return (
                  <input
                    key={attr.slug}
                    value={attrFilters[attr.slug] || ''}
                    onChange={(e) => setAttrFilters((prev) => ({ ...prev, [attr.slug]: e.target.value }))}
                    placeholder={`${attr.name} ara...`}
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                  />
                );
              })}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ilanlarda ara..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-violet-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-gray-400" />
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none">
                <option value="newest">En Yeni</option>
                <option value="price-asc">Fiyat Artan</option>
                <option value="price-desc">Fiyat Azalan</option>
              </select>
            </div>
            {user ? (
              <Link to="/create" className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500">
                <Plus size={15} /> Ilan Ekle
              </Link>
            ) : null}
          </div>

          {filteredListings.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <div className="mb-3 text-5xl">🏪</div>
              <p className="mb-1 text-lg font-semibold">Bu kategoride henuz ilan yok.</p>
              {user ? (
                <Link to="/create" className="text-sm font-bold text-violet-600 hover:underline">
                  Ilk ilani sen ekle
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} dense fallbackImage={defaultListingImage} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
