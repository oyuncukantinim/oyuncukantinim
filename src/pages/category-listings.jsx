import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Clock3, Gift, PackageCheck, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Zap } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { getCategories, getCategoryAttributes, getListings, getProducts } from '../lib/api';
import ListingCard from '../components/ListingCard';
import ProductCard from '../components/ProductCard';
import Breadcrumb from '../components/Breadcrumb';
import useSiteBrand from '../hooks/useSiteBrand';

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

function ProductCategoryView({ category, products, sort, setSort }) {
  const heroImage = category.banner_image || category.image || '';

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[18px] border border-cyan-300/20 bg-[#050b17] shadow-[0_24px_70px_-48px_rgba(34,211,238,0.6)]">
        {heroImage ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0.48) 40%, rgba(0,0,0,0.82) 68%, black 100%)',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0.48) 40%, rgba(0,0,0,0.82) 68%, black 100%)',
              }}
            >
              <img src={heroImage} alt={category.name} className="h-full w-full object-cover object-center" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#050b17] via-[#050b17]/88 via-[36%] to-[#050b17]/45" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(147,51,234,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.24),transparent_32%),linear-gradient(135deg,#050b17,#081426)]" />
        )}

        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(90deg,rgba(34,211,238,0.14)_1px,transparent_1px),linear-gradient(0deg,rgba(147,51,234,0.13)_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative min-h-[184px] px-5 py-6 sm:px-7 sm:py-8">
          <div className="min-w-0 max-w-3xl">
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              {category.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
              Site ürünlerini hızlı teslimat, net fiyat ve güvenli ödeme akışıyla tek vitrinde incele.
            </p>
          </div>
        </div>
      </section>

      {products.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-cyan-300/20 bg-[#07111f] px-6 py-16 text-center shadow-sm">
          <div className="mb-4 text-5xl">Ürün</div>
          <p className="text-lg font-extrabold text-white">Bu kategoride gösterilecek site ürünü yok.</p>
          <p className="mt-2 text-sm font-semibold text-slate-400">Ürünler eklendiğinde bu alan market vitrini olarak dolacak.</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-[18px] border border-cyan-300/20 bg-[#040a14] p-3 shadow-[0_24px_80px_-58px_rgba(34,211,238,0.65)] sm:p-4">
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-cyan-300/15 bg-[#08111f]/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <div className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-500/30 bg-[#0b1626] px-3 text-xs font-bold text-slate-200">
                <PackageCheck size={15} className="text-slate-400" /> Teslimat Türü <span className="ml-auto text-slate-400">Tümü</span>
              </div>
              <div className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-500/30 bg-[#0b1626] px-3 text-xs font-bold text-slate-200">
                <Gift size={15} className="text-slate-400" /> Stok <span className="ml-auto text-slate-400">Aktif</span>
              </div>
              <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-violet-400/50 bg-violet-600/20 px-3 text-xs font-black text-violet-100 shadow-[0_0_20px_rgba(139,92,246,0.18)]">
                <Star size={15} /> Popüler
              </button>
              <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-fuchsia-400/45 bg-fuchsia-600/18 px-3 text-xs font-black text-fuchsia-100">
                <Sparkles size={15} /> İndirimli
              </button>
              <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-cyan-400/45 bg-cyan-500/14 px-3 text-xs font-black text-cyan-100">
                <Zap size={15} /> Hızlı Teslimat
              </button>
            </div>

            <label className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-500/35 bg-[#0b1626] px-3 text-xs font-bold text-slate-300">
              Sırala:
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="min-w-[132px] appearance-none bg-transparent pr-5 text-sm font-black text-white outline-none"
              >
                <option value="featured">Öne Çıkan</option>
                <option value="newest">Yeni Ürünler</option>
                <option value="price-asc">Fiyat Artan</option>
                <option value="price-desc">Fiyat Azalan</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none -ml-5 text-slate-400" />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-4 grid gap-3 rounded-xl border border-cyan-300/18 bg-[#06101e] px-4 py-4 sm:grid-cols-3">
            <div className="flex items-center justify-center gap-3 text-slate-200">
              <Clock3 size={30} className="text-violet-400 drop-shadow-[0_0_14px_rgba(139,92,246,0.65)]" />
              <div><div className="text-sm font-black text-white">7/24 Destek</div><div className="text-xs text-slate-400">Her zaman yanınızdayız</div></div>
            </div>
            <div className="flex items-center justify-center gap-3 border-cyan-300/15 text-slate-200 sm:border-x">
              <ShieldCheck size={32} className="text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,0.65)]" />
              <div><div className="text-sm font-black text-white">Güvenli Ödeme</div><div className="text-xs text-slate-400">256-bit SSL ile korunur</div></div>
            </div>
            <div className="flex items-center justify-center gap-3 text-slate-200">
              <Zap size={32} className="text-fuchsia-400 drop-shadow-[0_0_14px_rgba(217,70,239,0.65)]" />
              <div><div className="text-sm font-black text-white">Anında Teslimat</div><div className="text-xs text-slate-400">Siparişler saniyeler içinde teslim edilir</div></div>
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
        <ProductCategoryView category={category} products={products} sort={sort} setSort={setSort} />
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
              <div className="mb-3 text-5xl">Dukkan</div>
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
