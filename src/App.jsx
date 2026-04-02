import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import KantinBot from './components/KantinBot';

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

// Admin pages
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

function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Bakım Çalışması</h1>
        <p className="text-gray-500 text-lg mb-6">Sitemiz şu an bakımda. Kısa süre içinde geri döneceğiz.</p>
        <div className="bg-white/70 backdrop-blur rounded-2xl px-6 py-4 border border-violet-100 text-sm text-violet-700 font-semibold">
          Oyuncu Kantinim — Yakında Görüşmek Üzere 🎮
        </div>
      </div>
    </div>
  );
}

function AnnouncementBanner({ text }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="relative bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-semibold text-center py-2.5 px-10">
      {text}
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-lg leading-none"
        aria-label="Kapat"
      >×</button>
    </div>
  );
}

function SiteLayout() {
  const [maintenance, setMaintenance] = useState(false);
  const [announcement, setAnnouncement] = useState({ active: false, text: '' });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch('https://api.oyuncukantinim.com.tr/api.php?action=get_site_settings')
      .then(r => r.json())
      .then(j => {
        if (j.status === 'success') {
          setMaintenance(j.data.maintenance_mode == 1);
          setAnnouncement({ active: j.data.announcement_active == 1, text: j.data.announcement_text || '' });
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;

  // Admin token varsa bakım modunu atla
  const isAdmin = !!localStorage.getItem('admin_token');
  if (maintenance && !isAdmin) return <MaintenancePage />;

  return (
    <div className="min-h-screen bg-surface-50 font-sans">
      {announcement.active && announcement.text && <AnnouncementBanner text={announcement.text} />}
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <Footer />
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
            {/* Admin — kendi layout'u var */}
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

            {/* Site — Navbar + Footer */}
            <Route path="/*" element={<SiteLayout />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
