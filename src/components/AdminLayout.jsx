import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShoppingBag, Package,
  Star, Tag, CreditCard, Megaphone, Settings,
  LogOut, Menu, X, ChevronRight, Shield, MessageSquare
} from 'lucide-react';

const navItems = [
  { path: '/admin',             label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/admin/users',       label: 'Kullanıcılar',    icon: Users },
  { path: '/admin/listings',    label: 'İlanlar',         icon: ShoppingBag },
  { path: '/admin/orders',      label: 'Siparişler',      icon: Package },
  { path: '/admin/reviews',     label: 'Yorumlar',        icon: Star },
  { path: '/admin/categories',  label: 'Kategoriler',     icon: Tag },
  { path: '/admin/epins',       label: 'E-Pinler',        icon: CreditCard },
  { path: '/admin/messages',    label: 'Mesajlar',        icon: MessageSquare },
  { path: '/admin/announcements', label: 'Duyurular',     icon: Megaphone },
  { path: '/admin/settings',    label: 'Site Ayarları',   icon: Settings },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || '{}'); } catch { return {}; }
  })();

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-gray-900 text-white w-64">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Shield size={18} />
          </div>
          <div>
            <div className="font-extrabold text-sm leading-none">Oyuncu Kantinim</div>
            <div className="text-[10px] text-violet-400 font-bold mt-0.5">Admin Paneli</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={17} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Admin user + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-base">
            {adminUser.avatar || '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{adminUser.username || 'Admin'}</div>
            <div className="text-[10px] text-violet-400">Yönetici</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all font-semibold"
        >
          <LogOut size={15} /> Çıkış Yap
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-64 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-extrabold text-gray-900">
              {navItems.find(n => n.path === location.pathname)?.label || 'Admin'}
            </h1>
          </div>
          <Link
            to="/"
            target="_blank"
            className="text-xs text-gray-500 hover:text-violet-600 font-semibold transition-colors"
          >
            ← Siteye Dön
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
