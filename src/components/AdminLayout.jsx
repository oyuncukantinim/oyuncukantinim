import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  CreditCard,
  Gamepad2,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Star,
  StickyNote,
  Tag,
  Users,
  Wallet,
} from 'lucide-react';
import useSiteBrand from '../hooks/useSiteBrand';
import SiteBrand from './SiteBrand';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Kullanıcılar', icon: Users },
  { path: '/admin/listings', label: 'İlanlar', icon: ShoppingBag },
  { path: '/admin/orders', label: 'Siparişler', icon: Package },
  { path: '/admin/reviews', label: 'Yorumlar', icon: Star },
  { path: '/admin/categories', label: 'Kategoriler', icon: Tag },
  { path: '/admin/epins', label: 'E-Pinler', icon: CreditCard },
  { path: '/admin/finance', label: 'Finansal', icon: Wallet },
  { path: '/admin/messages', label: 'Mesajlar', icon: MessageSquare },
  { path: '/admin/support', label: 'Destek Sistemi', icon: LifeBuoy },
  { path: '/admin/announcements', label: 'Duyurular', icon: Megaphone },
  { path: '/admin/popular-games', label: 'Popüler Oyunlar', icon: Gamepad2 },
  { path: '/admin/settings', label: 'Site Ayarları', icon: Settings },
  { path: '/admin/dev-notes', label: 'Geliştirme', icon: StickyNote },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { siteName, siteLogo, siteLogoText, defaultAvatar } = useSiteBrand();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const adminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user') || '{}');
    } catch {
      return {};
    }
  })();

  const Sidebar = () => (
    <aside className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="border-b border-white/10 px-6 py-5">
        <SiteBrand
          to="/admin"
          siteName={siteName}
          siteLogo={siteLogo}
          siteLogoText={siteLogoText}
          fallback="shield"
          subtitle="Admin Paneli"
          imageClassName="h-10 w-auto max-w-[180px] object-contain"
          iconWrapperClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500"
          titleClassName="text-sm font-extrabold leading-none text-white"
          subtitleClassName="mt-0.5 text-[10px] font-bold text-violet-300"
        />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={17} />
              <span className="flex-1">{item.label}</span>
              {active ? <ChevronRight size={14} /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-base">
            {adminUser.avatar || defaultAvatar}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{adminUser.username || 'Admin'}</div>
            <div className="text-[10px] text-violet-400">Yönetici</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10"
        >
          <LogOut size={15} /> Çıkış Yap
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden flex-shrink-0 md:flex">
        <Sidebar />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 h-full w-64">
            <Sidebar />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
          <button className="rounded-lg p-2 hover:bg-gray-100 md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-extrabold text-gray-900">
              {navItems.find((item) => item.path === location.pathname)?.label || 'Admin'}
            </h1>
          </div>
          <Link
            to="/"
            target="_blank"
            className="text-xs font-semibold text-gray-500 transition-colors hover:text-violet-600"
          >
            ← Siteye Dön
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
