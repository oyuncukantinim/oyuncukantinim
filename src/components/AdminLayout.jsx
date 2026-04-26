import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Images,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  StickyNote,
  Tag,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import useSiteBrand from '../hooks/useSiteBrand';
import UserAvatar from './UserAvatar';
import ThemeToggle from './ThemeToggle';

const navGroups = [
  {
    label: 'Genel',
    items: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, accent: 'from-violet-500 to-indigo-500' },
    ],
  },
  {
    label: 'Topluluk',
    items: [
      { path: '/admin/users', label: 'Kullanıcılar', icon: Users, accent: 'from-sky-500 to-blue-500' },
      { path: '/admin/messages', label: 'Mesajlar', icon: MessageSquare, accent: 'from-cyan-500 to-teal-500' },
      { path: '/admin/support', label: 'Destek Sistemi', icon: LifeBuoy, accent: 'from-rose-500 to-pink-500' },
      { path: '/admin/announcements', label: 'Duyurular', icon: Megaphone, accent: 'from-orange-500 to-amber-500' },
    ],
  },
  {
    label: 'Pazar',
    items: [
      { path: '/admin/listings', label: 'İlanlar', icon: ShoppingBag, accent: 'from-emerald-500 to-teal-500' },
      { path: '/admin/orders', label: 'Siparişler', icon: Package, accent: 'from-lime-500 to-green-500' },
      { path: '/admin/reviews', label: 'Yorumlar', icon: Star, accent: 'from-yellow-500 to-amber-500' },
        { path: '/admin/categories', label: 'Kategoriler', icon: Tag, accent: 'from-fuchsia-500 to-pink-500' },
        { path: '/admin/doping', label: 'Doping', icon: Zap, accent: 'from-yellow-400 to-orange-500' },
        { path: '/admin/hero-slides', label: 'Ana Sayfa Slider', icon: Images, accent: 'from-violet-500 via-fuchsia-500 to-cyan-500' },
      ],
  },
  {
    label: 'Finans',
    items: [
      { path: '/admin/payment-management', label: 'Ödeme Yönetimi', icon: Wallet, accent: 'from-emerald-500 to-green-600' },
      { path: '/admin/finance', label: 'Finansal', icon: Wallet, accent: 'from-teal-500 to-cyan-600' },
    ],
  },
  {
    label: 'Yönetim',
    items: [
      { path: '/admin/store-management', label: 'Mağaza Yönetimi', icon: ShieldCheck, accent: 'from-emerald-500 to-cyan-500' },
      { path: '/admin/xp-management', label: 'XP Yönetimi', icon: Sparkles, accent: 'from-violet-500 to-fuchsia-500' },
      { path: '/admin/settings', label: 'Site Ayarları', icon: Settings, accent: 'from-slate-500 to-slate-700' },
      { path: '/admin/dev-notes', label: 'Geliştirme', icon: StickyNote, accent: 'from-amber-500 to-yellow-600' },
      { path: '/admin/logs', label: 'Güvenlik & Log', icon: Shield, accent: 'from-rose-500 to-red-600' },
    ],
  },
];

const flatNav = navGroups.flatMap((g) => g.items);

