import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Boxes,
  Lock,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  User,
  Wrench,
} from 'lucide-react';
import { getProduct, getProductReviews, idFromSlug, productPath } from '../lib/api';
import { useCart } from '../context/useCart';
import Breadcrumb from '../components/Breadcrumb';
import useSiteBrand from '../hooks/useSiteBrand';
import { buildProductSeo, useSeo } from '../hooks/useSeo';

const PRODUCT_TYPE_META = {
  digital_code: { label: 'Dijital Kod', icon: Tag },
  account: { label: 'Hesap', icon: User },
  item: { label: 'Item / Paket', icon: Package },
  service: { label: 'Servis', icon: Wrench },
};

function formatPrice(value) {
  return Number(value || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getDiscountPercent(price, salePrice) {
  const base = Number(price || 0);
  const sale = Number(salePrice || 0);
  if (!base || !sale || sale >= base) return 0;
  return Math.round((1 - sale / base) * 100);
}

function getMaxProductQuantity(product) {
  if (product.delivery_type !== 'automatic') return undefined;
  const stock = Number(product.available_stock_count || 0);
  if (!Number.isFinite(stock) || stock <= 0) return 1;
  return stock;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const id = idFromSlug(slug);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { defaultListingImage } = useSiteBrand();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ total: 0, avg_rating: 0 });
  const productSeo = useMemo(
    () => product ? buildProductSeo(product) : { title: 'Oyun Ürünü Satın Al', canonical: `/product/${slug}` },
    [product, slug],
  );
  useSeo(productSeo);

  useEffect(() => {
    let cancelled = false;

    getProduct(id)
      .then((response) => {
        if (cancelled) return;
        setProduct(response.data || null);
        setActiveImage(0);
        setQuantity(1);
      })
      .catch(() => {
        if (!cancelled) navigate('/404');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  useEffect(() => {
    let cancelled = false;
    if (!id) return undefined;

    getProductReviews(id, { limit: 20 })
      .then((response) => {
        if (cancelled) return;
        setReviews(response.data?.reviews || []);
        setReviewSummary({
          total: Number(response.data?.total || 0),
          avg_rating: Number(response.data?.avg_rating || 0),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setReviews([]);
          setReviewSummary({ total: 0, avg_rating: 0 });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const images = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.cover_image) list.push(product.cover_image);
    if (Array.isArray(product.gallery)) {
      for (const image of product.gallery) {
        if (image && !list.includes(image)) list.push(image);
      }
    }
    if (list.length === 0 && defaultListingImage) list.push(defaultListingImage);
    return list;
  }, [defaultListingImage, product]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600 dark:border-slate-800 dark:border-t-violet-400" />
      </div>
    );
  }

  if (!product) return null;

  const currentPrice = Number(product.current_price ?? product.sale_price ?? product.price ?? 0);
  const basePrice = Number(product.price ?? 0);
  const hasDiscount = product.sale_price && Number(product.sale_price) > 0 && Number(product.sale_price) < basePrice;
  const discountPercent = getDiscountPercent(basePrice, product.sale_price);
  const isUnavailable = product.status !== 'active' || (product.delivery_type === 'automatic' && Number(product.is_in_stock) !== 1);
  const currentImage = images[activeImage] || product.cover_image || defaultListingImage || '';
  const typeMeta = PRODUCT_TYPE_META[product.product_type] || PRODUCT_TYPE_META.digital_code;
  const TypeIcon = typeMeta.icon;
  const maxQuantity = getMaxProductQuantity(product);
  const lineTotal = currentPrice * quantity;

  const breadcrumbItems = [
    { label: 'Ana Sayfa', to: '/' },
    { label: 'Kategoriler', to: '/categories' },
    product.category_name
      ? {
          label: product.category_name,
          to: product.category_slug ? `/categories/${product.category_slug}` : '/categories',
        }
      : null,
    { label: product.title },
  ];

  const addProductToCart = () => {
    if (isUnavailable) return;

    addToCart({
      id: product.id,
      itemType: 'product',
      title: product.title,
      price: currentPrice,
      quantity,
      maxQuantity,
      image: product.cover_image || defaultListingImage || '',
      product_id: product.id,
      seller: 'OyuncuKantinim',
      path: productPath(product),
    });
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            {images.length > 1 ? (
              <div className="order-2 flex gap-2 sm:order-1 sm:flex-col">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${
                      index === activeImage
                        ? 'border-violet-500 shadow-md ring-2 ring-violet-200 dark:ring-violet-500/30'
                        : 'border-slate-200 opacity-70 hover:opacity-100 dark:border-slate-700'
                    }`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover bg-slate-50 dark:bg-slate-950" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="order-1 flex-1 sm:order-2">
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950">
                {currentImage ? (
                  <img src={currentImage} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-700">
                    <Boxes size={64} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                <TypeIcon size={12} strokeWidth={3} /> {typeMeta.label}
              </span>
              {product.badge_text ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <Sparkles size={12} strokeWidth={3} /> {product.badge_text}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-2xl font-black leading-[1.2] text-slate-900 dark:text-white sm:text-3xl">
              {product.title}
            </h1>

            <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
              {product.short_description || 'Bu ürün için detaylı açıklama aşağıda yer alır.'}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                {hasDiscount ? (
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-400 dark:text-slate-500">
                    <span className="line-through">{formatPrice(basePrice)} &#8378;</span>
                    <span>-%{discountPercent}</span>
                  </div>
                ) : null}
                <div className="mt-1 text-4xl font-black leading-none text-slate-900 dark:text-white sm:text-[42px]">
                  {formatPrice(currentPrice)} <span className="text-2xl text-emerald-600 dark:text-emerald-400">&#8378;</span>
                </div>
                {quantity > 1 ? (
                  <div className="mt-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    Toplam: {formatPrice(lineTotal)} &#8378;
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-3 sm:justify-end">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-950/70">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-[28px] text-center text-base font-black text-slate-900 dark:text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => (maxQuantity ? Math.min(prev + 1, maxQuantity) : prev + 1))}
                    disabled={Boolean(maxQuantity) && quantity >= maxQuantity}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={addProductToCart}
                  disabled={isUnavailable}
                  className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-lime-400 px-5 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_16px_34px_-16px_rgba(34,211,238,0.9)] transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:via-emerald-400 hover:to-lime-300 hover:shadow-[0_20px_42px_-18px_rgba(16,185,129,0.95)] disabled:cursor-not-allowed disabled:bg-none disabled:bg-amber-500 disabled:text-white disabled:shadow-none disabled:hover:translate-y-0 dark:disabled:bg-amber-600 dark:disabled:text-white"
                >
                  {isUnavailable ? (
                    <>
                      <Lock size={15} strokeWidth={3} /> Satın Alınamaz
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} strokeWidth={3} /> Sepete Ekle
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <h2 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">Ürün Açıklaması</h2>
        <div className="mt-3 h-[2px] w-12 rounded-full bg-violet-600 dark:bg-violet-400" />
        <div className="mt-5 whitespace-pre-line text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
          {product.description || 'Detaylı açıklama yakında burada görünecek.'}
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">Oyuncu Kantinim Yorumları</h2>
            <div className="mt-3 h-[2px] w-12 rounded-full bg-emerald-500" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950/70">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={15}
                  className={n <= Math.round(reviewSummary.avg_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'}
                />
              ))}
            </div>
            <span className="text-xs font-black text-slate-700 dark:text-slate-200">
              {reviewSummary.total ? `${reviewSummary.avg_rating || 0} / 5` : 'Yeni'}
            </span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
            Bu ürün için onaylanmış yorum yok.
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {reviews.map((review) => {
              const avg = Math.round((Number(review.reliability || 5) + Number(review.satisfaction || 5) + Number(review.speed || 5) + Number(review.service_quality || 5)) / 4);
              return (
                <article key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/55">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-black text-slate-900 dark:text-white">{review.reviewer_username || 'Oyuncu'}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        {review.created_at ? new Date(review.created_at).toLocaleDateString('tr-TR') : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={15} className={n <= avg ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'} />
                      ))}
                    </div>
                  </div>
                  {review.comment ? (
                    <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{review.comment}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
