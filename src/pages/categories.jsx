import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, ChevronRight } from 'lucide-react';
import { getListings } from '../lib/api';
import { setPageSeo, clearPageSeoJsonLd } from '../lib/seo';
import ListingCard from '../components/ListingCard';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

async function fetchCategories() {
  const url = new URL(API_URL);
  url.searchParams.set('action', 'get_categories_tree');
  const res = await fetch(url.toString());
  const json = await res.json();
  return json.data || [];
}

/**
 * Tuval oranı 543:745 — kartlar bu en-boy oranında, responsive genişlik.
 * Alt kategoriler + öne çıkan ilanlar.
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const roots = useMemo(() => categories
    .filter(c => c.is_active == 1 && !c.parent_id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)), [categories]);

  const childrenOf = (parentId) => categories
    .filter(c => c.is_active == 1 && c.parent_id == parentId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  useEffect(() => {
    if (!roots.length) return;
    let cancelled = false;
    (async () => {
      const next = {};
      await Promise.all(
        roots.map(async (r) => {
          try {
            const res = await getListings({ category_id: r.id, limit: 4, sort: 'newest' });
            if (!cancelled) next[r.id] = res.data || [];
          } catch {
            if (!cancelled) next[r.id] = [];
          }
        }),
      );
      if (!cancelled) setPreviews(next);
    })();
    return () => { cancelled = true; };
  }, [roots]);

  useEffect(() => {
    const base = 'Oyuncu Pazarı kategorileri: Valorant, hesap satışı ve daha fazlası. Güvenilir ilanlar.';
    const items = roots.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      url: typeof window !== 'undefined' ? `${window.location.origin}/market?category_id=${c.id}` : '',
    }));
    setPageSeo({
      title: 'Kategoriler',
      description: base,
      jsonLd: roots.length
        ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Oyuncu Kantinim Kategorileri',
            numberOfItems: roots.length,
            itemListElement: items,
          }
        : null,
    });
    return () => clearPageSeoJsonLd();
  }, [roots]);

  return (
    <div className="space-y-8">
      <div className="card p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-neon-purple/10 text-neon-purple">
            <LayoutGrid size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800">Kategoriler</h1>
            <p className="text-gray-500 text-sm mt-1">İlan vermek veya alışveriş yapmak için bir kategori seçin. Alt kategorilere ve öne çıkan ilanlara göz atın.</p>
          </div>
        </div>
        <Link to="/market" className="btn-secondary text-sm py-2.5 px-5 whitespace-nowrap">
          Tüm ilanlar
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : roots.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="font-semibold">Henüz kategori yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
          {roots.map(cat => {
            const subs = childrenOf(cat.id);
            const hot = previews[cat.id] || [];
            return (
              <div
                key={cat.id}
                className="w-full max-w-[543px] space-y-3"
              >
                <Link
                  to={`/market?category_id=${cat.id}`}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple rounded-2xl"
                >
                  <div
                    className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:border-neon-purple/40 group-hover:-translate-y-0.5"
                    style={{ aspectRatio: '543 / 745' }}
                  >
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-violet-100 via-white to-cyan-50 p-6 text-center">
                        <span className="text-6xl mb-3">{cat.icon || '🎮'}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-90 group-hover:via-black/30" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <h2 className="text-xl font-extrabold leading-tight drop-shadow-md flex items-center gap-1">
                        {cat.icon && <span>{cat.icon}</span>}
                        {cat.name}
                        <ChevronRight size={18} className="opacity-80 flex-shrink-0" />
                      </h2>
                      {cat.min_price != null && (
                        <p className="text-xs text-white/85 mt-1 font-medium">Min. ilan: {cat.min_price} ₺</p>
                      )}
                    </div>
                  </div>
                </Link>

                {subs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {subs.map(s => (
                      <Link
                        key={s.id}
                        to={`/market?category_id=${s.id}`}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 transition-colors"
                      >
                        {s.icon} {s.name}
                      </Link>
                    ))}
                  </div>
                )}

                {hot.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wide px-1">Öne çıkan ilanlar</div>
                    <div className="grid grid-cols-2 gap-2">
                      {hot.map((listing) => (
                        <div key={listing.id} className="min-w-0 scale-95 origin-top">
                          <ListingCard listing={listing} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
