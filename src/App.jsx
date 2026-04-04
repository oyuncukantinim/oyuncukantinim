import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import KantinBot from './components/KantinBot';
import SiteBrand from './components/SiteBrand';
import { getSiteSettings } from './lib/api';

import Home from './pages/home';
import StorePage from './pages/store';
import MarketPage from './pages/market';
import ListingDetailPage from './pages/listing-detail';
import CartPage from './pages/cart';
import LoginPage from './pages/login';
import ProfilePage from './pages/profile';
import CreatePage from './pages/create';
import MessagesPage from './pages/messages';
import NotificationsPage from './pages/notifications';
import SellerPage from './pages/seller';
import CategoriesPage from './pages/categories';
import CategoryListingsPage from './pages/category-listings';

import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminListings from './pages/admin/Listings';
import AdminOrders from './pages/admin/Orders';
import AdminReviews from './pages/admin/Reviews';
import AdminCategories from './pages/admin/Categories';
import AdminEpins from './pages/admin/Epins';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminMessages from './pages/admin/Messages';
import AdminSettings from './pages/admin/Settings';
import AdminPopularGames from './pages/admin/PopularGames';
import AdminFinance from './pages/admin/Finance';
import AdminDevNotes from './pages/admin/DevNotes';
import FinancePage from './pages/finance';

function AdminRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

function MaintenancePage({ siteName, siteLogo, siteLogoText }) {
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
        <h1 className="mb-3 text-3xl font-extrabold text-gray-900">Bakım Çalışması</h1>
        <p className="mb-6 text-lg text-gray-500">
          Sitemiz şu anda bakımda. Kısa süre içinde yeniden yayında olacağız.
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
        });
      })
      .catch(() => {
        setSiteState((prev) => ({ ...prev, checked: true }));
      });
  }, []);

  if (!siteState.checked) return null;

  const isAdmin = Boolean(localStorage.getItem('admin_token'));
  if (siteState.maintenance && !isAdmin) {
    return (
      <MaintenancePage
        siteName={siteState.siteName}
        siteLogo={siteState.siteLogo}
        siteLogoText={siteState.siteLogoText}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 font-sans">
      {siteState.announcement.active && siteState.announcement.text ? (
        <AnnouncementBanner text={siteState.announcement.text} />
      ) : null}
      <Navbar siteName={siteState.siteName} siteLogo={siteState.siteLogo} siteLogoText={siteState.siteLogoText} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/listing/:slug" element={<ListingDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:userId" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:catSlug" element={<CategoryListingsPage />} />
          <Route path="/p/:username" element={<SellerPage />} />
          <Route path="/finance" element={<FinancePage />} />
        </Routes>
      </main>
      <Footer siteName={siteState.siteName} siteLogo={siteState.siteLogo} siteLogoText={siteState.siteLogoText} />
      <KantinBot />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/listings" element={<AdminRoute><AdminListings /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
            <Route path="/admin/epins" element={<AdminRoute><AdminEpins /></AdminRoute>} />
            <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
            <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/popular-games" element={<AdminRoute><AdminPopularGames /></AdminRoute>} />
            <Route path="/admin/finance" element={<AdminRoute><AdminFinance /></AdminRoute>} />
            <Route path="/admin/dev-notes" element={<AdminRoute><AdminDevNotes /></AdminRoute>} />
            <Route path="/*" element={<SiteLayout />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
