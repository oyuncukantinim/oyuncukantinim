import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import SiteBrand from './components/SiteBrand';
import { getSiteSettings } from './lib/api';
import ErrorBoundary from './components/ErrorBoundary';

const DEVTOOLS_LOCK_KEY = 'ok_devtools_lock_v1';

function isProtectedPublicPage() {
  if (typeof window === 'undefined') return false;
  return !window.location.pathname.startsWith('/admin');
}

function activateDevtoolsLock() {
  if (typeof window === 'undefined' || !isProtectedPublicPage()) return;
  sessionStorage.setItem(DEVTOOLS_LOCK_KEY, '1');
  window.history.replaceState({}, '', '/404');
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

function DevtoolsLockScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-[#7a0000]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_42%),linear-gradient(180deg,#9f0712_0%,#650006_60%,#2a0002_100%)]" />
      <div className="relative flex flex-col items-center justify-center px-6 text-center text-white">
        <div className="mb-4 text-7xl font-black tracking-[0.18em] sm:text-8xl">404</div>
        <div className="text-base font-black uppercase tracking-[0.35em] text-white/88 sm:text-lg">Erişim Engellendi</div>
        <div className="mt-3 max-w-md text-xs font-bold uppercase tracking-[0.22em] text-white/60 sm:text-sm">
          Geliştirici araçları algılandı
        </div>
      </div>
    </div>
  );
}

// Kullanıcı sayfaları — lazy
const Home                = lazy(() => import('./pages/home'));
const MarketPage          = lazy(() => import('./pages/market'));
const ListingDetailPage   = lazy(() => import('./pages/listing-detail'));
const CartPage            = lazy(() => import('./pages/cart'));
const LoginPage           = lazy(() => import('./pages/login'));
const ProfilePage         = lazy(() => import('./pages/profile'));
const CreatePage          = lazy(() => import('./pages/create'));
const MessagesPage        = lazy(() => import('./pages/messages'));
const NotificationsPage   = lazy(() => import('./pages/notifications'));
const SupportPage         = lazy(() => import('./pages/support'));
const SellerPage          = lazy(() => import('./pages/seller'));
const CategoriesPage      = lazy(() => import('./pages/categories'));
const CategoryListingsPage = lazy(() => import('./pages/category-listings'));
const FinancePage         = lazy(() => import('./pages/finance'));
const StoreApplicationPage = lazy(() => import('./pages/magaza-basvuru'));

// Admin sayfaları — lazy (ayrı chunk)
const AdminLogin         = lazy(() => import('./pages/admin/Login'));
const AdminDashboard     = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers         = lazy(() => import('./pages/admin/Users'));
const AdminListings      = lazy(() => import('./pages/admin/Listings'));
const AdminOrders        = lazy(() => import('./pages/admin/Orders'));
const AdminReviews       = lazy(() => import('./pages/admin/Reviews'));
const AdminCategories    = lazy(() => import('./pages/admin/Categories'));
const AdminDoping        = lazy(() => import('./pages/admin/Doping'));
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'));
const AdminMessages      = lazy(() => import('./pages/admin/Messages'));
const AdminSupport       = lazy(() => import('./pages/admin/Support'));
const AdminSettings      = lazy(() => import('./pages/admin/Settings'));
const AdminPopularGames  = lazy(() => import('./pages/admin/PopularGames'));
const AdminHeroSlides    = lazy(() => import('./pages/admin/HeroSlides'));
const AdminFinance       = lazy(() => import('./pages/admin/Finance'));
const AdminPaymentManagement = lazy(() => import('./pages/admin/PaymentManagement'));
const AdminDevNotes      = lazy(() => import('./pages/admin/DevNotes'));
const AdminLogs          = lazy(() => import('./pages/admin/AdminLogs'));
const AdminStoreManagement = lazy(() => import('./pages/admin/StoreManagement'));
const AdminXpManagement = lazy(() => import('./pages/admin/XpManagement'));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
    </div>
  );
}

