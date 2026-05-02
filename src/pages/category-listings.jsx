import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock3, Plus, Search, ShieldCheck, SlidersHorizontal, Zap } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { getCategories, getCategoryAttributes, getListings, getProducts } from '../lib/api';
import ListingCard from '../components/ListingCard';
import ProductCard from '../components/ProductCard';
import Breadcrumb from '../components/Breadcrumb';
import useSiteBrand from '../hooks/useSiteBrand';
import { buildCategorySeo, useSeo } from '../hooks/useSeo';

function buildCatSlug(cat) {
  return cat.slug || cat.id;
}

function legacyIdFromCatSlug(slug) {
  const match = slug?.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
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
          {cat.node_type === 'container' ? 'Klasör' : (isProduct ? 'Site Ürünü' : 'İlan')}
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

function ProductCategoryView({ category, products }) {
  const heroImage = category.banner_image || category.image || '';

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {heroImage ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.22) 22%, rgba(0,0,0,0.58) 54%, black 100%)',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.22) 22%, rgba(0,0,0,0.58) 54%, black 100%)',
              }}
            >
              <img src={heroImage} alt={category.name} className="h-full w-full object-cover object-center" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 via-[42%] to-white/60 dark:from-slate-900 dark:via-slate-900/92 dark:to-slate-900/65" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.14),transparent_32%),linear-gradient(135deg,#ffffff,#f8fafc)] dark:bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.18),transparent_32%),linear-gradient(135deg,#0f172a,#020617)]" />
        )}

        <div className="relative min-h-[176px] px-5 py-6 sm:px-7 sm:py-8">
          <div className="min-w-0 max-w-3xl">
            <h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
              {category.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
              Site ürünlerini hızlı teslimat, net fiyat ve güvenli ödeme akışıyla tek vitrinde incele.
            </p>
          </div>
        </div>
      </section>

      {products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 text-5xl">Ürün</div>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">Bu kategoride gösterilecek site ürünü yok.</p>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Ürünler eklendiğinde bu alan market vitrini olarak dolacak.</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/70 sm:grid-cols-3">
            <div className="flex items-center justify-center gap-3 text-slate-700 dark:text-slate-200">
              <Clock3 size={30} className="text-violet-500 dark:text-violet-300" />
              <div><div className="text-sm font-black text-slate-900 dark:text-white">7/24 Destek</div><div className="text-xs text-slate-500 dark:text-slate-400">Her zaman yanınızdayız</div></div>
            </div>
            <div className="flex items-center justify-center gap-3 border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200 sm:border-x">
              <ShieldCheck size={32} className="text-cyan-500 dark:text-cyan-300" />
              <div><div className="text-sm font-black text-slate-900 dark:text-white">Güvenli Ödeme</div><div className="text-xs text-slate-500 dark:text-slate-400">256-bit SSL ile korunur</div></div>
            </div>
            <div className="flex items-center justify-center gap-3 text-slate-700 dark:text-slate-200">
              <Zap size={32} className="text-fuchsia-500 dark:text-fuchsia-300" />
              <div><div className="text-sm font-black text-slate-900 dark:text-white">Anında Teslimat</div><div className="text-xs text-slate-500 dark:text-slate-400">Siparişler saniyeler içinde teslim edilir</div></div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function CategoryListingsPage() {
  const { catSlug } = useParams();
  const { user } = useAuth();
  const { defaultListingImage } = useSiteBrand();

  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [products, setProducts] = useState([]);
  const [catAttrs, setCatAttrs] = useState([]);
  const [attrFilters, setAttrFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const categorySeo = useMemo(
    () => category ? buildCategorySeo(category) : { title: 'Kategori', canonical: `/categories/${catSlug}` },
    [category, catSlug],
  );
  useSeo(categorySeo);

  useEffect(() => {
    if (!catSlug) return;
    setLoading(true);
    setSearch('');

    getCategories()
      .then((response) => {
        const safeCategories = response.data || [];
        const legacyId = legacyIdFromCatSlug(catSlug);
        const found = safeCategories.find((item) => item.slug === catSlug)
          || (legacyId ? safeCategories.find((item) => String(item.id) === String(legacyId)) : null)
          || null;
        const categoryId = found?.id;
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
          return getProducts({ category_id: categoryId, sort }).then((productResponse) => {
            setProducts(productResponse.data || []);
            setListings([]);
            setCatAttrs([]);
            setAttrFilters({});
          });
        }

        return Promise.all([
          getListings({ category_id: categoryId, sort }).then((listingResponse) => listingResponse.data || []),
          getCategoryAttributes(categoryId).then((attrResponse) => attrResponse.data || []),
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
  }, [catSlug, sort]);

  const childCats = useMemo(
    () => categories.filter((item) => String(item.parent_id) === String(category?.id || '')),
    [categories, category],
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
          Kategori bulunamadı.
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
            Bu kategori bir klasör görevi görür. Devam etmek için alt kategorilerden birini seç.
          </div>

          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {childCats.map((item) => (
              <CategoryCard key={item.id} cat={item} />
            ))}
          </div>
        </>
      ) : category.content_type === 'product' ? (
        <ProductCategoryView category={category} products={products} />
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
                      onChange={(e) => setAttrFilters((prev) => ({ ...prev, [attr.slug]: e.target.value }))}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                    >
                      <option value="">{attr.name}: Tümü</option>
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
                placeholder="İlanlarda ara..."
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
                <Plus size={15} /> İlan Ekle
              </Link>
            ) : null}
          </div>

          {filteredListings.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <div className="mb-3 text-5xl">Dükkan</div>
              <p className="mb-1 text-lg font-semibold">Bu kategoride henüz ilan yok.</p>
              {user ? (
                <Link to="/create" className="text-sm font-bold text-violet-600 hover:underline">
                  İlk ilanı sen ekle
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
