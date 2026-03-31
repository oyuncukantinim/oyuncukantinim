import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../lib/api';
import { useState } from 'react';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, cartTotal, showToast } = useCart();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      showToast('Odeme yapmak icin giris yapin!');
      navigate('/login');
      return;
    }

    if (Number(user.balance) < cartTotal) {
      showToast('Yetersiz bakiye! Lutfen bakiye yukleyin.');
      return;
    }

    setProcessing(true);
    try {
      const items = cart.map(item => {
        if (item.itemType === 'listing') return { listing_id: item.listing_id };
        return { epin_id: item.epin_id };
      });

      await createOrder(items);
      clearCart();
      await refreshUser();
      showToast('Siparisiniz basariyla tamamlandi!');
      navigate('/profile');
    } catch (err) {
      showToast(err.message || 'Siparis olusturulamadi.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-extrabold flex items-center gap-3">
        <ShoppingCart className="text-neon-purple" size={32} /> Sepetim
      </h1>

      {cart.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-2">Sepetin bos!</h2>
          <p className="text-gray-500 mb-6">Hemen magazayi veya pazari gezerek sepetini doldurabilirsin.</p>
          <button onClick={() => navigate('/store')} className="btn-primary">
            Alisverise Basla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.cartId} className="card p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-dark-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {item.image || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-neon-purple mb-1">{item.game}</div>
                  <h3 className="font-bold text-white truncate">{item.title}</h3>
                  {item.seller && <p className="text-xs text-gray-500 mt-1">Satici: {item.seller}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-extrabold text-neon-green">{item.price.toFixed(2)} ₺</div>
                  <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 justify-end mt-2 transition-colors">
                    <Trash2 size={14} /> Kaldir
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20">
              <h3 className="text-xl font-bold mb-6">Siparis Ozeti</h3>
              <div className="space-y-3 text-sm text-gray-400 mb-6">
                <div className="flex justify-between">
                  <span>Urunler ({cart.length})</span>
                  <span className="font-bold text-white">{cartTotal.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span>Hizmet Bedeli</span>
                  <span className="font-bold text-neon-green">Ucretsiz</span>
                </div>
                <hr className="border-white/5 my-4" />
                <div className="flex justify-between text-lg">
                  <span className="font-extrabold text-white">Toplam</span>
                  <span className="font-extrabold text-neon-green">{cartTotal.toFixed(2)} ₺</span>
                </div>
                {user && (
                  <div className="flex justify-between text-xs pt-2">
                    <span>Bakiyen</span>
                    <span className={Number(user.balance) >= cartTotal ? 'text-neon-green' : 'text-red-400'}>
                      {Number(user.balance).toFixed(2)} ₺
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleCheckout}
                disabled={processing}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={20} /> Odemeyi Tamamla
                  </>
                )}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
                <ShieldCheck size={14} /> %100 Guvenli Odeme
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
