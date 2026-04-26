import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../lib/api';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, cartTotal, showToast } = useCart();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      showToast('Odeme icin giris yapin.');
      navigate('/login');
      return;
    }
    if (Number(user.balance) < cartTotal) {
      showToast('Yetersiz bakiye.');
      return;
    }

    setProcessing(true);
    try {
      const items = cart.map((item) => (
        item.itemType === 'product'
          ? { product_id: item.product_id || item.id }
          : { listing_id: item.listing_id || item.id }
      ));
      await createOrder(items);
      clearCart();
      await refreshUser();
      showToast('Siparis tamamlandi.');
      navigate('/profile');
    } catch (error) {
      showToast(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="flex items-center gap-3 text-3xl font-extrabold text-gray-800">
        <ShoppingCart className="text-neon-purple" size={32} /> Sepetim
      </h1>

      {cart.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="mb-4 text-6xl">🛒</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-700">Sepetin bos</h2>
          <p className="mb-6 text-gray-400">Pazara goz atarak sepetini doldurabilirsin.</p>
          <button onClick={() => navigate('/market')} className="btn-primary">Alisverise Basla</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {cart.map((item) => (
              <div key={item.cartId} className="card flex items-center gap-4 p-4">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-surface-100">
                  {item.image && typeof item.image === 'string' && item.image.startsWith('http') ? (
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">🎮</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-bold text-gray-800">{item.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${item.itemType === 'product' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}>
                      {item.itemType === 'product' ? 'Site Urunu' : 'Ilan'}
                    </span>
                  </div>
                  {item.seller ? <p className="mt-1 text-xs text-gray-400">Satici: {item.seller}</p> : null}
                  {item.path ? (
                    <Link to={item.path} className="mt-2 inline-flex text-xs font-bold text-violet-600 hover:underline">
                      Urune git
                    </Link>
                  ) : null}
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="font-extrabold text-neon-green">{Number(item.price || 0).toFixed(2)} ₺</div>
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="mt-2 flex items-center justify-end gap-1 text-sm text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} /> Kaldir
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-20 p-6">
              <h3 className="mb-6 text-xl font-bold text-gray-800">Siparis Ozeti</h3>
              <div className="mb-6 space-y-3 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Urunler ({cart.length})</span>
                  <span className="font-bold text-gray-800">{cartTotal.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span>Hizmet Bedeli</span>
                  <span className="font-bold text-neon-green">Ucretsiz</span>
                </div>
                <hr className="my-4 border-gray-100" />
                <div className="flex justify-between text-lg">
                  <span className="font-extrabold text-gray-800">Toplam</span>
                  <span className="font-extrabold text-neon-purple">{cartTotal.toFixed(2)} ₺</span>
                </div>
                {user ? (
                  <div className="flex justify-between pt-2 text-xs">
                    <span>Bakiyen</span>
                    <span className={Number(user.balance) >= cartTotal ? 'text-neon-green' : 'text-red-500'}>
                      {Number(user.balance).toFixed(2)} ₺
                    </span>
                  </div>
                ) : null}
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <CheckCircle2 size={20} /> Odemeyi Tamamla
                  </>
                )}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck size={14} /> %100 Guvenli Odeme
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
