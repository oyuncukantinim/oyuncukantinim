import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Clock3,
  Flame,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Tag,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import { productSlug } from '../lib/api';
import { useCart } from '../context/useCart';

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
  if (product.delivery_type !== 'automatic') return undefined;
  const stock = Number(product.available_stock_count || 0);
  if (!Number.isFinite(stock) || stock <= 0) return 1;
  return stock;
}

function InstantBadge({ delivery, estimated }) {
  if (delivery === 'automatic') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-sm">
        <Zap size={11} strokeWidth={3} /> Aninda Teslim
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-sm">
      <Clock3 size={11} strokeWidth={3} /> {estimated || 'Manuel'}
    </span>
  );
}

function DiscountChip({ price, salePrice }) {
  if (!salePrice || Number(salePrice) <= 0 || Number(salePrice) >= Number(price || 0)) return null;
  const pct = Math.round((1 - Number(salePrice) / Number(price)) * 100);
  if (pct <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-sm">
      <Flame size={11} strokeWidth={3} /> -{pct}%
    </span>
  );
}

export default function ProductCard({ product, compact = false }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const href = product.product_path ? `/product/${product.product_path}` : productSlug(product.title, product.id);
  const currentPrice = Number(product.current_price ?? product.sale_price ?? product.price ?? 0);
  const basePrice = Number(product.price ?? 0);
  const hasDiscount = product.sale_price && Number(product.sale_price) > 0 && Number(product.sale_price) < basePrice;
  const typeMeta = PRODUCT_TYPE_META[product.product_type] || { label: 'Urun', icon: Tag };
  const TypeIcon = typeMeta.icon;
  const maxQuantity = useMemo(() => getMaxProductQuantity(product), [product]);
  const isOutOfStock = product.delivery_type === 'automatic' && Number(product.is_in_stock) !== 1;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      itemType: 'product',
      title: product.title,
      price: currentPrice,
      quantity,
      maxQuantity,
      image: product.cover_image || '',
      product_id: product.id,
      seller: 'OyuncuKantinim',
      path: href,
    });
  };

  const increment = () => setQuantity((prev) => {
    const next = prev + 1;
    return maxQuantity ? Math.min(next, maxQuantity) : next;
  });

  const decrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  if (compact) {
    return (
      <Link
        to={href}
        className="scroll-optimized-card group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/60 dark:hover:shadow-[0_18px_40px_-15px_rgba(139,92,246,0.4)]"
      >
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-white dark:bg-slate-900">
          {product.cover_image ? (
            <img
              src={product.cover_image}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-700">
              <Boxes size={42} />
            </div>
          )}

          <div className="absolute left-2.5 top-3 flex flex-wrap gap-1.5">
            <InstantBadge delivery={product.delivery_type} estimated={product.estimated_delivery_text} />
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
    <div className="scroll-optimized-card group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/60 dark:hover:shadow-[0_18px_40px_-15px_rgba(139,92,246,0.4)]">
      <div className="relative flex flex-col sm:flex-row">
        <Link to={href} className="h-24 w-full bg-white dark:bg-slate-900 sm:h-auto sm:w-[158px] sm:flex-shrink-0 lg:w-[176px]">
          <div className="flex h-full w-full items-center justify-start px-2 py-2 sm:px-2.5 sm:py-2.5">
            {product.cover_image ? (
              <div className="flex h-full min-h-[92px] w-full items-center justify-start overflow-hidden">
                <img
                  src={product.cover_image}
                  alt={product.title}
                  className="h-full w-full object-contain object-left transition-transform duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex h-full min-h-[92px] w-full items-center justify-center text-slate-300 dark:text-slate-700">
                <Boxes size={34} />
              </div>
            )}
          </div>
        </Link>

        <div className="flex flex-1 flex-col justify-between gap-1.5 p-2.5 sm:p-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
              <TypeIcon size={11} />
              <span>{typeMeta.label}</span>
            </div>

            <Link to={href}>
              <h3 className="mt-1 line-clamp-2 text-[14px] font-black leading-tight text-slate-900 transition-colors hover:text-violet-600 dark:text-white dark:hover:text-violet-300 sm:text-[15px]">
                {product.title}
              </h3>
            </Link>

            <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-4.5 text-slate-500 dark:text-slate-400">
              {product.short_description || product.description || 'Detayli aciklama urun sayfasinda yer alir.'}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white px-2.5 py-2.5 dark:border-slate-800 dark:bg-slate-900 sm:flex sm:min-w-[308px] sm:items-center sm:border-t-0 sm:px-3 lg:min-w-[348px]">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-[110px]">
              {hasDiscount ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                  <span className="line-through">{formatPrice(basePrice)} {'\u20BA'}</span>
                  <DiscountChip price={basePrice} salePrice={product.sale_price} />
                </div>
              ) : null}
              <div className="mt-1 text-xl font-black leading-none text-emerald-600 dark:text-emerald-400 sm:text-2xl">
                {formatPrice(currentPrice)} {'\u20BA'}
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-1.5 dark:border-slate-700 dark:bg-slate-950/70">
              <button
                type="button"
                onClick={decrement}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Minus size={12} />
              </button>
              <span className="min-w-[22px] text-center text-xs font-extrabold text-slate-900 dark:text-white">{quantity}</span>
              <button
                type="button"
                onClick={increment}
                disabled={Boolean(maxQuantity) && quantity >= maxQuantity}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Plus size={12} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="inline-flex min-w-[138px] items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-md transition-all duration-300 hover:bg-violet-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-400"
            >
              <ShoppingCart size={12} strokeWidth={3} /> {isOutOfStock ? 'Stok Yok' : 'Sepete Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
