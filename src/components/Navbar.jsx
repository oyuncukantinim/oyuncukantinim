import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, LifeBuoy, Menu, MessageCircle, Plus, ShoppingCart, Store, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getUnreadNotificationsCount, markNotificationsRead } from '../lib/api';
import useSiteBrand from '../hooks/useSiteBrand';
import SiteBrand from './SiteBrand';

const NAV_LINKS = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/store', label: 'E-Pin', icon: Store },
  { to: '/market', label: 'Pazar', icon: Users },
  { to: '/categories', label: 'Kategoriler' },
  { to: '/support', label: 'Destek', icon: LifeBuoy },
];

export default function Navbar({ siteName = 'Oyuncu Kantinim', siteLogo = '', siteLogoText = '' }) {
  const { user } = useAuth();
  const { cart } = useCart();
  const { defaultAvatar } = useSiteBrand();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [cartHover, setCartHover] = useState(false);
  const cartTimeout = useRef(null);

  useEffect(() => {
    if (!user) {
      setUnreadNotif(0);
      return;
    }

    const fetchCount = () => {
      getUnreadNotificationsCount()
        .then((response) => setUnreadNotif(response.data?.unread ?? 0))
        .catch(() => {});
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    const handler = () => setUnreadNotif(0);

    window.addEventListener('notifications-read', handler);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-read', handler);
    };
  }, [user]);

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
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <SiteBrand
            to="/"
            siteName={siteName}
            siteLogo={siteLogo}
            siteLogoText={siteLogoText}
            containerClassName="items-center"
            imageClassName="h-10 w-auto max-w-[220px] object-contain transition-transform group-hover:scale-[1.02]"
            iconWrapperClassName="rounded-xl bg-gradient-to-tr from-neon-purple to-neon-cyan p-2 shadow-neon-purple transition-transform group-hover:rotate-12"
            titleClassName="hidden text-xl font-extrabold glow-text sm:inline"
          />

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-neon-purple/10 text-neon-purple'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {link.icon ? <link.icon size={16} /> : null}
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/create"
              className="flex items-center gap-1.5 rounded-xl bg-neon-purple px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-violet-700"
            >
              <Plus size={15} /> İlan Ekle
            </Link>

            {user ? (
              <>
                <Link to="/messages" className="relative p-2 text-gray-400 transition-colors hover:text-neon-cyan">
                  <MessageCircle size={20} />
                </Link>
                <Link to="/notifications" className="relative p-2 text-gray-400 transition-colors hover:text-neon-pink">
                  <Bell size={20} />
                  {unreadNotif > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
                      {unreadNotif > 9 ? '9+' : unreadNotif}
                    </span>
                  ) : null}
                </Link>
              </>
            ) : null}

            <div className="relative" onMouseEnter={handleCartEnter} onMouseLeave={handleCartLeave}>
              <Link to="/cart" className="relative inline-flex p-2 text-gray-400 transition-colors hover:text-neon-purple">
                <ShoppingCart size={20} />
                {cart.length > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-neon-pink text-[10px] font-bold text-white">
                    {cart.length}
                  </span>
                ) : null}
              </Link>

              {cartHover && cart.length > 0 ? (
                <div className="absolute right-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <span className="text-sm font-extrabold text-gray-800">Sepet</span>
                    <span className="text-xs text-gray-400">{cart.length} ürün</span>
                  </div>
                  <div className="max-h-56 divide-y divide-gray-50 overflow-y-auto">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-100">
                          {item.image && typeof item.image === 'string' && item.image.startsWith('http') ? (
                            <img src={item.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-base">
                              {item.itemType === 'epin' ? '💎' : '🎮'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-gray-700">{item.title}</p>
                          {item.game ? <p className="truncate text-[10px] text-gray-400">{item.game}</p> : null}
                        </div>
                        <span className="flex-shrink-0 text-xs font-extrabold text-emerald-600">
                          {Number(item.price).toFixed(2)} ₺
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                    <span className="text-xs font-bold text-gray-600">
                      Toplam:{' '}
                      <span className="text-emerald-600">
                        {cart.reduce((sum, item) => sum + Number(item.price), 0).toFixed(2)} ₺
                      </span>
                    </span>
                    <Link to="/cart" className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-violet-500">
                      Sepete Git
                    </Link>
                  </div>
                </div>
              ) : null}

              {cartHover && cart.length === 0 ? (
                <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-2xl border border-gray-100 bg-white px-4 py-5 text-center shadow-xl">
                  <ShoppingCart size={24} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-xs font-semibold text-gray-400">Sepet boş</p>
                </div>
              ) : null}
            </div>

            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-xl border border-neon-purple/20 bg-neon-purple/5 py-1.5 pl-2 pr-4 transition-all hover:bg-neon-purple/10"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-sm shadow-sm">
                  {user.avatar || defaultAvatar}
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-medium leading-none text-gray-400">Bakiye</div>
                  <div className="text-sm font-bold text-neon-green">{Number(user.balance || 0).toFixed(2)} ₺</div>
                </div>
              </Link>
            ) : (
              <Link to="/login" className="btn-primary px-5 py-2 text-sm">
                Giriş Yap
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <Link to="/cart" className="relative p-2 text-gray-400">
              <ShoppingCart size={22} />
              {cart.length > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neon-pink text-[10px] font-bold text-white">
                  {cart.length}
                </span>
              ) : null}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1 text-gray-500">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="absolute w-full border-t border-gray-100 bg-white shadow-xl md:hidden">
          <div className="space-y-2 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block w-full rounded-xl px-4 py-3 text-left font-semibold text-gray-600 hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <Link
                to="/create"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-neon-purple py-3 font-bold text-white"
              >
                <Plus size={15} /> İlan Ekle
              </Link>

              {user ? (
                <>
                  <Link to="/messages" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 font-semibold text-gray-600 hover:bg-gray-50">
                    Mesajlar
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    <span>Bildirimler</span>
                    {unreadNotif > 0 ? (
                      <span className="flex h-5 items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {unreadNotif > 9 ? '9+' : unreadNotif}
                      </span>
                    ) : null}
                  </Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="block w-full py-3 text-center btn-primary">
                    {user.avatar || defaultAvatar} {user.username} ({Number(user.balance || 0).toFixed(2)} ₺)
                  </Link>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block w-full py-3 text-center btn-primary">
                  Giriş Yap / Kayıt Ol
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
