import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, Clock3, PackageCheck, ShieldCheck } from 'lucide-react';
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
  const stockText = product.stock_visibility
    ? (product.delivery_type === 'manual' ? 'Stok bilgisi siparis sirasinda gorunur' : `${Number(product.available_stock_count || 0)} aktif stok`)
    : 'Stok gizli';
  const deliveryText = product.delivery_type === 'automatic'
    ? 'Aninda teslim edilir'
    : (product.estimated_delivery_text || 'Manuel teslim sureci');

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
                <ArrowRight size={13} />
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg">
      <Link to={href} className="flex flex-col lg:flex-row">
        <div className="relative border-b border-slate-100 bg-slate-100 lg:h-[170px] lg:w-[200px] lg:flex-shrink-0 lg:border-b-0 lg:border-r">
          {product.cover_image ? (
            <img src={product.cover_image} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[170px] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
              <Boxes size={38} />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 shadow-sm">
              <ShieldCheck size={11} /> Resmi
            </span>
            {product.badge_text ? (
              <span className="rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                {product.badge_text}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              <span>{product.category_name || 'Kategori'}</span>
              <span>•</span>
              <span>{PRODUCT_TYPE_LABELS[product.product_type] || 'Urun'}</span>
            </div>

            <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug text-slate-900 transition-colors group-hover:text-violet-600">
              {product.title}
            </h3>

            <p className="mt-2 line-clamp-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              {product.short_description || product.description || 'Bu resmi urun icin detayli aciklama yakinda burada gorunecek.'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {product.delivery_type === 'automatic' ? <PackageCheck size={12} /> : <Clock3 size={12} />}
                {deliveryText}
              </span>
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                {stockText}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 lg:w-[210px] lg:flex-shrink-0">
            <div>
              {hasDiscount ? (
                <div className="text-xs font-bold text-slate-300 line-through">{Number(product.price || 0).toFixed(2)} ₺</div>
              ) : null}
              <div className="text-3xl font-black text-emerald-600">{currentPrice.toFixed(2)} ₺</div>
            </div>
            <div className="text-[11px] font-semibold leading-5 text-slate-500">
              Profilindeki satin alimlardan teslimat detaylarini takip edebilirsin.
            </div>
            <span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition-colors group-hover:bg-violet-600">
              Urunu Incele
              <ArrowRight size={15} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
