import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';

// Sayfalarımızı içe aktarıyoruz
import Home from './pages/Home';
import Store from './pages/Store';
import Market from './pages/Market';
import Profile from './pages/Profile';
import Create from './pages/create'; 

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  // Uygulama yüklendiğinde localStorage'dan kullanıcıyı kontrol et
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Çıkış yapma fonksiyonu
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      
      {/* HEADER / NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">
              OK.
            </span>
          </Link>

          {/* Masaüstü Menü Linkleri */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium hover:text-purple-400 transition-colors">Ana Sayfa</Link>
            <Link to="/store" className="text-sm font-medium hover:text-purple-400 transition-colors">Mağaza</Link>
            <Link to="/market" className="text-sm font-medium hover:text-purple-400 transition-colors">Oyuncu Pazarı</Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* Sepet Butonu */}
            <button className="relative p-2 hover:bg-white/5 rounded-xl transition-colors">
              <span className="text-xl">🛒</span>
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-purple-500 text-[10px] font-bold flex items-center justify-center rounded-full">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Kullanıcı Giriş/Çıkış Kontrolü */}
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 hover:bg-white/5 p-2 rounded-xl transition-colors">
                  <span className="text-xl">{user.avatar || '👤'}</span>
                  <span className="text-sm font-medium hidden md:block">{user.username}</span>
                </Link>
                <button onClick={handleLogout} className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
                  Çıkış
                </button>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors">
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SAYFA İÇERİKLERİNİN DEĞİŞECEĞİ ALAN (ROUTER) */}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Kısa isimli bileşenlerimizi Route'lara yerleştirdik */}
          <Route path="/" element={<Home />} />
          <Route path="/store" element={<Store cart={cart} setCart={setCart} />} />
          <Route path="/market" element={<Market />} />
          <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
          <Route path="/create" element={<Create user={user} />} />
          
          {/* 404 Sayfası */}
          <Route path="*" element={
            <div className="text-center py-20">
              <h2 className="text-4xl font-bold mb-4">404 - Sayfa Bulunamadı</h2>
              <Link to="/" className="text-purple-400 hover:underline">Ana Sayfaya Dön</Link>
            </div>
          } />
        </Routes>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; 2026 Oyuncu Kantinim. Tüm hakları saklıdır.
        </div>
      </footer>

    </div>
  );
}

export default App;