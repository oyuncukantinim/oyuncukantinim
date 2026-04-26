import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Flame,
  Package,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import { productSlug } from '../lib/api';

// Tactical-gaming aesthetic for first-party products. Deliberately darker /
// neon to stand apart from the lighter, friendlier user-listing cards so the
// "this is sold by the site, official, instant delivery" trust signal is
// visually unmistakable.

const PRODUCT_TYPE_META = {
  digital_code: { label: 'Dijital Kod', icon: Tag },
  account: { label: 'Hesap', icon: User },
  item: { label: 'Item / Paket', icon: Package },
  service: { label: 'Servis', icon: Wrench },
};

function formatPrice(value) {
  return Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StockBar({ count, visible, deliveryType }) {
  if (!visible) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
        <Boxes size={11} /> Stok Gizli
      </span>
    );
  }
  if (deliveryType === 'manual') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
        <Clock3 size={11} /> Manuel
      </span>
    );
  }
  const stock = Number(count || 0);
  const filled = Math.max(0, Math.min(5, Math.ceil(stock / 20))); // 0..5 cells
  const tone = stock > 50 ? 'cyan' : stock > 10 ? 'amber' : 'rose';
  const cellColor = {
    cyan: 'bg-gradient-to-r from-cyan-400 to-emerald-400',
    amber: 'bg-gradient-to-r from-amber-400 to-orange-500',
    rose: 'bg-gradient-to-r from-rose-500 to-red-500',
  }[tone];
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/85">
      <span className="flex items-center gap-[2px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-1 rounded-[1px] ${i < filled ? cellColor : 'bg-white/10'}`}
          />
        ))}
      </span>
      {stock} stok
    </span>
  );
}

function InstantBadge({ delivery, estimated }) {
  if (delivery === 'automatic') {
    return (
      <span className="relative inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-emerald-400 to-cyan-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.45)]">
        <Zap size={11} strokeWidth={3} /> Anında Teslim
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">
      <Clock3 size={11} strokeWidth={3} /> {estimated || 'Manuel'}
    </span>
  );
}

function DiscountChip({ price, salePrice }) {
  if (!salePrice || Number(salePrice) <= 0 || Number(salePrice) >= Number(price || 0)) return null;
  const pct = Math.round((1 - Number(salePrice) / Number(price)) * 100);
  if (pct <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-br from-rose-500 to-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_4px_14px_rgba(244,63,94,0.55)]">
      <Flame size={11} strokeWidth={3} /> -{pct}%
    </span>
  );
}

