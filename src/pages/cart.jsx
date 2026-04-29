import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { useCart } from '../context/useCart';
import { useAuth } from '../context/useAuth';
import { createOrder } from '../lib/api';
import useSiteBrand from '../hooks/useSiteBrand';

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

export default function CartPage() {
  const { cart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount, showToast } = useCart();
  const { user, refreshUser } = useAuth();
  const { defaultListingImage } = useSiteBrand();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const balance = Number(user?.balance || 0);
  const hasEnoughBalance = !user || balance >= cartTotal;

  const decreaseQuantity = (item) => {
    const quantity = Number(item.quantity || 1);
    if (quantity <= 1) {
      removeFromCart(item.cartId);
      return;
    }
    updateCartQuantity(item.cartId, quantity - 1);
  };

  const increaseQuantity = (item) => {
    const quantity = Number(item.quantity || 1);
    if (item.maxQuantity && quantity >= Number(item.maxQuantity)) return;
    updateCartQuantity(item.cartId, quantity + 1);
  };

  const handleCheckout = async () => {
    if (!user) {
      showToast('Ödeme için giriş yapın.');
      navigate('/login');
      return;
    }
    if (Number(user.balance) < cartTotal) {
      showToast('Yetersiz bakiye.');
      return;
    }

    setProcessing(true);
    try {
      const items = cart.flatMap((item) => {
        const quantity = Math.max(1, Number(item.quantity || 1));
        const payload = item.itemType === 'product'
          ? { product_id: item.product_id || item.id }
          : { listing_id: item.listing_id || item.id };
        return Array.from({ length: quantity }, () => payload);
      });

      await createOrder(items);
      clearCart();
      await refreshUser();
      showToast('Sipariş tamamlandı.');
      navigate('/profile');
    } catch (error) {
      showToast(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative px-6 py-16 text-center sm:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(124,58,237,0.16),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.12),transparent_30%)]" />
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-200">
              <ShoppingCart size={30} />
            </div>
            <h1 className="relative mt-5 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
              Sepetin boş
            </h1>
            <p className="relative mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              Pazar ve site ürünlerinden güvenli alışverişe başlamak için sepetine ürün ekleyebilirsin.
            </p>
            <button
              type="button"
              onClick={() => navigate('/market')}
              className="relative mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200/60 transition hover:-translate-y-0.5 dark:shadow-none"
            >
              <ShoppingBag size={17} /> Alışverişe Başla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-black text-slate-400 transition hover:text-violet-600 dark:hover:text-violet-300"
          >
            <ArrowLeft size={14} /> Geri
          </button>
          <h1 className="flex items-center gap-3 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-200">
              <ShoppingCart size={23} />
            </span>
            Sepetim
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {cartCount} adet ürün, güvenli ödeme için hazır.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/60">
            <PackageCheck className="mx-auto text-violet-500 dark:text-violet-300" size={19} />
            <div className="mt-1 text-[11px] font-black text-slate-700 dark:text-slate-200">Kontrollü</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/60">
            <ShieldCheck className="mx-auto text-cyan-500 dark:text-cyan-300" size={19} />
            <div className="mt-1 text-[11px] font-black text-slate-700 dark:text-slate-200">Güvenli</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-950/60">
            <Zap className="mx-auto text-fuchsia-500 dark:text-fuchsia-300" size={19} />
            <div className="mt-1 text-[11px] font-black text-slate-700 dark:text-slate-200">Hızlı</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-3">
          {cart.map((item) => {
            const quantity = Number(item.quantity || 1);
            const lineTotal = Number(item.price || 0) * quantity;
            const isProduct = item.itemType === 'product';
            const canIncrease = !item.maxQuantity || quantity < Number(item.maxQuantity);
            const imageSrc = item.image || (isProduct ? defaultListingImage : '');

            return (
              <article
                key={item.cartId}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-violet-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/40"
              >
                <div className="grid gap-4 p-4 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center">
                  <Link to={item.path || '#'} className="relative aspect-[3/2] w-28 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 sm:w-[88px]">
                    {imageSrc ? (
                      <img src={imageSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-black text-slate-400">OK</div>
                    )}
                  </Link>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${isProduct ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200' : 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200'}`}>
                        {isProduct ? 'Site Ürünü' : 'İlan'}
                      </span>
                    </div>
                    <Link to={item.path || '#'}>
                      <h2 className="mt-2 line-clamp-2 text-base font-black leading-snug text-slate-950 transition hover:text-violet-600 dark:text-white dark:hover:text-violet-300">
                        {item.title}
                      </h2>
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {item.seller ? <span>Satıcı: {item.seller}</span> : null}
                      {item.path ? (
                        <Link to={item.path} className="font-black text-violet-600 hover:underline dark:text-violet-300">
                          Ürüne git
                        </Link>
                      ) : null}
                    </div>

                    {isProduct ? (
                      <div className="mt-4 inline-grid h-10 grid-cols-[40px_64px_40px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/70">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item)}
                          className="flex items-center justify-center border-r border-slate-200 text-slate-700 transition hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                          aria-label="Adedi azalt"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="flex items-center justify-center text-sm font-black text-slate-950 dark:text-white">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => increaseQuantity(item)}
                          disabled={!canIncrease}
                          className="flex items-center justify-center border-l border-slate-200 text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 dark:disabled:text-slate-600"
                          aria-label="Adedi artır"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-end justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">Birim</div>
                      <div className="text-sm font-black text-slate-700 dark:text-slate-200">{formatMoney(item.price)}</div>
                      <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-300">{formatMoney(lineTotal)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartId)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                    >
                      <Trash2 size={14} /> Kaldır
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/60">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-950 dark:text-white">
                <CreditCard size={19} className="text-violet-500" /> Sipariş Özeti
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ödeme bakiyenden anında tahsil edilir.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Ürün adedi</span>
                  <span className="font-black text-slate-900 dark:text-white">{cartCount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Ara toplam</span>
                  <span className="font-black text-slate-900 dark:text-white">{formatMoney(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Hizmet bedeli</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-300">Ücretsiz</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-4 text-white dark:bg-black/40">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-300">Toplam</span>
                  <span className="text-2xl font-black">{formatMoney(cartTotal)}</span>
                </div>
                {user ? (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-white/8 px-3 py-2 text-xs font-bold">
                    <span className="text-slate-300">Bakiyen</span>
                    <span className={hasEnoughBalance ? 'text-emerald-300' : 'text-rose-300'}>{formatMoney(balance)}</span>
                  </div>
                ) : null}
              </div>

              {!hasEnoughBalance ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                  Bakiyen bu sipariş için yetersiz.
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={processing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200/60 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-none"
              >
                {processing ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <CheckCircle2 size={19} /> Ödemeyi Tamamla
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <ShieldCheck size={18} className="text-cyan-500" />
                  <div className="mt-2 text-[11px] font-black text-slate-700 dark:text-slate-200">Güvenli ödeme</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <Sparkles size={18} className="text-violet-500" />
                  <div className="mt-2 text-[11px] font-black text-slate-700 dark:text-slate-200">Hızlı işlem</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
