import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CartProvider } from './context/CartContext';
import { useAdminAuth } from './context/useAdminAuth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import SiteBrand from './components/SiteBrand';
import { getSiteSettings } from './lib/api';
import ErrorBoundary from './components/ErrorBoundary';

const LAZY_LOAD_TIMEOUT_MS = 8000;

function lazyWithTimeout(importer, label) {
  return lazy(() => Promise.race([
    importer(),
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`Sayfa modulu zaman asimina ugradi: ${label}`));
      }, LAZY_LOAD_TIMEOUT_MS);
    }),
  ]));
}


// Kullanıcı sayfaları — lazy
const Home                = lazyWithTimeout(() => import('./pages/home'), 'home');
const MarketPage          = lazyWithTimeout(() => import('./pages/market'), 'market');
const ListingDetailPage   = lazyWithTimeout(() => import('./pages/listing-detail'), 'listing-detail');
const ProductDetailPage   = lazyWithTimeout(() => import('./pages/product-detail'), 'product-detail');
const CartPage            = lazyWithTimeout(() => import('./pages/cart'), 'cart');
const LoginPage           = lazyWithTimeout(() => import('./pages/login'), 'login');
const ProfilePage         = lazyWithTimeout(() => import('./pages/profile'), 'profile');
const CreatePage          = lazyWithTimeout(() => import('./pages/create'), 'create');
const MessagesPage        = lazyWithTimeout(() => import('./pages/messages'), 'messages');
const NotificationsPage   = lazyWithTimeout(() => import('./pages/notifications'), 'notifications');
const SupportPage         = lazyWithTimeout(() => import('./pages/support'), 'support');
const SellerPage          = lazyWithTimeout(() => import('./pages/seller'), 'seller');
const CategoriesPage      = lazyWithTimeout(() => import('./pages/categories'), 'categories');
const CategoryListingsPage = lazyWithTimeout(() => import('./pages/category-listings'), 'category-listings');
const FinancePage         = lazyWithTimeout(() => import('./pages/finance'), 'finance');
const StoreApplicationPage = lazyWithTimeout(() => import('./pages/magaza-basvuru'), 'magaza-basvuru');
const Error403Page        = lazyWithTimeout(() => import('./pages/error-403'), 'error-403');
const Error404Page        = lazyWithTimeout(() => import('./pages/error-404'), 'error-404');

// Admin sayfaları — lazy (ayrı chunk)
const AdminLogin         = lazyWithTimeout(() => import('./pages/admin/Login'), 'admin/login');
const AdminDashboard     = lazyWithTimeout(() => import('./pages/admin/Dashboard'), 'admin/dashboard');
const AdminUsers         = lazyWithTimeout(() => import('./pages/admin/Users'), 'admin/users');
const AdminListings      = lazyWithTimeout(() => import('./pages/admin/Listings'), 'admin/listings');
const AdminOrders        = lazyWithTimeout(() => import('./pages/admin/Orders'), 'admin/orders');
const AdminReviews       = lazyWithTimeout(() => import('./pages/admin/Reviews'), 'admin/reviews');
const AdminCategories    = lazyWithTimeout(() => import('./pages/admin/Categories'), 'admin/categories');
const AdminProducts      = lazyWithTimeout(() => import('./pages/admin/Products'), 'admin/products');
const AdminProductOrders = lazyWithTimeout(() => import('./pages/admin/ProductOrders'), 'admin/product-orders');
const AdminDoping        = lazyWithTimeout(() => import('./pages/admin/Doping'), 'admin/doping');
const AdminAnnouncements = lazyWithTimeout(() => import('./pages/admin/Announcements'), 'admin/announcements');
const AdminMessages      = lazyWithTimeout(() => import('./pages/admin/Messages'), 'admin/messages');
const AdminSupport       = lazyWithTimeout(() => import('./pages/admin/Support'), 'admin/support');
const AdminSettings      = lazyWithTimeout(() => import('./pages/admin/Settings'), 'admin/settings');
const AdminHeroSlides    = lazyWithTimeout(() => import('./pages/admin/HeroSlides'), 'admin/hero-slides');
const AdminFinance       = lazyWithTimeout(() => import('./pages/admin/Finance'), 'admin/finance');
const AdminPaymentManagement = lazyWithTimeout(() => import('./pages/admin/PaymentManagement'), 'admin/payment-management');
const AdminDevNotes      = lazyWithTimeout(() => import('./pages/admin/DevNotes'), 'admin/dev-notes');
const AdminLogs          = lazyWithTimeout(() => import('./pages/admin/AdminLogs'), 'admin/logs');
const AdminStoreManagement = lazyWithTimeout(() => import('./pages/admin/StoreManagement'), 'admin/store-management');
const AdminXpManagement = lazyWithTimeout(() => import('./pages/admin/XpManagement'), 'admin/xp-management');

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
  const { adminUser, loading, checked } = useAdminAuth();
  if (!checked || loading) return <PageLoader />;
  if (!adminUser) return <Navigate to="/admin/login" replace />;
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
  const { adminUser, loading: adminLoading, checked: adminChecked, refreshAdmin } = useAdminAuth();
  const [siteState, setSiteState] = useState({
    checked: true,
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

  useEffect(() => {
    if (siteState.checked && siteState.maintenance && !adminUser && !adminChecked && !adminLoading) {
      refreshAdmin();
    }
  }, [adminChecked, adminLoading, adminUser, refreshAdmin, siteState.checked, siteState.maintenance]);

  if (!siteState.checked) return null;

  if (siteState.maintenance && !adminUser) {
    if (!adminChecked || adminLoading) return null;
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
            <Route path="/product/:slug" element={<ProductDetailPage />} />
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
            <Route path="/403" element={<Error403Page />} />
            <Route path="/404" element={<Error404Page />} />
            <Route path="*" element={<Error404Page />} />
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

function AppRoutes() {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/listings" element={<AdminRoute><AdminListings /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/product-orders" element={<AdminRoute><AdminProductOrders /></AdminRoute>} />
          <Route path="/admin/doping" element={<AdminRoute><AdminDoping /></AdminRoute>} />
          <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
          <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
          <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin/hero-slides" element={<AdminRoute><AdminHeroSlides /></AdminRoute>} />
          <Route path="/admin/finance" element={<AdminRoute><AdminFinance /></AdminRoute>} />
          <Route path="/admin/payment-management" element={<AdminRoute><AdminPaymentManagement /></AdminRoute>} />
          <Route path="/admin/store-management" element={<AdminRoute><AdminStoreManagement /></AdminRoute>} />
          <Route path="/admin/xp-management" element={<AdminRoute><AdminXpManagement /></AdminRoute>} />
          <Route path="/admin/dev-notes" element={<AdminRoute><AdminDevNotes /></AdminRoute>} />
          <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
          <Route path="/*" element={<SiteLayout />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
