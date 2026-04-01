import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
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
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