function SitePageLoader() {
  return (
    <div className="space-y-16 overflow-x-clip">
      <div className="relative left-1/2 -mt-8 h-[420px] w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500">
        <div className="mx-auto flex h-full max-w-4xl animate-pulse flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 h-20 w-20 rounded-2xl border border-white/20 bg-white/20" />
          <div className="mb-4 h-12 w-full max-w-2xl rounded-2xl bg-white/20" />
          <div className="mb-10 h-6 w-full max-w-xl rounded-full bg-white/15" />
          <div className="flex w-full max-w-md gap-4">
            <div className="h-14 flex-1 rounded-xl bg-white/25" />
            <div className="h-14 flex-1 rounded-xl bg-white/15" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`feature-loader-${index}`} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="animate-pulse p-8">
              <div className="mb-4 h-10 w-10 rounded-xl bg-slate-100" />
              <div className="mb-3 h-5 w-2/3 rounded-full bg-slate-100" />
              <div className="h-4 w-full rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {Array.from({ length: 4 }).map((_, sectionIndex) => (
        <div key={`section-loader-${sectionIndex}`} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-52 animate-pulse rounded-full bg-slate-100" />
            <div className="h-10 w-28 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((__, cardIndex) => (
              <div
                key={`card-loader-${sectionIndex}-${cardIndex}`}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="animate-pulse">
                  <div className="h-48 w-full bg-slate-100" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-3/4 rounded-full bg-slate-100" />
                    <div className="h-4 w-1/2 rounded-full bg-slate-100" />
                    <div className="h-8 w-24 rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

function MaintenancePage({ siteName, siteLogo, siteLogoText, maintenanceTitle, maintenanceMessage }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-purple-100 px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <SiteBrand
            siteName={siteName}
            siteLogo={siteLogo}
            siteLogoText={siteLogoText}
            containerClassName="justify-center"
            imageClassName="h-16 w-auto max-w-[280px] object-contain"
            iconWrapperClassName="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-neon-purple to-neon-cyan shadow-neon-purple"
            titleClassName="text-2xl font-extrabold text-gray-900"
          />
        </div>
        <h1 className="mb-3 text-3xl font-extrabold text-gray-900">{maintenanceTitle || 'Bakım Çalışması'}</h1>
        <p className="mb-6 text-lg text-gray-500">
          {maintenanceMessage || 'Sitemiz şu anda bakımda. Kısa süre içinde yeniden yayında olacağız.'}
        </p>
        <div className="rounded-2xl border border-violet-100 bg-white/70 px-6 py-4 text-sm font-semibold text-violet-700 backdrop-blur">
          {siteName} yakında tekrar burada.
        </div>
      </div>
    </div>
  );
}

function AnnouncementBanner({ text }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="relative bg-gradient-to-r from-violet-600 to-cyan-600 px-10 py-2.5 text-center text-sm font-semibold text-white">
      {text}
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none text-white/70 hover:text-white"
        aria-label="Kapat"
      >
        ×
      </button>
    </div>
  );
}

