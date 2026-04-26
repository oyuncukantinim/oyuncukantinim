import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { getCategories, getCategoryAttributes, getListings, getProducts } from '../lib/api';
import ListingCard from '../components/ListingCard';
import ProductCard from '../components/ProductCard';
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

  const featuredProducts = filtered.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-cyan-400/15 bg-[linear-gradient(135deg,#050816_0%,#130b2f_48%,#07273e_100%)] shadow-[0_30px_80px_rgba(4,10,25,0.45)]">
        <div className="pointer-events-none absolute inset-0">
          {category.hero_image ? (
            <img src={category.hero_image} alt={category.name} className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-30 mix-blend-screen" />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.24),transparent_32%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96),rgba(2,6,23,0.88)_46%,rgba(2,6,23,0.55)_78%,rgba(2,6,23,0.2))]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        </div>

        <div className="relative grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:px-10 lg:py-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/80">
              Site Urunleri
            </div>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.05] text-white sm:text-5xl">
              {category.hero_title || category.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300/78 sm:text-[15px]">
              {category.hero_subtitle || 'Bu kategori resmi urun vitrini gibi calisir. Daha buyuk gorseller, daha guclu fiyat bloklari ve gaming temali yatay urun satirlari ile kesintisiz bir market deneyimi sunar.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/72">{products.length} urun</span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Resmi Satis</span>
              <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-100">Gaming Market</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-4 backdrop-blur-md">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/38">Vitrin Ozeti</div>
            <div className="mt-4 space-y-3">
              {featuredProducts.length > 0 ? featuredProducts.map((product, index) => (
                <div key={product.id} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/45">Slot {String(index + 1).padStart(2, '0')}</div>
                  <div className="mt-2 line-clamp-1 text-sm font-black text-white">{product.title}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-300/70">{Number(product.current_price ?? product.sale_price ?? product.price ?? 0).toFixed(2)} ₺</div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/12 bg-white/5 px-4 py-6 text-sm font-semibold text-white/58">
                  Vitrin urunleri eklendiginde burada hizli ozet gorunecek.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-cyan-400/12 bg-[linear-gradient(180deg,rgba(9,12,24,0.96),rgba(12,18,32,0.98))] p-4 shadow-[0_24px_60px_rgba(3,10,25,0.3)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-100/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Site urunlerinde ara..."
              className="w-full rounded-2xl border border-white/8 bg-white/5 py-3 pl-11 pr-4 text-sm font-semibold text-white placeholder:text-white/28 focus:border-cyan-300/40 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5">
            <SlidersHorizontal size={16} className="text-cyan-100/40" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-sm font-bold text-white outline-none"
            >
              <option value="featured" className="text-slate-900">One Cikanlar</option>
              <option value="newest" className="text-slate-900">En Yeni</option>
              <option value="price-asc" className="text-slate-900">Fiyat Artan</option>
              <option value="price-desc" className="text-slate-900">Fiyat Azalan</option>
            </select>
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-cyan-300/15 bg-[linear-gradient(180deg,rgba(8,12,24,0.94),rgba(8,16,27,0.98))] px-6 py-16 text-center shadow-[0_18px_46px_rgba(2,8,20,0.28)]">
          <div className="mb-4 text-5xl">🎮</div>
          <p className="text-lg font-extrabold text-white/88">Bu kategoride gosterilecek site urunu yok.</p>
          <p className="mt-2 text-sm font-semibold text-slate-400">Urunler eklendiginde bu gaming vitrin otomatik dolacak.</p>
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
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
        <Link to="/" className="font-semibold hover:text-violet-600">Ana Sayfa</Link>
        <ChevronRight size={12} />
        <Link to="/categories" className="font-semibold hover:text-violet-600">Kategoriler</Link>
        {breadcrumb.map((item, index) => (
          <span key={item.id} className="flex items-center gap-1.5">
            <ChevronRight size={12} />
            {index === breadcrumb.length - 1 ? (
              <span className="font-bold text-gray-700">{item.name}</span>
            ) : (
              <Link to={`/categories/${buildCatSlug(item)}`} className="font-semibold hover:text-violet-600">
                {item.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

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
