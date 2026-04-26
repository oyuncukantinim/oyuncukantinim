import { Link } from 'react-router-dom';
import { BadgeCheck, Boxes, Clock3, PackageCheck, ShieldCheck } from 'lucide-react';
import { productSlug } from '../lib/api';

const PRODUCT_TYPE_LABELS = {
  digital_code: 'Dijital Kod',
  account: 'Hesap',
  item: 'Item / Paket',
  service: 'Servis',
};

export default function ProductCard({ product, compact = false }) {
  const href = product.product_path ? `/product/${product.product_path}` : productSlug(product.title, product.id);
  const currentPrice = Number(product.current_price ?? product.sale_price ?? product.price ?? 0);
  const hasDiscount = product.sale_price && Number(product.sale_price) > 0 && Number(product.sale_price) < Number(product.price || 0);

  if (compact) {
    return (
      <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
        <Link to={href} className="flex h-full flex-col">
          <div className="relative overflow-hidden bg-slate-100">
            {product.cover_image ? (
              <img src={product.cover_image} alt={product.title} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 text-slate-400">
                <Boxes size={26} />
              </div>
            )}
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                <ShieldCheck size={11} /> Site Urunu
              </span>
              {product.badge_text ? <span className="rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-black text-white">{product.badge_text}</span> : null}
            </div>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wide text-slate-400">
              <span>{product.category_name || 'Kategori'}</span>
              <span>•</span>
              <span>{PRODUCT_TYPE_LABELS[product.product_type] || 'Urun'}</span>
            </div>
            <div>
              <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-violet-600">
                {product.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">
                {product.short_description || product.description || 'Resmi urun aciklamasi yakinda burada gorunur.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                {product.delivery_type === 'automatic' ? <PackageCheck size={12} /> : <Clock3 size={12} />}
                {product.delivery_type === 'automatic' ? 'Aninda Teslim' : (product.estimated_delivery_text || 'Manuel Teslim')}
              </span>
              {product.stock_visibility ? (
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
                  {Number(product.available_stock_count || 0)} stok
                </span>
              ) : null}
            </div>
            <div className="flex items-end justify-between gap-3 pt-2">
              <div>
                {hasDiscount ? <div className="text-xs font-bold text-slate-300 line-through">{Number(product.price || 0).toFixed(2)} ₺</div> : null}
                <div className="text-xl font-black text-emerald-600">{currentPrice.toFixed(2)} ₺</div>
              </div>
              <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                Detay
                <BadgeCheck size={13} />
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group h-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <Link to={href} className="flex h-full flex-col">
        <div className="relative overflow-hidden bg-slate-100">
          {product.cover_image ? (
            <img src={product.cover_image} alt={product.title} className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-cyan-100 text-slate-400">
              <Boxes size={38} />
            </div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/92 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 shadow-sm">
              <ShieldCheck size={11} /> Resmi Satis
            </span>
            {product.badge_text ? (
              <span className="rounded-full bg-slate-950/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
                {product.badge_text}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              <span>{product.category_name || 'Kategori'}</span>
              <span>•</span>
              <span>{PRODUCT_TYPE_LABELS[product.product_type] || 'Urun'}</span>
            </div>
            <h3 className="line-clamp-2 text-lg font-black leading-snug text-slate-900 transition-colors group-hover:text-violet-600">
              {product.title}
            </h3>
            <p className="line-clamp-3 text-sm font-semibold leading-6 text-slate-500">
              {product.short_description || product.description || 'Bu site urunu icin detayli aciklama yakinda burada gorunecek.'}
            </p>
          </div>

          <div className="mt-auto space-y-3">
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                {product.delivery_type === 'automatic' ? <PackageCheck size={12} /> : <Clock3 size={12} />}
                {product.delivery_type === 'automatic' ? 'Aninda Teslim' : (product.estimated_delivery_text || 'Manuel Teslim')}
              </span>
              {product.stock_visibility ? (
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
                  {Number(product.available_stock_count || 0)} aktif stok
                </span>
              ) : null}
            </div>
            <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
              <div>
                {hasDiscount ? <div className="text-xs font-bold text-slate-300 line-through">{Number(product.price || 0).toFixed(2)} ₺</div> : null}
                <div className="text-2xl font-black text-emerald-600">{currentPrice.toFixed(2)} ₺</div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3.5 py-2.5 text-xs font-black text-white">
                Urunu Incele
                <BadgeCheck size={13} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
