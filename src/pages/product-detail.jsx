import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Headphones,
  Lock,
  Package,
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

// Cinematic, dark-tactical product detail layout. Designed to feel like a
// "loadout reveal" — large hero image with a neon frame, prominent purchase
// panel, scan-line backdrop, and structured trust strip below. Drops the
// previous split-card look entirely.

const PRODUCT_TYPE_META = {
  digital_code: { label: 'Dijital Kod', icon: Tag, accent: 'from-cyan-400 to-emerald-400' },
  account: { label: 'Hesap', icon: User, accent: 'from-violet-400 to-fuchsia-400' },
  item: { label: 'Item / Paket', icon: Package, accent: 'from-amber-400 to-orange-400' },
  service: { label: 'Servis', icon: Wrench, accent: 'from-sky-400 to-blue-400' },
};

function formatPrice(value) {
  return Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatTile({ icon: Icon, label, value, tone = 'cyan' }) {
  const toneMap = {
    cyan: 'from-cyan-400/15 to-cyan-400/0 ring-cyan-400/25 text-cyan-300',
    emerald: 'from-emerald-400/15 to-emerald-400/0 ring-emerald-400/25 text-emerald-300',
    violet: 'from-violet-400/15 to-violet-400/0 ring-violet-400/25 text-violet-300',
    amber: 'from-amber-400/15 to-amber-400/0 ring-amber-400/25 text-amber-300',
  };
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${toneMap[tone]} bg-slate-900/60 p-4 ring-1 backdrop-blur`}>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] opacity-90">
        <Icon size={13} strokeWidth={3} />
        <span>{label}</span>
      </div>
      <div className="mt-2 text-sm font-black text-white sm:text-base">{value}</div>
    </div>
  );
}

function TrustChip({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/75">
      <Icon size={13} strokeWidth={3} className="text-cyan-300" />
      {text}
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
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 animate-ping rounded-full border-4 border-cyan-400/30 opacity-50" />
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-800 border-t-cyan-400" />
        </div>
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
    <div className="relative">
      {/* Cinematic backdrop — full bleed, sits behind the layout */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 22%, rgba(34,211,238,0.55), transparent 45%), radial-gradient(circle at 82% 38%, rgba(139,92,246,0.45), transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="mx-auto max-w-[1280px] space-y-6 pt-2 text-white">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-white/70 transition hover:bg-white/[0.08] hover:text-cyan-300"
          >
            <ArrowLeft size={12} strokeWidth={3} /> Geri
          </button>
          <ChevronRight size={11} className="text-white/25" />
          <Link to="/categories" className="hover:text-cyan-300">Kategoriler</Link>
          {product.category_name ? (
            <>
              <ChevronRight size={11} className="text-white/25" />
              <Link
                to={product.category_id ? `/categories/${product.category_slug}-${product.category_id}` : '/categories'}
                className="hover:text-cyan-300"
              >
                {product.category_name}
              </Link>
            </>
          ) : null}
          <ChevronRight size={11} className="text-white/25" />
          <span className="truncate text-white">{product.title}</span>
        </div>

        {/* HERO — gallery + info */}
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          {/* GALLERY */}
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-[28px] bg-slate-900/70 ring-1 ring-white/10">
              {/* Animated neon frame */}
              <div className="pointer-events-none absolute inset-0 rounded-[28px] [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-cyan-400/0 via-cyan-400/40 to-violet-400/0 opacity-60" />
              </div>

              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.title}
                  className="relative aspect-[16/10] w-full object-cover"
                />
              ) : (
                <div className="relative flex aspect-[16/10] w-full items-center justify-center text-slate-500">
                  <Boxes size={64} />
                </div>
              )}

              {/* Discount cluster (top-right) */}
              {hasDiscount ? (
                <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_8px_24px_rgba(244,63,94,0.55)]">
                    <Flame size={13} strokeWidth={3} /> -{discountPct}%
                  </span>
                </div>
              ) : null}

              {/* Bottom-left badge stack */}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                {product.delivery_type === 'automatic' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.5)]">
                    <Zap size={13} strokeWidth={3} /> Anında Teslim
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/50 bg-amber-400/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200 backdrop-blur">
                    <Clock3 size={13} strokeWidth={3} /> {product.estimated_delivery_text || 'Manuel Teslim'}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-slate-950/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300 backdrop-blur">
                  <ShieldCheck size={13} strokeWidth={3} /> Resmi Ürün
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 ? (
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`group relative overflow-hidden rounded-xl ring-1 transition-all ${
                      index === activeImage
                        ? 'ring-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.5)]'
                        : 'opacity-60 ring-white/10 hover:opacity-100 hover:ring-white/30'
                    }`}
                  >
                    <img src={image} alt="" className="aspect-square w-full object-cover" />
                    {index === activeImage ? (
                      <span className="pointer-events-none absolute inset-0 ring-2 ring-cyan-400/60 ring-inset" />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* INFO PANEL */}
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 ring-1 ring-white/10 sm:p-7">
            {/* Soft glow accents */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-violet-400/15 blur-3xl" />

            {/* Type + custom badge */}
            <div className="relative flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r ${typeMeta.accent} px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950`}>
                <TypeIcon size={12} strokeWidth={3} /> {typeMeta.label}
              </span>
              {product.badge_text ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/40 bg-violet-500/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-violet-200">
                  <Sparkles size={12} strokeWidth={3} /> {product.badge_text}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/65">
                <Tag size={12} strokeWidth={3} /> {product.category_name || 'Kategori'}
              </span>
            </div>

            {/* Title + tagline */}
            <h1 className="relative mt-4 text-2xl font-black leading-[1.15] text-white sm:text-3xl lg:text-[34px]">
              {product.title}
            </h1>
            <p className="relative mt-3 text-sm font-semibold leading-7 text-white/65">
              {product.short_description || 'Bu resmi ürün için detaylı açıklama yakında burada görünecek.'}
            </p>

            {/* Stat tiles */}
            <div className="relative mt-5 grid grid-cols-2 gap-2.5">
              <StatTile icon={Zap} label="Teslimat" value={deliveryText} tone={product.delivery_type === 'automatic' ? 'emerald' : 'amber'} />
              <StatTile icon={Boxes} label="Stok" value={stockText} tone="cyan" />
            </div>

            {/* PRICE + CTA */}
            <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-black p-5 ring-1 ring-cyan-400/25">
              {/* corner cut decorations */}
              <span className="pointer-events-none absolute left-0 top-0 h-px w-12 bg-cyan-400" />
              <span className="pointer-events-none absolute left-0 top-0 h-12 w-px bg-cyan-400" />
              <span className="pointer-events-none absolute bottom-0 right-0 h-px w-12 bg-violet-400" />
              <span className="pointer-events-none absolute bottom-0 right-0 h-12 w-px bg-violet-400" />

              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Fiyat</div>
                  {hasDiscount ? (
                    <div className="mt-1 text-sm font-bold text-white/30 line-through">{formatPrice(basePrice)} ₺</div>
                  ) : null}
                  <div className="bg-gradient-to-r from-cyan-300 via-cyan-300 to-emerald-300 bg-clip-text text-4xl font-black leading-none text-transparent sm:text-[42px]">
                    {formatPrice(currentPrice)} ₺
                  </div>
                </div>
                {hasDiscount ? (
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_4px_18px_rgba(244,63,94,0.55)]">
                      <Flame size={12} strokeWidth={3} /> -{discountPct}%
                    </div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                      {formatPrice(basePrice - currentPrice)} ₺ tasarruf
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={addProductToCart}
                disabled={isUnavailable}
                className="group relative mt-5 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-slate-950 shadow-[0_12px_30px_-10px_rgba(34,211,238,0.7)] transition-all hover:shadow-[0_18px_42px_-10px_rgba(34,211,238,0.85)] disabled:cursor-not-allowed disabled:bg-slate-800 disabled:bg-none disabled:text-white/45 disabled:shadow-none"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {isUnavailable ? (
                  <>
                    <Lock size={15} strokeWidth={3} /> Şu Anda Satın Alınamaz
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} strokeWidth={3} /> Sepete Ekle
                  </>
                )}
              </button>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                <span className="inline-flex items-center gap-1"><CheckCircle2 size={11} strokeWidth={3} className="text-emerald-300" /> KDV Dahil</span>
                <span className="text-white/15">•</span>
                <span className="inline-flex items-center gap-1"><ShieldCheck size={11} strokeWidth={3} className="text-emerald-300" /> Güvenli Ödeme</span>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <TrustChip icon={ShieldCheck} text="Resmi Mağaza" />
          <TrustChip icon={Zap} text="Hızlı Teslimat" />
          <TrustChip icon={CheckCircle2} text="Garantili" />
          <TrustChip icon={Headphones} text="7/24 Destek" />
        </section>

        {/* DESCRIPTION */}
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-950 p-6 ring-1 ring-white/10 sm:p-8">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
            Ürün Detayı
          </div>
          <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{product.title} hakkında</h2>
          <div className="mt-4 whitespace-pre-line text-sm font-semibold leading-7 text-white/70 sm:text-[15px]">
            {product.description || 'Detaylı açıklama yakında. Teslimat ve kullanım bilgileri sipariş tamamlandığında "Siparişlerim" sayfasında görünür.'}
          </div>
        </section>

        {/* INFO STRIP */}
        <section className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/85">Tip</div>
            <div className="mt-1.5 flex items-center gap-2 text-sm font-black text-white">
              <TypeIcon size={15} strokeWidth={3} className="text-cyan-300" /> {typeMeta.label}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/85">Kategori</div>
            <div className="mt-1.5 text-sm font-black text-white">{product.category_name || '—'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/85">Teslimat</div>
            <div className="mt-1.5 text-sm font-black text-white">{deliveryText}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/85">Stok</div>
            <div className="mt-1.5 text-sm font-black text-white">{stockText}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