export default function ProductCard({ product, compact = false }) {
  const href = product.product_path ? `/product/${product.product_path}` : productSlug(product.title, product.id);
  const currentPrice = Number(product.current_price ?? product.sale_price ?? product.price ?? 0);
  const basePrice = Number(product.price ?? 0);
  const hasDiscount = product.sale_price && Number(product.sale_price) > 0 && Number(product.sale_price) < basePrice;
  const typeMeta = PRODUCT_TYPE_META[product.product_type] || { label: 'Ürün', icon: Tag };
  const TypeIcon = typeMeta.icon;

  // ─────────────── COMPACT (grid tile) ───────────────
  if (compact) {
    return (
      <Link
        to={href}
        className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:ring-cyan-400/60 hover:shadow-[0_20px_50px_-15px_rgba(6,182,212,0.45)]"
      >
        {/* Animated neon edge on hover */}
        <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: 'linear-gradient(120deg, transparent 30%, rgba(6,182,212,0.18) 50%, transparent 70%)',
          }}
        />

        {/* Image */}
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-slate-950">
          {product.cover_image ? (
            <img
              src={product.cover_image}
              alt={product.title}
              className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-600">
              <Boxes size={42} />
            </div>
          )}
          {/* Bottom-up gradient for legibility */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

          {/* Top-left badges */}
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            <InstantBadge delivery={product.delivery_type} estimated={product.estimated_delivery_text} />
            <DiscountChip price={basePrice} salePrice={product.sale_price} />
          </div>

          {/* Top-right "Site Ürünü" stamp */}
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-slate-950/85 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300 backdrop-blur">
            <ShieldCheck size={10} strokeWidth={3} /> Resmi
          </span>

          {/* Custom badge text */}
          {product.badge_text ? (
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-violet-600/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg">
              <Sparkles size={10} strokeWidth={3} /> {product.badge_text}
            </span>
          ) : null}
        </div>

        {/* Body */}
        <div className="space-y-3 p-3.5">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300/85">
            <TypeIcon size={11} />
            <span>{typeMeta.label}</span>
            {product.category_name ? (
              <>
                <span className="text-white/20">•</span>
                <span className="truncate text-white/55">{product.category_name}</span>
              </>
            ) : null}
          </div>

          <h3 className="line-clamp-2 min-h-[2.5em] text-sm font-black leading-snug text-white transition-colors group-hover:text-cyan-300">
            {product.title}
          </h3>

          <StockBar
            count={product.available_stock_count}
            visible={Boolean(product.stock_visibility)}
            deliveryType={product.delivery_type}
          />

          {/* Price + CTA */}
          <div className="flex items-end justify-between gap-2 pt-1">
            <div>
              {hasDiscount ? (
                <div className="text-[11px] font-bold text-white/35 line-through">{formatPrice(basePrice)} ₺</div>
              ) : null}
              <div className="bg-gradient-to-r from-cyan-300 via-cyan-300 to-emerald-300 bg-clip-text text-xl font-black leading-none text-transparent">
                {formatPrice(currentPrice)} ₺
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/80 ring-1 ring-white/10 transition-all group-hover:bg-cyan-400 group-hover:text-slate-950 group-hover:ring-cyan-300">
              İncele <ArrowRight size={11} strokeWidth={3} />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // ─────────────── EXPANDED (epin/row style) ───────────────
  return (
    <Link
      to={href}
      className="group relative block overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:ring-cyan-400/60 hover:shadow-[0_20px_50px_-15px_rgba(6,182,212,0.45)] sm:rounded-[20px]"
    >
      {/* Subtle scan-line pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)',
        }}
      />

      {/* Diagonal neon accent on the leading edge */}
      <span className="pointer-events-none absolute -left-px top-0 bottom-0 w-[3px] bg-gradient-to-b from-cyan-400 via-violet-400 to-emerald-400 opacity-50 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex flex-col gap-0 sm:flex-row">
        {/* IMAGE COLUMN */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-950 sm:h-auto sm:w-[200px] sm:flex-shrink-0 lg:w-[230px]">
          {product.cover_image ? (
            <img
              src={product.cover_image}
              alt={product.title}
              className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full min-h-[170px] w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-600">
              <Boxes size={50} />
            </div>
          )}
          {/* Edge fade into card body */}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-r from-transparent to-slate-900/90 sm:block" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900 to-transparent sm:hidden" />

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <InstantBadge delivery={product.delivery_type} estimated={product.estimated_delivery_text} />
            <DiscountChip price={basePrice} salePrice={product.sale_price} />
          </div>
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-slate-950/85 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300 backdrop-blur">
            <ShieldCheck size={10} strokeWidth={3} /> Resmi
          </span>
        </div>

        {/* CONTENT COLUMN */}
        <div className="relative flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/85">
              <TypeIcon size={12} />
              <span>{typeMeta.label}</span>
              {product.category_name ? (
                <>
                  <span className="text-white/25">•</span>
                  <span className="text-white/60">{product.category_name}</span>
                </>
              ) : null}
              {product.badge_text ? (
                <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-black tracking-[0.14em] text-violet-200 ring-1 ring-violet-400/30">
                  <Sparkles size={10} strokeWidth={3} /> {product.badge_text}
                </span>
              ) : null}
            </div>

            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-tight text-white transition-colors group-hover:text-cyan-300 sm:text-xl">
              {product.title}
            </h3>

            <p className="mt-1.5 line-clamp-2 max-w-2xl text-xs font-semibold leading-5 text-white/55 sm:text-[13px]">
              {product.short_description || product.description || 'Bu resmi ürün için detaylı açıklama yakında burada görünecek.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StockBar
              count={product.available_stock_count}
              visible={Boolean(product.stock_visibility)}
              deliveryType={product.delivery_type}
            />
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
              <CheckCircle2 size={11} strokeWidth={3} /> Garantili
            </span>
          </div>
        </div>

        {/* PRICE / CTA COLUMN */}
        <div className="relative flex flex-row items-center justify-between gap-3 border-t border-white/10 bg-gradient-to-br from-slate-950/60 via-slate-950 to-black/80 p-4 sm:flex-col sm:items-end sm:border-l sm:border-t-0 sm:p-5 lg:min-w-[200px]">
          <div className="flex flex-col items-start sm:items-end">
            {hasDiscount ? (
              <div className="text-xs font-bold text-white/30 line-through">{formatPrice(basePrice)} ₺</div>
            ) : null}
            <div className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-2xl font-black leading-none text-transparent sm:text-[28px]">
              {formatPrice(currentPrice)} ₺
            </div>
            <div className="mt-1 hidden text-[10px] font-black uppercase tracking-[0.2em] text-white/40 sm:block">
              KDV dahil
            </div>
          </div>

          <span className="relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_8px_25px_-8px_rgba(34,211,238,0.65)] transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-[0_16px_40px_-12px_rgba(34,211,238,0.85)] sm:w-full">
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">Satın Al</span>
            <ArrowRight size={13} strokeWidth={3} className="relative" />
          </span>
        </div>
      </div>
    </Link>
  );
}
