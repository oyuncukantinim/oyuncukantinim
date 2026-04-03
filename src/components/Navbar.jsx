import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Store, Users, ShoppingCart, Menu, X, Bell, MessageCircle, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getUnreadNotificationsCount, markNotificationsRead } from '../lib/api';

const NAV_LINKS = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/store', label: 'E-Pin', icon: Store },
  { to: '/market', label: 'Pazar', icon: Users },
  { to: '/categories', label: 'Kategoriler' },
];

export default function Navbar() {
  const { user } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [cartHover, setCartHover] = useState(false);
  const cartTimeout = useRef(null);

  useEffect(() => {
    if (!user) { setUnreadNotif(0); return; }
    const fetchCount = () => {
      getUnreadNotificationsCount()
        .then(r => setUnreadNotif(r.data?.unread ?? 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    // Listen for notifications-read event (dispatched by notifications page)
    const handler = () => setUnreadNotif(0);
    window.addEventListener('notifications-read', handler);
    return () => { clearInterval(interval); window.removeEventListener('notifications-read', handler); };
  }, [user]);

  // Bildirimler sayfasına gelindiğinde sayacı sıfırla ve DB'de okundu olarak işaretle
  useEffect(() => {
    if (location.pathname === '/notifications' && user) {
      setUnreadNotif(0);
      markNotificationsRead().catch(() => {});
    }
  }, [location.pathname, user]);

  const handleCartEnter = () => {
    clearTimeout(cartTimeout.current);
    setCartHover(true);
  };
  const handleCartLeave = () => {
    cartTimeout.current = setTimeout(() => setCartHover(false), 200);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-tr from-neon-purple to-neon-cyan p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-neon-purple">
              <Gamepad2 className="text-white" size={22} />
            </div>
            <span className="text-xl font-extrabold glow-text hidden sm:inline">Oyuncu Kantinim</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                    active
                      ? 'bg-neon-purple/10 text-neon-purple'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {link.icon && <link.icon size={16} />}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/create"
              className="flex items-center gap-1.5 bg-neon-purple text-white font-bold text-sm px-3 py-1.5 rounded-xl hover:bg-violet-700 transition-colors"
            >
              <Plus size={15} /> İlan Ekle
            </Link>
            {user && (
              <>
                <Link to="/messages" className="relative p-2 text-gray-400 hover:text-neon-cyan transition-colors">
                  <MessageCircle size={20} />
                </Link>
                <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-neon-pink transition-colors">
                  <Bell size={20} />
                  {unreadNotif > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                      {unreadNotif > 9 ? '9+' : unreadNotif}
                    </span>
                  )}
                </Link>
              </>
            )}

            <div className="relative" onMouseEnter={handleCartEnter} onMouseLeave={handleCartLeave}>
              <Link to="/cart" className="relative p-2 text-gray-400 hover:text-neon-purple transition-colors inline-flex">
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-neon-pink text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cart.length}
                  </span>
                )}
              </Link>
              {/* Cart hover preview */}
              {cartHover && cart.length > 0 && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-extrabold text-gray-800 text-sm">Sepet</span>
                    <span className="text-xs text-gray-400">{cart.length} ürün</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                    {cart.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                          {item.image && typeof item.image === 'string' && item.image.startsWith('http')
                            ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-base">{item.itemType === 'epin' ? '💎' : '🎮'}</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">{item.title}</p>
                          {item.game && <p className="text-[10px] text-gray-400 truncate">{item.game}</p>}
                        </div>
                        <span className="text-xs font-extrabold text-emerald-600 flex-shrink-0">{Number(item.price).toFixed(2)} ₺</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <span className="text-xs font-bold text-gray-600">
                      Toplam: <span className="text-emerald-600">{cart.reduce((s, i) => s + Number(i.price), 0).toFixed(2)} ₺</span>
                    </span>
                    <Link to="/cart" className="text-xs bg-violet-600 hover:bg-violet-500 text-white font-bold px-3 py-1.5 rounded-xl transition-colors">
                      Sepete Git
                    </Link>
                  </div>
                </div>
              )}
              {cartHover && cart.length === 0 && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 px-4 py-5 text-center">
                  <ShoppingCart size={24} className="text-gray-200 mx-auto mb-2"/>
                  <p className="text-xs text-gray-400 font-semibold">Sepet boş</p>
                </div>
              )}
            </div>

            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 bg-neon-purple/5 hover:bg-neon-purple/10 border border-neon-purple/20 pl-2 pr-4 py-1.5 rounded-xl transition-all"
              >
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-sm shadow-sm border border-gray-100">
                  {user.avatar || '👤'}
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 font-medium leading-none">Bakiye</div>
                  <div className="text-sm font-bold text-neon-green">{Number(user.balance || 0).toFixed(2)} ₺</div>
                </div>
              </Link>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2 px-5">
                Giris Yap
              </Link>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-3">
            <Link to="/cart" className="relative p-2 text-gray-400">
              <ShoppingCart size={22} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-neon-pink text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-500 p-1">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl">
          <div className="px-4 py-4 space-y-2">
            {NAV_LINKS.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="block w-full text-left px-4 py-3 font-semibold text-gray-600 hover:bg-gray-50 rounded-xl">
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Link to="/create" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 w-full bg-neon-purple text-white font-bold py-3 rounded-xl">
                <Plus size={15} /> İlan Ekle
              </Link>
              {user ? (
                <>
                  <Link to="/messages" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold">Mesajlar</Link>
                  <Link to="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold">
                    <span>Bildirimler</span>
                    {unreadNotif > 0 && <span className="bg-red-500 text-white text-[10px] font-bold h-5 px-1.5 rounded-full flex items-center">{unreadNotif > 9 ? '9+' : unreadNotif}</span>}
                  </Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="block w-full text-center btn-primary py-3">
                    {user.avatar} {user.username} ({Number(user.balance || 0).toFixed(2)} ₺)
                  </Link>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block w-full text-center btn-primary py-3">
                  Giriş Yap / Kayıt Ol
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
