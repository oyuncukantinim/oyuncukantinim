import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Gamepad2,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  StickyNote,
  Tag,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import useSiteBrand from '../hooks/useSiteBrand';
import SiteBrand from './SiteBrand';
import ThemeToggle from './ThemeToggle';

// Gruplandirilmis navigasyon — her grup kendi basliginda gosterilir
const navGroups = [
  {
    label: 'Genel',
    items: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Operasyon',
    items: [
      { path: '/admin/users', label: 'Kullanıcılar', icon: Users },
      { path: '/admin/listings', label: 'İlanlar', icon: ShoppingBag },
      { path: '/admin/orders', label: 'Siparişler', icon: Package },
      { path: '/admin/reviews', label: 'Yorumlar', icon: Star },
    ],
  },
  {
    label: 'İçerik',
    items: [
      { path: '/admin/categories', label: 'Kategoriler', icon: Tag },
      { path: '/admin/doping', label: 'Doping', icon: Zap },
      { path: '/admin/epins', label: 'E-Pinler', icon: CreditCard },
      { path: '/admin/popular-games', label: 'Popüler Kategoriler', icon: Gamepad2 },
    ],
  },
  {
    label: 'Finans',
    items: [
      { path: '/admin/payment-management', label: 'Ödeme Yönetimi', icon: Wallet },
      { path: '/admin/finance', label: 'Finansal', icon: Wallet },
    ],
  },
  {
    label: 'İletişim',
    items: [
      { path: '/admin/messages', label: 'Mesajlar', icon: MessageSquare },
      { path: '/admin/support', label: 'Destek Sistemi', icon: LifeBuoy },
      { path: '/admin/announcements', label: 'Duyurular', icon: Megaphone },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { path: '/admin/settings', label: 'Site Ayarları', icon: Settings },
      { path: '/admin/dev-notes', label: 'Geliştirme', icon: StickyNote },
      { path: '/admin/logs', label: 'Güvenlik & Log', icon: Shield },
    ],
  },
];

// Flatten helper — sayfa basligi icin kullanilir
const flatNavItems = navGroups.flatMap((group) => group.items);

function AdminSidebar({
  locationPath,
  onClose,
  onLogout,
  adminUser,
  defaultAvatar,
  siteName,
  siteLogo,
  siteLogoText,
}) {
  return (
    <aside className="relative flex h-full w-[268px] flex-col overflow-hidden bg-gradient-to-b from-[#0B1120] via-[#0F172A] to-[#0B1120] text-white">
      {/* Ambient glow efektleri */}
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />

      {/* BRAND */}
      <div className="relative border-b border-white/5 px-5 py-5">
        <SiteBrand
          to="/admin"
          siteName={siteName}
          siteLogo={siteLogo}
          siteLogoText={siteLogoText}
          fallback="shield"
          subtitle="Admin Konsol"
          imageClassName="h-10 w-auto max-w-[180px] object-contain drop-shadow-[0_4px_12px_rgba(139,92,246,0.4)]"
          iconWrapperClassName="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 shadow-lg shadow-violet-900/50 ring-1 ring-white/10"
          titleClassName="text-[15px] font-black leading-none text-white tracking-tight"
          subtitleClassName="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300"
        />
      </div>

      {/* NAV */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {navGroups.map((group, groupIdx) => (
          <div key={group.label} className={groupIdx === 0 ? '' : 'mt-5'}>
            <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = locationPath === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/40 ring-1 ring-white/10'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {/* Active side bar accent */}
                    {active ? (
                      <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-cyan-400 shadow-[0_0_10px_2px_rgba(34,211,238,0.6)]" />
                    ) : null}

                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'
                      }`}
                    >
                      <Icon size={14} strokeWidth={2.2} />
                    </div>

                    <span className="flex-1 truncate">{item.label}</span>
                    {active ? <ChevronRight size={13} className="text-white/70" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* USER FOOTER */}
      <div className="relative border-t border-white/5 p-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-black shadow-lg ring-1 ring-white/20">
                {adminUser.avatar || defaultAvatar || 'A'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0F172A] bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-black text-white">
                {adminUser.username || 'Admin'}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-300">
                <Shield size={9} />
                Yönetici
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-[12px] font-bold text-rose-300 transition-all hover:bg-rose-500/20 hover:text-rose-200"
          >
            <LogOut size={13} /> Çıkış Yap
          </button>
        </div>
      </div>
    </aside>
  );
}

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

  const currentPage = flatNavItems.find((item) => item.path === location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Desktop sidebar */}
      <div className="hidden flex-shrink-0 md:flex">
        <AdminSidebar
          locationPath={location.pathname}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          adminUser={adminUser}
          defaultAvatar={defaultAvatar}
          siteName={siteName}
          siteLogo={siteLogo}
          siteLogoText={siteLogoText}
        />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 h-full w-[268px] shadow-2xl">
            <AdminSidebar
              locationPath={location.pathname}
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogout}
              adminUser={adminUser}
              defaultAvatar={defaultAvatar}
              siteName={siteName}
              siteLogo={siteLogo}
              siteLogoText={siteLogoText}
            />
          </div>
        </div>
      ) : null}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="relative flex flex-shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-xl sm:px-6">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:border-violet-300 hover:text-violet-600 hover:shadow-sm md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                <span>Admin Panel</span>
                <ChevronRight size={10} />
                <span className="text-violet-600">Yönetim</span>
              </div>
              <h1 className="mt-0.5 truncate text-[17px] font-black tracking-tight text-slate-950">
                {currentPage?.label || 'Admin'}
              </h1>
            </div>
          </div>

          {/* Search placeholder — gorsel vurgu icin */}
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-400 shadow-sm transition-all hover:border-slate-300 lg:flex">
            <Search size={14} />
            <span>Hızlı ara...</span>
            <kbd className="ml-6 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">
              Ctrl K
            </kbd>
          </div>

          {/* Notifications icon */}
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-violet-300 hover:text-violet-600 hover:shadow-sm"
            aria-label="Bildirimler"
          >
            <Bell size={16} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          <ThemeToggle className="h-10 w-10 rounded-xl border border-slate-200 bg-white !px-0 !py-0 shadow-sm hover:border-violet-300" />

          <Link
            to="/"
            target="_blank"
            className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-600 transition-all hover:border-violet-300 hover:text-violet-600 hover:shadow-sm sm:flex"
          >
            Siteye Dön
            <ExternalLink size={12} />
          </Link>
        </header>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
