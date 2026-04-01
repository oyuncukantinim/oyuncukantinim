import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Store, Users, ShoppingCart, Menu, X, Bell, MessageCircle, LayoutGrid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const NAV_LINKS = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/categories', label: 'Kategoriler', icon: LayoutGrid },
  { to: '/store', label: 'E-Pin', icon: Store },
  { to: '/market', label: 'Pazar', icon: Users },
];

export default function Navbar() {
  const { user } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            {user && (
              <>
                <Link to="/messages" className="relative p-2 text-gray-400 hover:text-neon-cyan transition-colors">
                  <MessageCircle size={20} />
                </Link>
                <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-neon-pink transition-colors">
                  <Bell size={20} />
                </Link>
              </>
            )}

            <Link to="/cart" className="relative p-2 text-gray-400 hover:text-neon-purple transition-colors">
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-neon-pink text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.length}
                </span>
              )}
            </Link>

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
            <div className="pt-3 border-t border-gray-100">
              {user ? (
                <>
                  <Link to="/messages" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold">Mesajlar</Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="block mt-2 w-full text-center btn-primary py-3">
                    {user.avatar} {user.username} ({Number(user.balance || 0).toFixed(2)} ₺)
                  </Link>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block w-full text-center btn-primary py-3">
                  Giris Yap / Kayit Ol
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
