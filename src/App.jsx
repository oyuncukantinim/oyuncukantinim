import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function AdminRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Admin routes — kendi layout'u var, Navbar/Footer yok */}
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

            {/* Site routes */}
            <Route path="/*" element={
              <div className="min-h-screen bg-surface-50 font-sans">
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
                    <Route path="/p/:username" element={<SellerPage />} />
                  </Routes>
                </main>
                <Footer />
                <KantinBot />
                <Toast />
              </div>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
