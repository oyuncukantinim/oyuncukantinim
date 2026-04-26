import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Clock3,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react';
import { getProduct, idFromSlug, productSlug } from '../lib/api';
import { useCart } from '../context/CartContext';

const PRODUCT_TYPE_LABELS = {
  digital_code: 'Dijital Kod',
  account: 'Hesap',
  item: 'Item / Paket',
  service: 'Servis',
};

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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  if (!product) return null;

  const currentPrice = Number(product.current_price ?? product.sale_price ?? product.price ?? 0);
  const basePrice = Number(product.price ?? 0);
  const hasDiscount = product.sale_price && Number(product.sale_price) > 0 && Number(product.sale_price) < basePrice;
  const isUnavailable = product.status !== 'active' || (product.delivery_type === 'automatic' && Number(product.is_in_stock) !== 1);
  const currentImage = images[activeImage] || product.cover_image || '';

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
    <div className="mx-auto max-w-[1180px] space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-slate-100 hover:text-violet-600">
          <ChevronLeft size={14} /> Geri
        </button>
        <span>/</span>
        <Link to="/categories" className="hover:text-violet-600">Kategoriler</Link>
        {product.category_name ? (
          <>
            <span>/</span>
            <Link to={product.category_id ? `/categories/${product.category_slug}-${product.category_id}` : '/categories'} className="hover:text-violet-600">
              {product.category_name}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <span className="text-slate-700">{product.title}</span>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.1fr_minmax(0,0.9fr)]">
          <div className="space-y-3 p-4 sm:p-6">
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-100 via-slate-50 to-cyan-50">
              {currentImage ? (
                <img src={currentImage} alt={product.title} className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center text-slate-400">
                  <Boxes size={56} />
                </div>
              )}
            </div>
            {images.length > 1 ? (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`overflow-hidden rounded-2xl border-2 transition-all ${
                      index === activeImage ? 'border-violet-500 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="border-t border-slate-100 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-emerald-200">
                <ShieldCheck size={12} /> Site Urunu
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white/70">
                <BadgeCheck size={12} /> {PRODUCT_TYPE_LABELS[product.product_type] || 'Urun'}
              </span>
              {product.badge_text ? (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white">
                  {product.badge_text}
                </span>
              ) : null}
            </div>

            <h1 className="mt-5 text-3xl font-black leading-tight">{product.title}</h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-white/68">
              {product.short_description || product.description || 'Bu resmi urun icin aciklama yakinda burada gorunecek.'}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-wide text-white/35">Teslimat</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-white/85">
                  {product.delivery_type === 'automatic' ? <PackageCheck size={16} /> : <Clock3 size={16} />}
                  {product.delivery_type === 'automatic' ? 'Aninda Teslim' : (product.estimated_delivery_text || 'Manuel Teslim')}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-wide text-white/35">Stok</div>
                <div className="mt-2 text-sm font-bold text-white/85">
                  {product.stock_visibility
                    ? (product.delivery_type === 'manual' ? 'Stok bilgisi gizli' : `${Number(product.available_stock_count || 0)} aktif stok`)
                    : 'Stok gizli'}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  {hasDiscount ? <div className="text-sm font-bold text-white/30 line-through">{basePrice.toFixed(2)} ₺</div> : null}
                  <div className="text-4xl font-black text-emerald-300">{currentPrice.toFixed(2)} ₺</div>
                </div>
                <div className="text-right text-xs font-bold text-white/45">
                  <div>Kategori</div>
                  <div className="mt-1 text-sm text-white/80">{product.category_name || 'Kategori'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={addProductToCart}
                disabled={isUnavailable}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-white/55"
              >
                <ShoppingCart size={17} />
                {isUnavailable ? 'Su anda satin alinabilir degil' : 'Sepete Ekle'}
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/70">
              {product.description || 'Teslimat ve urun detaylari odeme sonrasinda siparis akisinda goruntulenir.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
