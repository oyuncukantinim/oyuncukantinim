import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  LifeBuoy,
  Menu,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';
import { getCategories, getListings, getNotifications, getUnreadCount, getUnreadNotificationsCount, listingSlug, markNotificationsRead } from '../lib/api';
import useSiteBrand from '../hooks/useSiteBrand';
import { getListingCoverImage } from '../lib/listingMedia';
import SiteBrand from './SiteBrand';
import ThemeToggle from './ThemeToggle';
import UserAvatar from './UserAvatar';

const NAV_LINKS = [
  { to: '/', label: 'Ana Sayfa' },
  { to: '/market', label: 'Pazar', icon: Users },
  { to: '/categories', label: 'Kategoriler' },
];

const TOP_STRIPS = [
  { icon: Zap, label: 'Anında teslimat' },
  { icon: ShieldCheck, label: 'Oyuncu Kantinim Güvenli Alışveriş' },
  { icon: LifeBuoy, label: '7/24 destek' },
];

function formatPrice(value) {
  return `${Number(value || 0).toFixed(2)} ₺`;
}

function formatNotificationTime(value) {
  if (!value) return '';
  const diff = (Date.now() - new Date(String(value).replace(' ', 'T')).getTime()) / 1000;
  if (diff < 60) return 'Az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return new Date(String(value).replace(' ', 'T')).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

export default function Navbar({ siteName = 'Oyuncu Kantinim', siteLogo = '', siteLogoText = '' }) {
  const { user, loading: authLoading } = useAuth();
  const { cart } = useCart();
  const { defaultAvatar, defaultListingImage } = useSiteBrand();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMessageThreads, setUnreadMessageThreads] = useState(0);
  const [cartHover, setCartHover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendedListings, setRecommendedListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [desktopSearchFocused, setDesktopSearchFocused] = useState(false);
  const [searchSeedsLoaded, setSearchSeedsLoaded] = useState(false);
  const [notificationPreviewOpen, setNotificationPreviewOpen] = useState(false);
  const [notificationPreviewLoading, setNotificationPreviewLoading] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const cartTimeout = useRef(null);
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const desktopSearchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const debounceRef = useRef(null);

  const loadSearchSeeds = useCallback(() => {
    if (searchSeedsLoaded) return;

    setSearchSeedsLoaded(true);
    Promise.allSettled([
      getListings({ limit: 4, status: 'active' }),
      getCategories(),
    ]).then(([listingResponse, categoryResponse]) => {
      if (listingResponse.status === 'fulfilled') {
        setRecommendedListings(listingResponse.value.data || []);
      }

      if (categoryResponse.status === 'fulfilled') {
        setCategories(categoryResponse.value.data || []);
      }
    });
  }, [searchSeedsLoaded]);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!user) {
      setUnreadNotif(0);
      setUnreadMessageThreads(0);
      return undefined;
    }

    const fetchCounts = () => {
      Promise.all([getUnreadNotificationsCount(), getUnreadCount()])
        .then(([notificationResponse, messageResponse]) => {
          setUnreadNotif(notificationResponse.data?.unread ?? 0);
          setUnreadMessageThreads(messageResponse.data?.unread ?? 0);
        })
        .catch(() => {});
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    const handler = () => setUnreadNotif(0);
    const handleFocus = () => fetchCounts();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchCounts();
    };
    window.addEventListener('notifications-read', handler);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-read', handler);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user || !location.pathname.startsWith('/messages')) return;

    const timer = setTimeout(() => {
      getUnreadCount()
        .then((response) => setUnreadMessageThreads(response.data?.unread ?? 0))
        .catch(() => {});
    }, 700);

    return () => clearTimeout(timer);
  }, [authLoading, location.pathname, user]);

  useEffect(() => {
    if (location.pathname === '/notifications' && user) {
      setUnreadNotif(0);
      markNotificationsRead().catch(() => {});
    }
  }, [location.pathname, user]);

  useEffect(() => {
    const handleClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setDesktopSearchFocused(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationPreviewOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotificationToggle = () => {
    const nextOpen = !notificationPreviewOpen;
    setNotificationPreviewOpen(nextOpen);
    if (!nextOpen || !user) return;

    setNotificationPreviewLoading(true);
    getNotifications()
      .then((response) => setRecentNotifications((response.data || []).slice(0, 3)))
      .catch(() => setRecentNotifications([]))
      .finally(() => setNotificationPreviewLoading(false));
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    loadSearchSeeds();
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await getListings({ search: searchQuery.trim(), limit: 6, status: 'active' });
        setSearchResults(response.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [loadSearchSeeds, searchQuery]);

  const closeSearch = () => {
    setDesktopSearchFocused(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const submitSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/market?search=${encodeURIComponent(searchQuery.trim())}`);
    setMobileOpen(false);
    closeSearch();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeSearch();
      return;
    }

    if (event.key === 'Enter') {
      submitSearch();
    }
  };

  const handleCartEnter = () => {
    clearTimeout(cartTimeout.current);
    setCartHover(true);
  };

  const handleCartLeave = () => {
    cartTimeout.current = setTimeout(() => setCartHover(false), 180);
  };

  const searchDropdownOpen = desktopSearchFocused && searchQuery.trim();
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const listingItems = searchResults.length > 0 ? searchResults : recommendedListings;
  const matchingCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return categories
      .filter((category) => category?.name?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [categories, searchQuery]);

  const buildCategorySlug = (category) => category.slug || category.id;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_6px_22px_rgba(15,23,42,0.05)]">
      <div className="hidden border-b border-slate-200 bg-slate-950 text-slate-200 md:block">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:gap-5">
            {TOP_STRIPS.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                <item.icon size={13} className="text-cyan-300" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <Link to="/support" className="text-slate-300 transition-colors hover:text-white">
              Destek Merkezi
            </Link>
            <Link to="/magaza-basvuru" className="text-slate-300 transition-colors hover:text-white">
              Onaylı Mağaza Ol
            </Link>
            <ThemeToggle iconSize={14} className="h-5 w-5 min-h-5 min-w-5 gap-0 rounded-sm border-slate-700/50 bg-transparent p-0 text-slate-300 hover:border-slate-500 hover:bg-white/10 hover:text-white [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0" />
            {!user ? (
              <Link to="/login" className="text-slate-300 transition-colors hover:text-white">
                Giriş Yap / Kayıt Ol
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[78px] items-center gap-4 py-4">
          <div className="shrink-0">
            <SiteBrand
              to="/"
              siteName={siteName}
              siteLogo={siteLogo}
              siteLogoText={siteLogoText}
              showTitle={false}
              containerClassName="items-center gap-3"
              imageClassName="h-12 w-auto max-w-[260px] object-contain transition-transform group-hover:scale-[1.02]"
              iconWrapperClassName="rounded-2xl bg-gradient-to-tr from-neon-purple to-neon-cyan p-2.5 text-white shadow-[0_10px_30px_rgba(124,58,237,0.24)] transition-transform group-hover:rotate-6"
              titleClassName="hidden text-xl font-black tracking-tight bg-gradient-to-r from-neon-purple to-neon-cyan bg-clip-text text-transparent lg:inline"
            />
          </div>

          <div className="relative hidden flex-1 lg:block" ref={searchRef}>
            <div
              className={`flex h-14 items-center rounded-2xl border bg-slate-50 px-4 shadow-sm transition-all ${
                desktopSearchFocused
                  ? 'border-violet-400 bg-white shadow-[0_12px_30px_rgba(124,58,237,0.12)]'
                  : 'border-slate-200'
              }`}
            >
              <Search size={18} className="mr-3 shrink-0 text-slate-400" />
              <input
                ref={desktopSearchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => {
                  setDesktopSearchFocused(true);
                  loadSearchSeeds();
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="İlan, oyun veya kategori ara..."
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={closeSearch}
                  className="ml-2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={submitSearch}
                className="ml-3 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-violet-500"
              >
                Ara
              </button>
            </div>

            {searchDropdownOpen ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                  </div>
                ) : (
                  <>
                    <div className="border-b border-slate-100 px-4 py-4">
                      <p className="text-sm font-semibold text-slate-700">
                        {searchResults.length > 0 ? 'Arama sonuçları' : 'Sonuç bulunamadı'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {searchResults.length > 0
                          ? 'İlgili ilanlar aşağıda listeleniyor.'
                          : 'Benzer ilanlar öneri olarak gösteriliyor.'}
                      </p>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {matchingCategories.length > 0 ? (
                        <div className="px-4 py-3">
                          <div className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">Kategoriler</div>
                          <div className="space-y-2">
                            {matchingCategories.map((category) => (
                              <Link
                                key={category.id}
                                to={`/categories/${buildCategorySlug(category)}`}
                                onClick={closeSearch}
                                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                                  {category.image ? (
                                    <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-violet-50 text-sm font-black text-violet-600">
                                      {category.icon || 'K'}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-800">{category.name}</p>
                                  <p className="text-[11px] text-slate-400">Kategoriye git</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {listingItems.length > 0 ? (
                        <div className="px-4 py-3">
                          <div className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">İlanlar</div>
                          <div className="space-y-2">
                            {listingItems.map((item) => (
                              <Link
                                key={item.id}
                                to={listingSlug(item.title, item.id)}
                                onClick={closeSearch}
                                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
                              >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                                  <img
                                    src={getListingCoverImage(item, defaultListingImage)}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                                  <div className="mt-0.5 flex items-center gap-2">
                                    <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                      {item.category_name || 'Kategori'}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600">{formatPrice(item.price)}</span>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="border-t border-slate-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={submitSearch}
                        className="text-xs font-bold text-violet-600 transition-colors hover:text-violet-500"
                      >
                        Tümünü Gör →
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white shadow-[0_12px_25px_rgba(124,58,237,0.24)] transition-transform hover:-translate-y-0.5"
            >
              <Plus size={16} />
              İlan Ver
            </Link>

            {user ? (
              <>
                <Link
                  to="/messages"
                  aria-label="Mesajlara git"
                  title="Mesajlar"
                  className="relative rounded-2xl border border-slate-200 p-3 text-slate-500 transition-colors hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                >
                  <MessageCircle size={19} />
                  {unreadMessageThreads > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadMessageThreads > 9 ? '9+' : unreadMessageThreads}
                    </span>
                  ) : null}
                </Link>
                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    onClick={handleNotificationToggle}
                    aria-label="Bildirim önizlemesini aç"
                    title="Bildirimler"
                    className="relative rounded-2xl border border-slate-200 p-3 text-slate-500 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                  >
                    <Bell size={19} />
                    {unreadNotif > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadNotif > 9 ? '9+' : unreadNotif}
                      </span>
                    ) : null}
                  </button>

                  {notificationPreviewOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <span className="text-sm font-extrabold text-slate-800">Bildirimler</span>
                        {unreadNotif > 0 ? <span className="text-xs font-bold text-slate-400">{unreadNotif} yeni</span> : null}
                      </div>
                      <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                        {notificationPreviewLoading ? (
                          <div className="px-4 py-8 text-center text-xs font-bold text-slate-400">Yükleniyor...</div>
                        ) : recentNotifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-xs font-bold text-slate-400">Henüz bildirim yok.</div>
                        ) : (
                          recentNotifications.map((notification) => (
                            <div key={notification.id} className="flex gap-3 px-4 py-3">
                              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.is_read ? 'bg-slate-200' : 'bg-red-500'}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate text-xs font-extrabold text-slate-800">{notification.title}</p>
                                  <span className="shrink-0 text-[10px] font-bold text-slate-400">{formatNotificationTime(notification.created_at)}</span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{notification.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                        <Link
                          to="/notifications"
                          onClick={() => setNotificationPreviewOpen(false)}
                          className="flex h-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white transition hover:bg-slate-800"
                        >
                          Tüm Bildirimler
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="relative" onMouseEnter={handleCartEnter} onMouseLeave={handleCartLeave}>
              <Link
                to="/cart"
                aria-label="Sepete git"
                title="Sepet"
                className="relative inline-flex rounded-2xl border border-slate-200 p-3 text-slate-500 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
              >
                <ShoppingCart size={19} />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-neon-pink px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>

              {cartHover && cartCount > 0 ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <span className="text-sm font-extrabold text-slate-800">Sepet</span>
                    <span className="text-xs text-slate-400">{cartCount} ürün</span>
                  </div>
                  <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                          {item.image && typeof item.image === 'string' && item.image.startsWith('http') ? (
                            <img src={item.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-base">🎮</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-700">{item.title}</p>
                        </div>
                        <span className="shrink-0 text-xs font-extrabold text-emerald-600">{formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <span className="text-xs font-bold text-slate-600">
                      Toplam: <span className="text-emerald-600">{formatPrice(cartTotal)}</span>
                    </span>
                    <Link to="/cart" className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-violet-500">
                      Sepete Git
                    </Link>
                  </div>
                </div>
              ) : null}

              {cartHover && cartCount === 0 ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-2xl">
                  <ShoppingCart size={24} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-xs font-semibold text-slate-400">Sepet boş</p>
                </div>
              ) : null}
            </div>

            {user ? (
              <Link
                to="/profile"
                className="inline-flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 px-3 py-2.5 transition-colors hover:bg-violet-100/80"
              >
                <UserAvatar
                  value={user.avatar}
                  fallback={defaultAvatar}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white bg-white text-base shadow-sm"
                  iconSize={18}
                />
                <div className="text-left">
                  <div className="max-w-[120px] truncate text-xs font-semibold text-slate-500">{user.username}</div>
                  <div className="text-sm font-black text-emerald-600">{formatPrice(user.balance || 0)}</div>
                </div>
              </Link>
            ) : authLoading ? (
              <div className="h-[62px] w-[144px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70" />
            ) : (
              <Link
                to="/login"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
              >
                Giriş Yap
              </Link>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <button
              type="button"
              aria-label="Aramayı aç"
              title="Ara"
              onClick={() => {
                setMobileOpen(true);
                setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
              }}
              className="rounded-2xl border border-slate-200 p-3 text-slate-500"
            >
              <Search size={19} />
            </button>
            <ThemeToggle />
            <Link
              to="/cart"
              aria-label="Sepete git"
              title="Sepet"
              className="relative rounded-2xl border border-slate-200 p-3 text-slate-500"
            >
              <ShoppingCart size={19} />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neon-pink px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              title={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="rounded-2xl border border-slate-200 p-3 text-slate-500"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className="hidden items-center justify-between border-t border-slate-200 py-3 md:flex">
          <div className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    active ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {link.icon ? <link.icon size={15} /> : null}
                  {link.label}
                </Link>
              );
            })}
          </div>

        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white shadow-xl md:hidden">
          <div className="space-y-3 px-4 py-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Search size={14} />
                Arama
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Search size={15} className="shrink-0 text-slate-400" />
                <input
                  ref={mobileSearchInputRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={loadSearchSeeds}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submitSearch();
                  }}
                  placeholder="İlan ara..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
                {searchQuery ? (
                  <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400">
                    <X size={14} />
                  </button>
                ) : null}
              </div>
              {searchQuery.trim() ? (
                <button
                  type="button"
                  onClick={submitSearch}
                  className="mt-3 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white"
                >
                  Sonuçlarda Ara
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <Link
                to="/create"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-3 text-sm font-bold text-white"
              >
                <Plus size={15} />
                İlan Ver
              </Link>

              {user ? (
                <>
                  <Link
                    to="/messages"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <span>Mesajlar</span>
                    {unreadMessageThreads > 0 ? (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadMessageThreads > 9 ? '9+' : unreadMessageThreads}
                      </span>
                    ) : null}
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <span>Bildirimler</span>
                    {unreadNotif > 0 ? (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadNotif > 9 ? '9+' : unreadNotif}
                      </span>
                    ) : null}
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-slate-700">{user.username}</span>
                    <span className="text-sm font-black text-emerald-600">{formatPrice(user.balance || 0)}</span>
                  </Link>
                </>
              ) : authLoading ? (
                <div className="h-12 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70" />
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700"
                >
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