function AdminSidebar({
  locationPath,
  onClose,
  onLogout,
  adminUser,
  defaultAvatar,
  siteName,
  siteLogo,
  siteLogoText,
  collapsed,
  onToggleCollapse,
  isMobile = false,
}) {
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return navGroups;
    const q = query.toLowerCase();
    return navGroups
      .map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  const width = collapsed ? 'w-[78px]' : 'w-72';

  return (
    <aside className={`relative flex h-full ${width} flex-col overflow-hidden border-r border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white shadow-2xl transition-[width] duration-300 ease-out`}>
      {/* ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute -right-10 bottom-1/3 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '22px 22px' }} />

      {/* Brand */}
      <div className="relative flex items-center gap-3 border-b border-white/5 px-4 py-4">
        <Link to="/admin" onClick={onClose} className="group flex min-w-0 items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-violet-900/40 transition-transform group-hover:scale-105">
            {siteLogo ? (
              <img src={siteLogo} alt={siteName || 'Admin'} className="h-6 w-6 object-contain" />
            ) : (
              <Shield size={20} strokeWidth={2.4} />
            )}
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
            </span>
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-black leading-none text-white">{siteLogoText || siteName || 'Admin'}</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-violet-200">
                <Shield size={9} /> Panel
              </div>
            </div>
          ) : null}
        </Link>
        {isMobile ? (
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white" title="Kapat">
            <X size={18} />
          </button>
        ) : null}
      </div>

      {/* Search */}
      {!collapsed ? (
        <div className="relative px-3 pt-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Menüde ara..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs font-semibold text-white placeholder-white/40 outline-none transition-all focus:border-violet-400/50 focus:bg-white/10"
            />
          </div>
        </div>
      ) : null}

      {/* Nav */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-3 admin-nav-scroll">
        {filteredGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed ? (
              <div className="mb-1.5 px-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/40">
                {group.label}
              </div>
            ) : (
              <div className="mx-auto my-2 h-px w-6 bg-white/10" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = locationPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-all ${
                      active
                        ? 'bg-white/10 text-white shadow-lg shadow-black/20'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    {/* active bar */}
                    {active ? (
                      <span className={`absolute left-0 top-1/2 h-6 w-1 -translate-x-1.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b ${item.accent}`} />
                    ) : null}
                    {/* icon chip */}
                    <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                      active
                        ? `bg-gradient-to-br ${item.accent} text-white shadow-lg`
                        : 'bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-white'
                    }`}>
                      <item.icon size={15} strokeWidth={2.2} />
                    </span>
                    {!collapsed ? (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        <ChevronRight size={13} className={`shrink-0 transition-all ${active ? 'text-white/70' : 'text-white/0 group-hover:translate-x-0.5 group-hover:text-white/40'}`} />
                      </>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {filteredGroups.length === 0 ? (
          <div className="px-3 py-6 text-center text-[11px] font-semibold text-white/40">
            Sonuç yok
          </div>
        ) : null}
      </nav>

      {/* User / Logout */}
      <div className="relative border-t border-white/5 p-3">
        {!collapsed ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-2.5 backdrop-blur">
            <div className="mb-2 flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
                <UserAvatar value={adminUser.avatar} fallback={defaultAvatar} className="flex h-full w-full items-center justify-center" iconSize={18} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-black text-white">{adminUser.username || 'Admin'}</div>
                <div className="text-[10px] font-bold text-violet-300">Yönetici</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/20 hover:text-rose-200"
            >
              <LogOut size={14} /> Çıkış Yap
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
              <UserAvatar value={adminUser.avatar} fallback={defaultAvatar} className="flex h-full w-full items-center justify-center" iconSize={18} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
            </div>
            <button
              onClick={onLogout}
              title="Çıkış Yap"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/20 hover:text-rose-200"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      {!isMobile ? (
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
          className="absolute -right-3 top-20 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-white/60 shadow-lg transition-all hover:border-violet-400/40 hover:bg-slate-800 hover:text-white"
        >
          {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>
      ) : null}
    </aside>
  );
}

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminUser, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('admin_sidebar_collapsed') === '1'; } catch { return false; }
  });
  const { siteName, siteLogo, siteLogoText, defaultAvatar } = useSiteBrand();

  useEffect(() => {
    try {
      localStorage.setItem('admin_sidebar_collapsed', collapsed ? '1' : '0');
    } catch {
      // localStorage can be blocked in strict browser privacy modes.
    }
  }, [collapsed]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const currentPage = flatNav.find((item) => item.path === location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <style>{`
        .admin-nav-scroll::-webkit-scrollbar { width: 6px; }
        .admin-nav-scroll::-webkit-scrollbar-track { background: transparent; }
        .admin-nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .admin-nav-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }
      `}</style>

      <div className="hidden flex-shrink-0 md:flex">
        <AdminSidebar
          locationPath={location.pathname}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          adminUser={adminUser || {}}
          defaultAvatar={defaultAvatar}
          siteName={siteName}
          siteLogo={siteLogo}
          siteLogoText={siteLogoText}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 h-full w-72">
            <AdminSidebar
              locationPath={location.pathname}
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogout}
              adminUser={adminUser || {}}
              defaultAvatar={defaultAvatar}
              siteName={siteName}
              siteLogo={siteLogo}
              siteLogoText={siteLogoText}
              collapsed={false}
              onToggleCollapse={() => {}}
              isMobile
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {currentPage ? (
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${currentPage.accent} text-white shadow-md`}>
                <currentPage.icon size={15} strokeWidth={2.4} />
              </span>
            ) : null}
            <h1 className="truncate text-base font-extrabold text-slate-900 dark:text-white">
              {currentPage?.label || 'Admin'}
            </h1>
          </div>
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-300 sm:inline-flex"
          >
            <ChevronLeft size={14} /> Siteye Dön
          </Link>
          <ThemeToggle className="px-3 py-2" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
