import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgePercent,
  Boxes,
  Flame,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Star,
  Tag,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import { productPath } from '../lib/api';
import { useCart } from '../context/useCart';
import useSiteBrand from '../hooks/useSiteBrand';

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

function getMaxProductQuantity(product) {
  if (!isInstantProduct(product)) return undefined;
  const stock = Number(product.available_stock_count || 0);
  if (!Number.isFinite(stock) || stock <= 0) return 1;
  return stock;
}

function isInstantProduct(product) {
  const delivery = String(product?.delivery_type || '').toLowerCase();
  return delivery === 'automatic'
    || delivery === 'stock'
    || delivery === 'stok'
    || Number(product?.is_automatic_delivery || 0) === 1
    || Number(product?.available_stock_count || 0) > 0;
}

function InstantBadge({ product }) {
  if (isInstantProduct(product)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-black text-cyan-700 dark:border-cyan-400/25 dark:bg-cyan-400/10 dark:text-cyan-200">
        <Zap size={11} strokeWidth={3} /> Anında Teslimat
      </span>
    );
  }

  return null;
}

function DiscountChip({ price, salePrice }) {
  if (!salePrice || Number(salePrice) <= 0 || Number(salePrice) >= Number(price || 0)) return null;
  const pct = Math.round((1 - Number(salePrice) / Number(price)) * 100);
  if (pct <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-fuchsia-300/80 bg-fuchsia-600/90 px-2 py-1 text-[10px] font-black text-white shadow-[0_10px_24px_-12px_rgba(192,38,211,0.9)] backdrop-blur-sm dark:border-fuchsia-300/50 dark:bg-fuchsia-500/85 dark:text-white">
      <Flame size={11} strokeWidth={3} /> -%{pct}
    </span>
  );
}

function FeaturedChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/80 bg-amber-500/90 px-2 py-1 text-[10px] font-black text-white shadow-[0_10px_24px_-12px_rgba(245,158,11,0.9)] backdrop-blur-sm dark:border-amber-300/50 dark:bg-amber-400/85 dark:text-slate-950">
      <Star size={11} strokeWidth={3} /> Öne Çıkan
    </span>
  );
}

