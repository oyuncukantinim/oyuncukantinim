import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import SiteBrand from './components/SiteBrand';
import { getSiteSettings } from './lib/api';
import ErrorBoundary from './components/ErrorBoundary';

// Kullanıcı sayfaları — lazy
const Home                = lazy(() => import('./pages/home'));
const StorePage           = lazy(() => import('./pages/store'));
const MarketPage          = lazy(() => import('./pages/market'));
const AuctionsPage        = lazy(() => import('./pages/auctions'));
const AuctionDetailPage   = lazy(() => import('./pages/auction-detail'));
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

// Admin sayfaları — lazy (ayrı chunk)
const AdminLogin         = lazy(() => import('./pages/admin/Login'));
const AdminDashboard     = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers         = lazy(() => import('./pages/admin/Users'));
const AdminListings      = lazy(() => import('./pages/admin/Listings'));
const AdminAuctions      = lazy(() => import('./pages/admin/Auctions'));
const AdminOrders        = lazy(() => import('./pages/admin/Orders'));
const AdminReviews       = lazy(() => import('./pages/admin/Reviews'));
const AdminCategories    = lazy(() => import('./pages/admin/Categories'));
const AdminDoping        = lazy(() => import('./pages/admin/Doping'));
const AdminEpins         = lazy(() => import('./pages/admin/Epins'));
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'));
const AdminMessages      = lazy(() => import('./pages/admin/Messages'));
const AdminSupport       = lazy(() => import('./pages/admin/Support'));
const AdminSettings      = lazy(() => import('./pages/admin/Settings'));
const AdminPopularGames  = lazy(() => import('./pages/admin/PopularGames'));
const AdminFinance       = lazy(() => import('./pages/admin/Finance'));
const AdminDevNotes      = lazy(() => import('./pages/admin/DevNotes'));
const AdminLogs          = lazy(() => import('./pages/admin/AdminLogs'));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
    </div>
  );
}

function SitePageLoader() {
  return (
    <div className="space-y-16">
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

  return (
    <div className="min-h-screen bg-surface-50 font-sans">
      {siteState.announcement.active && siteState.announcement.text ? (
        <AnnouncementBanner text={siteState.announcement.text} />
      ) : null}
      <Navbar siteName={siteState.siteName} siteLogo={siteState.siteLogo} siteLogoText={siteState.siteLogoText} />
      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<SitePageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/auctions" element={<AuctionsPage />} />
            <Route path="/auction/:slug" element={<AuctionDetailPage />} />
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
              <Route path="/admin/auctions" element={<AdminRoute><AdminAuctions /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
              <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
              <Route path="/admin/doping" element={<AdminRoute><AdminDoping /></AdminRoute>} />
              <Route path="/admin/epins" element={<AdminRoute><AdminEpins /></AdminRoute>} />
              <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
              <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
              <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/popular-games" element={<AdminRoute><AdminPopularGames /></AdminRoute>} />
              <Route path="/admin/finance" element={<AdminRoute><AdminFinance /></AdminRoute>} />
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
