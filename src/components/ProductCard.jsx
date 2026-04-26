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

function StockIndicator({ visible, deliveryType }) {
  if (!visible) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Boxes size={11} /> Stok Gizli
      </span>
    );
  }

  if (deliveryType === 'manual') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <Clock3 size={11} /> Manuel
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      <Boxes size={11} /> Stok Var
    </span>
  );
}

function InstantBadge({ delivery, estimated }) {
  if (delivery === 'automatic') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-sm">
        <Zap size={11} strokeWidth={3} /> Anında Teslim
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
  const typeMeta = PRODUCT_TYPE_META[product.product_type] || { label: 'Ürün', icon: Tag };
  const TypeIcon = typeMeta.icon;
  const maxQuantity = useMemo(() => getMaxProductQuantity(product), [product]);

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
        className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/60 dark:hover:shadow-[0_18px_40px_-15px_rgba(139,92,246,0.4)]"
      >
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
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

          <StockIndicator visible={Boolean(product.stock_visibility)} deliveryType={product.delivery_type} />

          <div className="flex items-end justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {hasDiscount ? (
                <div className="text-[11px] font-bold text-slate-400 line-through dark:text-slate-500">{formatPrice(basePrice)} ₺</div>
              ) : null}
              <div className="text-xl font-black leading-none text-emerald-600 dark:text-emerald-400">
                {formatPrice(currentPrice)} ₺
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/60 dark:hover:shadow-[0_18px_40px_-15px_rgba(139,92,246,0.4)]">
      <div className="relative flex flex-col sm:flex-row">
        <Link to={href} className="h-36 w-full bg-slate-50 dark:bg-slate-950 sm:h-auto sm:w-[210px] sm:flex-shrink-0 lg:w-[230px]">
          <div className="flex h-full w-full items-center justify-start px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
            {product.cover_image ? (
              <img
                src={product.cover_image}
                alt={product.title}
                className="h-full w-full object-contain object-left transition-transform duration-500 group-hover:scale-[1.02]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full min-h-[140px] w-full items-center justify-center text-slate-300 dark:text-slate-700">
                <Boxes size={46} />
              </div>
            )}
          </div>
        </Link>

        <div className="flex flex-1 flex-col justify-between gap-2.5 p-3.5 sm:p-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
              <TypeIcon size={12} />
              <span>{typeMeta.label}</span>
            </div>

            <Link to={href}>
              <h3 className="mt-2 line-clamp-2 text-base font-black leading-tight text-slate-900 transition-colors hover:text-violet-600 dark:text-white dark:hover:text-violet-300 sm:text-lg">
                {product.title}
              </h3>
            </Link>

            <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
              {product.short_description || product.description || 'Detaylı açıklama ürün sayfasında yer alır.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StockIndicator visible={Boolean(product.stock_visibility)} deliveryType={product.delivery_type} />
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white px-3.5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:flex sm:min-w-[270px] sm:flex-col sm:justify-center sm:border-l sm:border-t-0 sm:px-4 lg:min-w-[290px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {hasDiscount ? (
                  <div className="text-sm font-bold text-slate-400 line-through dark:text-slate-500">{formatPrice(basePrice)} ₺</div>
                ) : null}
                <div className="text-2xl font-black leading-none text-emerald-600 dark:text-emerald-400 sm:text-[28px]">
                  {formatPrice(currentPrice)} ₺
                </div>
              </div>
              <DiscountChip price={basePrice} salePrice={product.sale_price} />
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-950/70">
                <button
                  type="button"
                  onClick={decrement}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-[24px] text-center text-sm font-extrabold text-slate-900 dark:text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={increment}
                  disabled={Boolean(maxQuantity) && quantity >= maxQuantity}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-md transition-all duration-300 hover:bg-violet-700 hover:shadow-lg"
              >
                <ShoppingCart size={14} strokeWidth={3} /> Sepete Ekle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