export default function ProductCard({ product, compact = false }) {
  const { addToCart, cart, removeFromCart, updateCartQuantity } = useCart();
  const { defaultListingImage } = useSiteBrand();

  const href = productPath(product);
  const coverImage = product.cover_image || defaultListingImage;
  const currentPrice = Number(product.current_price ?? product.sale_price ?? product.price ?? 0);
  const basePrice = Number(product.price ?? 0);
  const hasDiscount = product.sale_price && Number(product.sale_price) > 0 && Number(product.sale_price) < basePrice;
  const typeMeta = PRODUCT_TYPE_META[product.product_type] || { label: 'Ürün', icon: Tag };
  const TypeIcon = typeMeta.icon;
  const maxQuantity = useMemo(() => getMaxProductQuantity(product), [product]);
  const isInstantDelivery = isInstantProduct(product);
  const isOutOfStock = isInstantDelivery && Number(product.is_in_stock) !== 1;
  const cartItem = cart.find((item) => item.itemType === 'product' && String(item.id) === String(product.id));
  const cartQuantity = Number(cartItem?.quantity || 0);
  const canIncrease = !cartItem || !Number.isFinite(Number(maxQuantity)) || Number(maxQuantity) <= 0 || cartQuantity < Number(maxQuantity);
  const isFeatured = Number(product.is_featured || 0) === 1;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      itemType: 'product',
      title: product.title,
      price: currentPrice,
      quantity: 1,
      maxQuantity,
      image: coverImage || '',
      product_id: product.id,
      seller: 'OyuncuKantinim',
      path: href,
    });
  };

  const handleDecreaseCart = () => {
    if (!cartItem) return;
    if (cartQuantity <= 1) {
      removeFromCart(cartItem.cartId);
      return;
    }
    updateCartQuantity(cartItem.cartId, cartQuantity - 1);
  };

  const handleIncreaseCart = () => {
    if (!cartItem || !canIncrease) return;
    updateCartQuantity(cartItem.cartId, cartQuantity + 1);
  };

  if (compact) {
    return (
      <Link
        to={href}
        className="scroll-optimized-card group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/60"
      >
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
          {coverImage ? (
            <img
              src={coverImage}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-700">
              <Boxes size={42} />
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/70 to-transparent dark:from-slate-900 dark:via-slate-900/70" />

          <div className="absolute left-2.5 top-3 flex flex-wrap gap-1.5">
            {isFeatured ? <FeaturedChip /> : null}
            <InstantBadge product={product} />
            <DiscountChip price={basePrice} salePrice={product.sale_price} />
          </div>
        </div>

        <div className="space-y-3 p-3.5">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            <TypeIcon size={11} />
            <span>{typeMeta.label}</span>
          </div>

          <h3 className="line-clamp-2 min-h-[2.5em] text-sm font-black leading-snug text-slate-900 transition-colors group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-300">
            {product.title}
          </h3>

          <div className="flex items-end justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <div className="text-[11px] font-bold text-slate-400 line-through dark:text-slate-500">{formatPrice(basePrice)} {'\u20BA'}</div>
              ) : null}
              <div className="text-xl font-black leading-none text-emerald-600 dark:text-emerald-400">
                {formatPrice(currentPrice)} {'\u20BA'}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className="group flex h-full min-h-[304px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/60">
      <Link to={href} className="relative block aspect-[3/2] overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(139,92,246,0.16),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.12),transparent_34%)]" />
        <div className="relative flex h-full w-full items-center justify-center">
          {coverImage ? (
            <img
              src={coverImage}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-700">
              <Boxes size={48} />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/72 to-transparent dark:from-slate-900 dark:via-slate-900/72" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {isFeatured ? <FeaturedChip /> : null}
          {hasDiscount ? (
            <DiscountChip price={basePrice} salePrice={product.sale_price} />
          ) : !isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-200">
              <Star size={11} strokeWidth={3} /> Popüler
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
            <TypeIcon size={11} />
            <span>{typeMeta.label}</span>
          </div>

          <Link to={href}>
            <h3 className="line-clamp-2 min-h-[42px] text-[15px] font-black leading-snug text-slate-900 transition-colors group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-300">
              {product.title}
            </h3>
          </Link>

          {isInstantDelivery ? (
            <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
              <Zap size={13} className="text-emerald-500 dark:text-emerald-300" strokeWidth={3} />
              <span>Anında teslimat</span>
            </div>
          ) : null}
        </div>

        <div className="mt-3">
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              {hasDiscount ? (
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  <span className="line-through">{formatPrice(basePrice)} {'\u20BA'}</span>
                  <BadgePercent size={12} className="text-fuchsia-500 dark:text-fuchsia-300" />
                </div>
              ) : null}
              <div className="text-[22px] font-black leading-none text-slate-900 dark:text-white">
                {'\u20BA'} {formatPrice(currentPrice).replace(',00', '')}
              </div>
            </div>
          </div>

          {cartItem ? (
            <div className="grid h-9 grid-cols-[42px_minmax(0,1fr)_42px] overflow-hidden rounded-xl border border-violet-200 bg-violet-50 shadow-[0_14px_28px_-20px_rgba(124,58,237,0.75)] dark:border-violet-400/25 dark:bg-violet-400/10">
              <button
                type="button"
                onClick={handleDecreaseCart}
                className="inline-flex items-center justify-center border-r border-violet-200 text-violet-700 transition hover:bg-violet-100 dark:border-violet-400/20 dark:text-violet-200 dark:hover:bg-violet-400/15"
                aria-label="Adedi azalt"
              >
                <Minus size={15} strokeWidth={3} />
              </button>
              <div className="inline-flex items-center justify-center gap-1.5 px-2 text-[12px] font-black text-slate-900 dark:text-white">
                <span>{cartQuantity}</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">adet</span>
              </div>
              <button
                type="button"
                onClick={handleIncreaseCart}
                disabled={!canIncrease}
                className="inline-flex items-center justify-center border-l border-violet-200 text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:text-slate-300 dark:border-violet-400/20 dark:text-violet-200 dark:hover:bg-violet-400/15 dark:disabled:text-slate-600"
                aria-label="Adedi artır"
              >
                <Plus size={15} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-3 text-[12px] font-black text-white shadow-[0_14px_28px_-18px_rgba(124,58,237,0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-500 hover:to-sky-400 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:text-white disabled:shadow-none dark:disabled:from-slate-700 dark:disabled:to-slate-700 dark:disabled:text-slate-300"
            >
              {isOutOfStock ? 'Stok Yok' : 'Sepete Ekle'} <ShoppingCart size={16} strokeWidth={2.6} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
