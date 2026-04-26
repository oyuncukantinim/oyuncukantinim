import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, Clock3, PackageCheck, ShieldCheck, Sparkles } from 'lucide-react';
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
    <article className="group relative overflow-hidden rounded-[30px] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(6,11,24,0.98),rgba(20,13,42,0.96)_58%,rgba(7,40,60,0.94))] shadow-[0_24px_60px_rgba(5,10,24,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-[0_28px_70px_rgba(4,12,34,0.48)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-fuchsia-500/12 blur-3xl" />
      </div>

      <Link to={href} className="relative flex h-full flex-col lg:flex-row">
        <div className="relative overflow-hidden border-b border-white/8 bg-slate-950/70 lg:min-h-[270px] lg:w-[340px] lg:flex-shrink-0 lg:border-b-0 lg:border-r lg:border-white/8">
          {product.cover_image ? (
            <img src={product.cover_image} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          ) : (
            <div className="flex h-full min-h-[240px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.28),transparent_42%),linear-gradient(145deg,rgba(11,18,32,1),rgba(37,19,66,1))] text-cyan-100/45">
              <Boxes size={54} />
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.1),rgba(2,6,23,0.18)_40%,rgba(2,6,23,0.78))]" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/25 bg-slate-950/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200 backdrop-blur-sm">
              <ShieldCheck size={11} /> Resmi Satis
            </span>
            {product.badge_text ? (
              <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-100 backdrop-blur-sm">
                {product.badge_text}
              </span>
            ) : null}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm">
              <Sparkles size={11} />
              {PRODUCT_TYPE_LABELS[product.product_type] || 'Urun'}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-stretch lg:gap-5">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/55">
              <span>{product.category_name || 'Kategori'}</span>
              <span className="text-white/25">•</span>
              <span>{product.delivery_type === 'automatic' ? 'Instant Lane' : 'Manual Lane'}</span>
            </div>

            <h3 className="mt-3 text-2xl font-black leading-tight text-white transition-colors group-hover:text-cyan-200">
              {product.title}
            </h3>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-300/78">
              {product.short_description || product.description || 'Bu resmi urun icin detayli aciklama yakinda burada gorunecek.'}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Teslimat Modu</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-white/88">
                  {product.delivery_type === 'automatic' ? <PackageCheck size={14} className="text-emerald-300" /> : <Clock3 size={14} className="text-amber-300" />}
                  {deliveryText}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Stok Bilgisi</div>
                <div className="mt-2 text-sm font-bold text-white/88">{stockText}</div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col justify-between rounded-[26px] border border-cyan-300/12 bg-black/20 p-4 backdrop-blur-sm lg:w-[250px]">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/38">Satin Alma Paneli</div>
              <div className="mt-4">
                {hasDiscount ? (
                  <div className="text-sm font-bold text-white/25 line-through">{Number(product.price || 0).toFixed(2)} ₺</div>
                ) : null}
                <div className="text-4xl font-black text-emerald-300">{currentPrice.toFixed(2)} ₺</div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/8 bg-white/5 px-3.5 py-3 text-xs font-bold leading-6 text-white/70">
                Siparis sonrasinda urun detay sayfasindan ya da profilindeki satin alimlardan teslimatini yonetebilirsin.
              </div>
              <span className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#22d3ee,#7c3aed)] px-4 py-3 text-sm font-black text-slate-950 shadow-[0_14px_34px_rgba(34,211,238,0.28)] transition-transform duration-300 group-hover:translate-x-0.5">
                Urunu Incele
                <ArrowRight size={15} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
