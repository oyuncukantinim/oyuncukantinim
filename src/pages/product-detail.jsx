import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Boxes,
  CheckCircle2,
  Clock3,
  CreditCard,
  Flame,
  Headphones,
  Lock,
  Package,
  Repeat,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tag,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import { getProduct, idFromSlug, productSlug } from '../lib/api';
import { useCart } from '../context/useCart';
import Breadcrumb from '../components/Breadcrumb';

// Corporate / professional product detail. Less neon, more structure.
// Two-column hero with a clean image gallery (vertical thumb strip on
// desktop, horizontal on mobile), info panel with tidy badges, structured
// price block, and below the hero a feature strip + description + spec
// table. Fully light/dark adaptive — no hardcoded colors that break either
// theme.

const PRODUCT_TYPE_META = {
  digital_code: { label: 'Dijital Kod', icon: Tag },
  account: { label: 'Hesap', icon: User },
  item: { label: 'Item / Paket', icon: Package },
  service: { label: 'Servis', icon: Wrench },
};

function formatPrice(value) {
  return Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FeatureCell({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
        <Icon size={18} strokeWidth={2.4} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{title}</div>
        <div className="mt-0.5 line-clamp-1 text-sm font-bold text-slate-800 dark:text-slate-100">{subtitle}</div>
      </div>
    </div>
  );
}

function SpecRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const id = idFromSlug(slug);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getProduct(id)
      .then((response) => {
        if (cancelled) return;
        setProduct(response.data || null);
        setActiveImage(0);
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

  const images = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.cover_image) list.push(product.cover_image);
    if (Array.isArray(product.gallery)) {
      for (const image of product.gallery) {
        if (image && !list.includes(image)) list.push(image);
      }
    }
    return list;
  }, [product]);

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
  const discountPct = hasDiscount ? Math.round((1 - Number(product.sale_price) / basePrice) * 100) : 0;
  const isUnavailable = product.status !== 'active' || (product.delivery_type === 'automatic' && Number(product.is_in_stock) !== 1);
  const currentImage = images[activeImage] || product.cover_image || '';
  const typeMeta = PRODUCT_TYPE_META[product.product_type] || PRODUCT_TYPE_META.digital_code;
  const TypeIcon = typeMeta.icon;
  const stockText = product.stock_visibility
    ? (product.delivery_type === 'manual'
      ? 'Sipariş anında ayrılır'
      : `${Number(product.available_stock_count || 0).toLocaleString('tr-TR')} adet hazır`)
    : 'Stok bilgisi gizli';
  const deliveryText = product.delivery_type === 'automatic'
    ? 'Anında Teslim'
    : (product.estimated_delivery_text || 'Manuel Teslimat');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', to: '/' },
    { label: 'Kategoriler', to: '/categories' },
    product.category_name
      ? {
          label: product.category_name,
          to: product.category_id ? `/categories/${product.category_slug}-${product.category_id}` : '/categories',
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
      image: product.cover_image || '',
      product_id: product.id,
      seller: 'OyuncuKantinim',
      path: product.product_path ? `/product/${product.product_path}` : productSlug(product.title, product.id),
    });
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* HERO */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* IMAGE BLOCK */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Vertical thumb strip (desktop) */}
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
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}

            {/* Main image */}
            <div className="order-1 flex-1 sm:order-2">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950">
                {currentImage ? (
                  <img src={currentImage} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-700">
                    <Boxes size={64} />
                  </div>
                )}

                {/* Top-left badge cluster */}
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  {product.delivery_type === 'automatic' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-sm">
                      <Zap size={12} strokeWidth={3} /> Anında Teslim
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-sm">
                      <Clock3 size={12} strokeWidth={3} /> {product.estimated_delivery_text || 'Manuel'}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm backdrop-blur dark:bg-slate-950/90 dark:text-emerald-300">
                    <ShieldCheck size={12} strokeWidth={3} /> Resmi Ürün
                  </span>
                </div>

                {/* Top-right discount */}
                {hasDiscount ? (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-sm">
                    <Flame size={12} strokeWidth={3} /> -{discountPct}%
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* INFO PANEL */}
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            {/* Type / category / badge row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                <TypeIcon size={12} strokeWidth={3} /> {typeMeta.label}
              </span>
              {product.category_name ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Tag size={12} strokeWidth={3} /> {product.category_name}
                </span>
              ) : null}
              {product.badge_text ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <Sparkles size={12} strokeWidth={3} /> {product.badge_text}
                </span>
              ) : null}
            </div>

            {/* Title */}
            <h1 className="mt-4 text-2xl font-black leading-[1.2] text-slate-900 dark:text-white sm:text-3xl">
              {product.title}
            </h1>

            {/* Short description */}
            <p className="mt-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">
              {product.short_description || 'Bu resmi ürün için detaylı açıklama yakında burada görünecek.'}
            </p>

            {/* Quick meta */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  <Zap size={11} strokeWidth={3} /> Teslimat
                </div>
                <div className="mt-1.5 text-sm font-black text-slate-900 dark:text-white">{deliveryText}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  <Boxes size={11} strokeWidth={3} /> Stok
                </div>
                <div className="mt-1.5 text-sm font-black text-slate-900 dark:text-white">{stockText}</div>
              </div>
            </div>
          </div>

          {/* PRICE / CTA card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Satış Fiyatı</div>
                {hasDiscount ? (
                  <div className="mt-1 text-sm font-bold text-slate-400 line-through dark:text-slate-500">
                    {formatPrice(basePrice)} ₺
                  </div>
                ) : null}
                <div className="text-4xl font-black leading-none text-slate-900 dark:text-white sm:text-[42px]">
                  {formatPrice(currentPrice)} <span className="text-2xl text-emerald-600 dark:text-emerald-400">₺</span>
                </div>
                <div className="mt-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">KDV Dahil</div>
              </div>
              {hasDiscount ? (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-sm">
                    <Flame size={12} strokeWidth={3} /> -{discountPct}%
                  </span>
                  <div className="mt-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    {formatPrice(basePrice - currentPrice)} ₺ tasarruf
                  </div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={addProductToCart}
              disabled={isUnavailable}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white disabled:shadow-none disabled:hover:translate-y-0 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
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

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={11} strokeWidth={3} className="text-emerald-500 dark:text-emerald-400" /> KDV Dahil
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={11} strokeWidth={3} className="text-emerald-500 dark:text-emerald-400" /> Güvenli Ödeme
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FeatureCell icon={ShieldCheck} title="Garanti" subtitle="Resmi Mağaza" />
        <FeatureCell icon={Zap} title="Teslimat" subtitle={deliveryText} />
        <FeatureCell icon={CreditCard} title="Ödeme" subtitle="Güvenli & Hızlı" />
        <FeatureCell icon={Headphones} title="Destek" subtitle="7/24 Yardım" />
      </section>

      {/* DESCRIPTION + SPECS */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <h2 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">Ürün Açıklaması</h2>
          <div className="mt-3 h-[2px] w-12 rounded-full bg-violet-600 dark:bg-violet-400" />
          <div className="mt-5 whitespace-pre-line text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
            {product.description || 'Detaylı açıklama yakında. Teslimat ve kullanım bilgileri sipariş tamamlandığında "Siparişlerim" sayfasında görünür.'}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Ürün Bilgileri</h3>
            </div>
            <SpecRow label="Tip" value={typeMeta.label} />
            <SpecRow label="Kategori" value={product.category_name || '—'} />
            <SpecRow label="Teslimat" value={deliveryText} />
            <SpecRow label="Stok" value={stockText} />
            {product.badge_text ? <SpecRow label="Etiket" value={product.badge_text} /> : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Kullanım Şartları</h3>
            <ul className="mt-3 space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <Repeat size={14} strokeWidth={3} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" />
                Sipariş onaylandıktan sonra teslimat detayları profilinden görüntülenebilir.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck size={14} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                Tüm ürünler resmi tedarikçilerden temin edilmiş ve garantilidir.
              </li>
              <li className="flex items-start gap-2">
                <Headphones size={14} strokeWidth={3} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
                Sorun yaşamanız halinde 7/24 destek ekibi yardımınıza hazırdır.
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