function SiteLayout() {
  const location = useLocation();
  const [siteState, setSiteState] = useState({
    checked: false,
    maintenance: false,
    announcement: { active: false, text: '' },
    siteName: 'Oyuncu Kantinim',
    siteLogo: '',
    siteLogoText: '',
    siteFavicon: '',
    maintenanceTitle: 'Bakım Çalışması',
    maintenanceMessage: 'Sitemiz şu anda bakımda. Kısa süre içinde yeniden yayında olacağız.',
    footerTagline: 'Oyuncular için güvenli alım satım platformu.',
    footerCopyright: '© Oyuncu Kantinim. Tüm hakları saklıdır.',
  });

  useEffect(() => {
    getSiteSettings()
      .then((response) => {
        const data = response.data || {};
        setSiteState({
          checked: true,
          maintenance: data.maintenance_mode === 1,
          announcement: {
            active: data.announcement_active === 1,
            text: data.announcement_text || '',
          },
          siteName: data.site_name || 'Oyuncu Kantinim',
          siteLogo: data.site_logo || '',
          siteLogoText: data.site_logo_text || '',
          siteFavicon: data.site_favicon || '',
          maintenanceTitle: data.maintenance_title || 'Bakım Çalışması',
          maintenanceMessage: data.maintenance_message || 'Sitemiz şu anda bakımda. Kısa süre içinde yeniden yayında olacağız.',
          footerTagline: data.footer_tagline || 'Oyuncular için güvenli alım satım platformu.',
          footerCopyright: data.footer_copyright || '© Oyuncu Kantinim. Tüm hakları saklıdır.',
        });
      })
      .catch(() => {
        setSiteState((prev) => ({ ...prev, checked: true }));
      });
  }, []);

  useEffect(() => {
    const faviconHref = siteState.siteFavicon?.trim();
    if (!faviconHref) return;
    const lowerHref = faviconHref.toLowerCase();
    const faviconType = lowerHref.endsWith('.svg')
      ? 'image/svg+xml'
      : (lowerHref.endsWith('.ico') ? 'image/x-icon' : undefined);

    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'icon');
      document.head.appendChild(link);
    }
    link.setAttribute('href', faviconHref);
    if (faviconType) {
      link.setAttribute('type', faviconType);
    } else {
      link.removeAttribute('type');
    }
  }, [siteState.siteFavicon]);

  if (!siteState.checked) return null;

  const isAdmin = Boolean(localStorage.getItem('admin_token'));
  if (siteState.maintenance && !isAdmin) {
    return (
      <MaintenancePage
        siteName={siteState.siteName}
        siteLogo={siteState.siteLogo}
        siteLogoText={siteState.siteLogoText}
        maintenanceTitle={siteState.maintenanceTitle}
        maintenanceMessage={siteState.maintenanceMessage}
      />
    );
  }

  const isHomeRoute = location.pathname === '/';

  return (
    <div className="min-h-screen overflow-x-clip bg-surface-50 font-sans">
      {siteState.announcement.active && siteState.announcement.text ? (
        <AnnouncementBanner text={siteState.announcement.text} />
      ) : null}
      <Navbar siteName={siteState.siteName} siteLogo={siteState.siteLogo} siteLogoText={siteState.siteLogoText} />
      <main className={`mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8 ${isHomeRoute ? 'overflow-x-visible' : 'overflow-x-clip'}`}>
        <Suspense fallback={<SitePageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/listing/:slug" element={<ListingDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:userId" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/:catSlug" element={<CategoryListingsPage />} />
            <Route path="/p/:username" element={<SellerPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/magaza-basvuru" element={<StoreApplicationPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer
        siteName={siteState.siteName}
        siteLogo={siteState.siteLogo}
        siteLogoText={siteState.siteLogoText}
        footerTagline={siteState.footerTagline}
        footerCopyright={siteState.footerCopyright}
      />
      <Toast />
    </div>
  );
}

export default function App() {
  const [devtoolsLocked, setDevtoolsLocked] = useState(() => {
    if (!import.meta.env.PROD || typeof window === 'undefined') return false;
    return sessionStorage.getItem(DEVTOOLS_LOCK_KEY) === '1' && isProtectedPublicPage();
  });

  useEffect(() => {
    if (!import.meta.env.PROD || typeof window === 'undefined') return undefined;
    if (!isProtectedPublicPage()) return undefined;

    const triggerLock = () => {
      activateDevtoolsLock();
      setDevtoolsLocked(true);
    };

    if (sessionStorage.getItem(DEVTOOLS_LOCK_KEY) === '1') {
      triggerLock();
      return undefined;
    }

    const detectDevtools = () => {
      const widthGap = Math.abs(window.outerWidth - window.innerWidth);
      const heightGap = Math.abs(window.outerHeight - window.innerHeight);
      if (widthGap > 160 || heightGap > 160) {
        triggerLock();
      }
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (
        event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (event.ctrlKey && key === 'u')
      ) {
        event.preventDefault();
        triggerLock();
      }
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
      triggerLock();
    };

    const intervalId = window.setInterval(detectDevtools, 1000);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  if (devtoolsLocked) {
    return <DevtoolsLockScreen />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/listings" element={<AdminRoute><AdminListings /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
              <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
              <Route path="/admin/doping" element={<AdminRoute><AdminDoping /></AdminRoute>} />
              <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
              <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
              <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/popular-games" element={<AdminRoute><AdminPopularGames /></AdminRoute>} />
              <Route path="/admin/hero-slides" element={<AdminRoute><AdminHeroSlides /></AdminRoute>} />
              <Route path="/admin/finance" element={<AdminRoute><AdminFinance /></AdminRoute>} />
              <Route path="/admin/payment-management" element={<AdminRoute><AdminPaymentManagement /></AdminRoute>} />
              <Route path="/admin/store-management" element={<AdminRoute><AdminStoreManagement /></AdminRoute>} />
              <Route path="/admin/xp-management" element={<AdminRoute><AdminXpManagement /></AdminRoute>} />
              <Route path="/admin/dev-notes" element={<AdminRoute><AdminDevNotes /></AdminRoute>} />
              <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
              <Route path="/*" element={<ErrorBoundary><SiteLayout /></ErrorBoundary>} />
            </Routes>
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
