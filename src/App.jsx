import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, ShoppingBag, Store, User, Search, Heart, 
  Star, ChevronRight, Menu, X, ShieldCheck, Zap, 
  Flame, ShoppingCart, Trash2, CheckCircle2,
  Upload, Image as ImageIcon, Plus, Check, ImagePlus, XCircle,
  Sparkles, Bot, Send, MessageCircle,
  Wallet, Package, Settings, LogOut, Mail, Lock, List, Calculator
} from 'lucide-react';
const API_URL = "https://api.oyuncukantinim.com.tr/api.php";
// --- SAHTE VERİLER (MOCK DATA) ---

const GAMES = [
  { id: 1, name: "Valorant", color: "from-red-400 to-rose-500", emoji: "🔫", subcategories: [{name: "Hesap", commission: 10}, {name: "Boost", commission: 15}, {name: "VP (E-Pin)", commission: 3}] },
  { id: 2, name: "League of Legends", color: "from-blue-400 to-cyan-500", emoji: "⚔️", subcategories: [{name: "Hesap", commission: 10}, {name: "Koçluk", commission: 12}, {name: "RP (E-Pin)", commission: 3}] },
  { id: 3, name: "Roblox", color: "from-zinc-400 to-zinc-600", emoji: "🧱", subcategories: [{name: "Pet/İtem", commission: 8}, {name: "Hesap", commission: 10}, {name: "Robux", commission: 5}] },
  { id: 4, name: "Minecraft", color: "from-emerald-400 to-green-500", emoji: "⛏️", subcategories: [{name: "Premium Hesap", commission: 8}, {name: "Sunucu (Server)", commission: 5}, {name: "İtem/Pelerin", commission: 10}] },
  { id: 5, name: "Genshin Impact", color: "from-fuchsia-400 to-purple-500", emoji: "✨", subcategories: [{name: "Hesap", commission: 12}, {name: "Boost", commission: 15}, {name: "Kristal", commission: 4}] },
];

const EPINS = [
  { id: 101, game: "Valorant", title: "115 Valorant Points", price: 30.00, oldPrice: 35.00, image: "💎", tag: "%15 İndirim" },
  { id: 102, game: "Valorant", title: "485 Valorant Points", price: 130.00, oldPrice: 150.00, image: "💎", tag: "Popüler" },
  { id: 103, game: "League of Legends", title: "850 Riot Points", price: 150.00, oldPrice: null, image: "🪙", tag: null },
  { id: 104, game: "Roblox", title: "800 Robux", price: 200.00, oldPrice: 220.00, image: "💰", tag: "Hızlı Teslimat" },
  { id: 105, game: "Minecraft", title: "Premium Java & Bedrock", price: 550.00, oldPrice: null, image: "⛏️", tag: "Resmi Kod" },
  { id: 106, game: "Genshin Impact", title: "Blessing of the Welkin Moon", price: 120.00, oldPrice: null, image: "🌙", tag: null },
];

const INITIAL_LISTINGS = [
  { id: 201, game: "Valorant", title: "Asil Vandal + Yağmacı Bıçaklı Unranked Hesap", seller: "KediGamer", price: 450.00, type: "Hesap", rating: 4.9, avatar: "🐱", images: ["https://picsum.photos/seed/val1/600/400", "https://picsum.photos/seed/val2/600/400"], coverIndex: 0, description: "İlk maili ile verilecektir. İçinde Asil Vandal ve Yağmacı bıçak var. Derecesiz." },
  { id: 202, game: "Minecraft", title: "Hypixel MVP+ Ranklı Eski Tarihli Hesap", seller: "KüpKafa", price: 200.00, type: "Hesap", rating: 5.0, avatar: "🧊", images: ["https://picsum.photos/seed/mc1/600/400"], coverIndex: 0, description: "2015 kayıtlı, banı bulunmayan temiz premium hesap." },
  { id: 203, game: "League of Legends", title: "Platin 1 (Elmas MMR) Şirin Kostümlü Smurf", seller: "UykuluPanda", price: 350.00, type: "Hesap", rating: 4.5, avatar: "🐼", images: ["https://picsum.photos/seed/lol1/600/400", "https://picsum.photos/seed/lol2/600/400", "https://picsum.photos/seed/lol3/600/400"], coverIndex: 1, description: "Kostüm ağırlıklı smurf hesaptır. MMR'ı çok yüksektir." },
  { id: 204, game: "Roblox", title: "Adopt Me! Efsanevi Neon Pet", seller: "YıldızTozu", price: 150.00, type: "İtem", rating: 4.8, avatar: "⭐", images: ["https://picsum.photos/seed/rbx1/600/400"], coverIndex: 0, description: "Hızlı teslimat, takas ile anında verilir." },
];

// --- GEMINI API YARDIMCI FONKSİYONU ---
const callGeminiApi = async (prompt) => {
  const apiKey = ""; // Ortam tarafından otomatik sağlanır
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  let retries = 5;
  let delay = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Bir sorun oluştu.";
    } catch (error) {
      if (i === retries - 1) return "Üzgünüm, şu an sunucu ile bağlantı kuramıyorum 🐾";
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

// --- ANA UYGULAMA BİLEŞENİ ---

export default function OyuncuKantinimApp() {
  const [currentPage, setCurrentPage] = useState('home'); // home, store, market, cart, profile, login, listing-detail
  const [cart, setCart] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  // YENİ EKLENEN STATE'LER
  const [listingsData, setListingsData] = useState(INITIAL_LISTINGS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [viewedListing, setViewedListing] = useState(null); // Detay sayfası için eklendi

  // KULLANICI STATE'İ (Yeni)
  const [currentUser, setCurrentUser] = useState(() => {
  const savedUser = localStorage.getItem('user');
  return savedUser ? JSON.parse(savedUser) : null;
});

  // KANTİNBOT STATE'LERİ
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [botMessages, setBotMessages] = useState([{ sender: 'bot', text: 'Merhaba! Ben KantinBot 🐾 Sana pazarda nasıl yardımcı olabilirim?' }]);
  const [userMessage, setUserMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Sepete ekleme fonksiyonu
  const addToCart = (item, isListing = false) => {
    setCart([...cart, { ...item, cartId: Math.random().toString(), isListing }]);
    showToast(`${item.title} sepete eklendi! 💖`);
  };

  // Sepetten çıkarma fonksiyonu
  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  // Toast mesajı gösterimi (Bildirim)
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toplam sepet tutarı
  const cartTotal = cart.reduce((total, item) => total + item.price, 0);

  // Sayfa Değiştirme Yönlendiricisi
  const navigateTo = (page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

// --- 3. ADIM: ÇIKIŞ YAPMA FONKSİYONU ---
const handleLogout = () => {
  localStorage.removeItem('user'); // Hafızayı sil
  setCurrentUser(null);           // State'i boşalt
  navigateTo('home');             // Eve dön
  showToast("Yine bekleriz! 👋");
};
  
  // İlan Ekleme Fonksiyonu
  const handleAddListing = (newListing) => {
    const sellerName = currentUser ? currentUser.username : "Misafir";
    const sellerAvatar = currentUser ? currentUser.avatar : "👤";
    
    setListingsData([{ ...newListing, id: Date.now(), seller: sellerName, rating: 5.0, avatar: sellerAvatar }, ...listingsData]);
    setIsAddModalOpen(false);
    showToast("İlanın başarıyla pazara eklendi! 🚀");
  };

  // --- ALT SAYFA BİLEŞENLERİ ---

  // 1. ANA SAYFA
  const HomePage = () => (
    <div className="space-y-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 sm:p-12 shadow-xl shadow-purple-500/20">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-white text-sm font-semibold backdrop-blur-sm mb-4">
            ✨ Oyuncu Kantinim'e Hoş Geldin!
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Oyun İhtiyaçların İçin <br/> En Şirin Durak
          </h1>
          <p className="text-lg text-purple-100 mb-8 max-w-lg">
            Ucuz E-Pinler, güvenilir oyuncu hesapları ve eşyaları burada. Hemen oynamaya başla!
          </p>
          <div className="flex gap-4">
            <button onClick={() => navigateTo('store')} className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold hover:bg-purple-50 transition-all shadow-lg hover:-translate-y-1">
              Mağazaya Git
            </button>
            <button onClick={() => navigateTo('market')} className="bg-purple-700/50 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700/70 backdrop-blur-md transition-all">
              İlanları Keşfet
            </button>
          </div>
        </div>
        {/* Dekoratif Şekiller */}
        <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Gamepad2 size={300} />
        </div>
        <div className="absolute top-10 right-20 text-6xl animate-bounce">
          🎮
        </div>
      </div>

      {/* Popüler Oyunlar */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Flame className="text-orange-500" /> Popüler Oyunlar
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {GAMES.map(game => (
            <div key={game.id} className={`bg-gradient-to-br ${game.color} p-1 rounded-2xl cursor-pointer hover:scale-105 transition-transform shadow-lg`}>
              <div className="bg-white/10 backdrop-blur-sm h-full w-full rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-2">{game.emoji}</span>
                <span className="text-white font-bold text-sm">{game.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* E-Pin Vitrini */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="text-yellow-500" /> İndirimli E-Pinler
          </h2>
          <button onClick={() => navigateTo('store')} className="text-purple-500 font-semibold hover:text-purple-700 flex items-center text-sm">
            Tümünü Gör <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {EPINS.slice(0, 4).map(epin => (
            <EPinCard key={epin.id} epin={epin} onAdd={() => addToCart(epin)} />
          ))}
        </div>
      </section>

      {/* Son İlanlar Vitrini */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User className="text-blue-500" /> Son Oyuncu İlanları
          </h2>
          <button onClick={() => navigateTo('market')} className="text-purple-500 font-semibold hover:text-purple-700 flex items-center text-sm">
            Tümünü Gör <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listingsData.slice(0, 4).map(listing => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              onAdd={(e) => { e.stopPropagation(); addToCart(listing, true); }} 
              onImageClick={(e) => { e.stopPropagation(); setSelectedListing(listing); }} 
              onTitleClick={(e) => { e.stopPropagation(); setViewedListing(listing); navigateTo('listing-detail'); }}
            />
          ))}
        </div>
      </section>
    </div>
  );

  // 2. E-PİN MAĞAZASI (STORE)
  const StorePage = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-900 mb-2">Resmi E-Pin Mağazası</h1>
          <p className="text-indigo-700">Güvenli ve anında teslimat garantili dijital kodlar.</p>
        </div>
        <div className="hidden md:block text-5xl">💎</div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {EPINS.map(epin => (
          <EPinCard key={epin.id} epin={epin} onAdd={() => addToCart(epin)} />
        ))}
      </div>
    </div>
  );

  // 3. OYUNCU PAZARI (MARKET)
  const MarketPage = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-rose-900 mb-2">Oyuncu Pazarı</h1>
          <p className="text-rose-700">Diğer oyunculardan hesap, eşya ve boost hizmeti satın al.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-rose-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/30 flex items-center gap-2"
        >
          <Plus size={20} /> İlan Ekle
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listingsData.map(listing => (
          <ListingCard 
            key={listing.id} 
            listing={listing} 
            onAdd={(e) => { e.stopPropagation(); addToCart(listing, true); }} 
            onImageClick={(e) => { e.stopPropagation(); setSelectedListing(listing); }} 
            onTitleClick={(e) => { e.stopPropagation(); setViewedListing(listing); navigateTo('listing-detail'); }}
          />
        ))}
      </div>
    </div>
  );

  // 4. SEPET (CART)
  const CartPage = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
        <ShoppingCart className="text-purple-500" size={32} /> Sepetim
      </h1>
      
      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Sepetin şu an boş!</h2>
          <p className="text-slate-500 mb-6">Hemen mağazayı veya pazarı gezerek sepetini doldurabilirsin.</p>
          <button onClick={() => navigateTo('store')} className="bg-purple-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-purple-600 transition-all shadow-md shadow-purple-500/30">
            Alışverişe Başla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.cartId} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-3xl">
                  {item.image || item.avatar || "📦"}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-purple-500 mb-1">{item.game}</div>
                  <h3 className="font-bold text-slate-800 line-clamp-1">{item.title}</h3>
                  {item.isListing && <p className="text-xs text-slate-500 mt-1">Satıcı: {item.seller}</p>}
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-slate-800">{item.price.toFixed(2)} ₺</div>
                  <button onClick={() => removeFromCart(item.cartId)} className="text-rose-400 hover:text-rose-600 text-sm flex items-center gap-1 justify-end mt-2 transition-colors">
                    <Trash2 size={14} /> Kaldır
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Sipariş Özeti</h3>
              <div className="space-y-3 text-sm text-slate-600 mb-6">
                <div className="flex justify-between">
                  <span>Ürünler ({cart.length})</span>
                  <span className="font-bold text-slate-800">{cartTotal.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between">
                  <span>Hizmet Bedeli</span>
                  <span className="font-bold text-green-500">Ücretsiz</span>
                </div>
                <hr className="border-slate-100 my-4" />
                <div className="flex justify-between text-lg">
                  <span className="font-extrabold text-slate-800">Toplam</span>
                  <span className="font-extrabold text-purple-600">{cartTotal.toFixed(2)} ₺</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setCart([]);
                  if (currentUser) {
                     setCurrentUser({...currentUser, balance: currentUser.balance - cartTotal});
                  }
                  showToast("Siparişin başarıyla tamamlandı! 🎉");
                  navigateTo('home');
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} /> Ödemeyi Tamamla
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={14} /> 100% Güvenli Ödeme
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // --- KÜÇÜK BİLEŞENLER (CARDS) ---

  const EPinCard = ({ epin, onAdd }) => (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all group flex flex-col h-full relative overflow-hidden">
      {epin.tag && (
        <span className="absolute top-4 right-4 bg-pink-100 text-pink-600 text-xs font-extrabold px-3 py-1 rounded-full z-10">
          {epin.tag}
        </span>
      )}
      <div className="w-full h-32 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-500">
        {epin.image}
      </div>
      <div className="text-xs font-bold text-purple-500 mb-1">{epin.game}</div>
      <h3 className="font-bold text-slate-800 mb-4 line-clamp-2 flex-1 leading-tight">{epin.title}</h3>
      <div className="flex items-end justify-between mt-auto">
        <div>
          {epin.oldPrice && (
            <div className="text-xs text-slate-400 line-through mb-0.5">{epin.oldPrice.toFixed(2)} ₺</div>
          )}
          <div className="text-xl font-extrabold text-slate-800">{epin.price.toFixed(2)} ₺</div>
        </div>
        <button 
          onClick={onAdd}
          className="bg-purple-100 text-purple-600 p-3 rounded-xl hover:bg-purple-500 hover:text-white transition-colors"
          title="Sepete Ekle"
        >
          <ShoppingBag size={20} />
        </button>
      </div>
    </div>
  );

  const ListingCard = ({ listing, onAdd, onImageClick, onTitleClick }) => (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 hover:shadow-xl hover:border-purple-200 transition-all flex flex-col h-full relative group">
      {/* Kapak Fotoğrafı Alanı */}
      <div 
        onClick={onImageClick}
        className="w-full h-40 bg-slate-100 rounded-2xl mb-4 overflow-hidden relative cursor-pointer"
        title="Fotoğrafları Önizle"
      >
        {listing.images && listing.images.length > 0 ? (
          <img 
            src={listing.images[listing.coverIndex || 0]} 
            alt={listing.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ImageIcon size={40} />
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-md flex items-center gap-1">
          <ImageIcon size={12} /> {listing.images?.length || 0}
        </div>
      </div>

      <div className="flex justify-between items-start mb-3 pointer-events-none">
        <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full pointer-events-auto">
          {listing.type}
        </span>
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 pointer-events-auto">
          {listing.game}
        </span>
      </div>
      
      <h3 
        onClick={onTitleClick}
        className="font-bold text-slate-800 mb-3 line-clamp-2 leading-tight flex-1 text-lg group-hover:text-purple-600 transition-colors cursor-pointer hover:underline"
        title="İlan Detayına Git"
      >
        {listing.title}
      </h3>
      
      <div className="flex items-center gap-3 mb-4 bg-slate-50 p-2.5 rounded-2xl">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">
          {listing.avatar}
        </div>
        <div>
          <div className="text-xs font-bold text-slate-800">{listing.seller}</div>
          <div className="flex items-center text-[10px] text-yellow-500 font-bold">
            <Star size={10} className="fill-current mr-1" /> {listing.rating} Puan
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
        <div className="text-xl font-extrabold text-slate-800">{listing.price.toFixed(2)} ₺</div>
        <button 
          onClick={onAdd}
          className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-600 transition-colors shadow-md z-10"
        >
          Satın Al
        </button>
      </div>
    </div>
  );

  // --- YENİ EKLENEN DETAY SAYFASI ---
  
  const ListingDetailPage = () => {
    if (!viewedListing) return null;
    const { images, title, price, seller, type, game, rating, avatar, coverIndex, description } = viewedListing;
    const displayImages = images && images.length > 0 ? images : ["https://picsum.photos/seed/placeholder/800/600"];
    const [activeImgIndex, setActiveImgIndex] = useState(coverIndex || 0);

    return (
      <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button 
          onClick={() => navigateTo('market')} 
          className="mb-6 text-slate-500 hover:text-purple-600 font-bold flex items-center gap-2 transition-colors"
        >
          <ChevronRight className="rotate-180" size={20} /> Pazara Dön
        </button>
        
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sm:p-8 flex flex-col lg:flex-row gap-8">
          {/* Fotoğraf Galerisi */}
          <div className="w-full lg:w-1/2 space-y-4">
            <div className="w-full aspect-video bg-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <img src={displayImages[activeImgIndex]} alt="Listing" className="w-full h-full object-cover" />
            </div>
            {displayImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {displayImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImgIndex(idx)}
                    className={`flex-shrink-0 w-24 aspect-video rounded-xl overflow-hidden border-2 transition-all ${activeImgIndex === idx ? 'border-purple-400 opacity-100 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detaylar */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-extrabold px-3 py-1.5 rounded-full">{type}</span>
              <span className="text-slate-500 text-sm font-bold flex items-center gap-1"><Gamepad2 size={14}/> {game}</span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-800 mb-4 leading-tight">{title}</h1>
            
            <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl">
                {avatar}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 mb-1">Satıcı: {seller}</div>
                <div className="flex items-center text-xs font-bold text-yellow-500 bg-yellow-50 px-2 py-1 rounded-md w-max">
                  <Star size={12} className="fill-current mr-1" /> {rating} / 5.0
                </div>
              </div>
            </div>

            <div className="mb-8 flex-1">
              <h3 className="font-bold text-slate-800 mb-3 text-lg">İlan Açıklaması</h3>
              <div className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 whitespace-pre-wrap min-h-[120px]">
                {description || "Satıcı bu ilan için ek bir açıklama girmemiş."}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
              <div>
                <div className="text-sm font-medium text-slate-500 mb-1">Fiyat</div>
                <div className="text-4xl font-extrabold text-slate-800">{price.toFixed(2)} ₺</div>
              </div>
              <button 
                onClick={() => addToCart(viewedListing, true)}
                className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2"
              >
                <ShoppingCart size={20} /> Sepete Ekle
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- YENİ SAYFALAR (LOGIN VE PROFIL) ---

// 5. GİRİŞ YAP / KAYIT OL SAYFASI
  const LoginPage = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);

const handleAuth = async (e) => {
    e.preventDefault();
    const isLogin = e.target.closest('.max-w-md').querySelector('h1').innerText === "Giriş Yap";
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    const username = !isLogin ? e.target.querySelector('input[type="text"]').value : null;

    const action = isLogin ? 'login' : 'register';
    const payload = isLogin ? { email, password, username };

    try {
      const response = await fetch(`${API_URL}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.status === 'success') {
        if (isLogin) {
          setCurrentUser(result.user);
          localStorage.setItem('user', JSON.stringify(result.user)); // Kalıcı oturum
          showToast("Hoş geldin! 🐾");
          navigateTo('profile');
        } else {
          alert("Kayıt başarılı! Şimdi giriş yapabilirsin.");
          // Kayıt sonrası otomatik giriş moduna geçirebiliriz
        }
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert("API hatası! api.php dosyanızı kontrol edin.");
    }
  };

    return (
      <div className="max-w-md mx-auto py-12 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
          {/* Arka plan dekorasyonu */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-12 shadow-lg shadow-purple-500/30">
                <Gamepad2 className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
                {isLoginMode ? "Giriş Yap" : "Kayıt Ol"}
              </h1>
              <p className="text-slate-500 font-medium">
                {isLoginMode ? "Maceraya kaldığın yerden devam et!" : "Oyuncu Kantinim ailesine katılmaya hazır mısın?"}
              </p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
              <button 
                onClick={() => setIsLoginMode(true)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${isLoginMode ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Giriş Yap
              </button>
              <button 
                onClick={() => setIsLoginMode(false)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${!isLoginMode ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Kayıt Ol
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Kullanıcı Adı</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input required type="text" placeholder="Gamer adın..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none font-medium transition-all" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="email" placeholder="E-posta adresin..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none font-medium transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input required type="password" placeholder="Şifren..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none font-medium transition-all" />
                </div>
              </div>
              {isLoginMode && (
                <div className="text-right">
                  <button type="button" className="text-xs font-bold text-purple-500 hover:text-purple-700">Şifremi Unuttum</button>
                </div>
              )}
              
              <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-purple-700 shadow-lg shadow-purple-500/30 transition-all mt-4">
                {isLoginMode ? "Giriş Yap" : "Hesap Oluştur"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

// 6. KULLANICI PROFİL SAYFASI
  const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState('listings');
    
// ProfilePage fonksiyonunun içine ekle
const [editUsername, setEditUsername] = useState(currentUser?.username || "");

const handleUpdateProfile = async () => {
  const response = await fetch(`${API_URL}?action=update_profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: currentUser.id,
      new_username: editUsername
    })
  });
  const result = await response.json();
  if (result.status === 'success') {
    setCurrentUser({ ...currentUser, username: editUsername });
    showToast("İsim veritabanında güncellendi! ✨");
  }
};
    // BURADA BİTİR.

    if (!currentUser) {
      navigateTo('login');
      return null;
    }

    const userListings = listingsData.filter(listing => listing.seller === currentUser.username);

    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Üst Profil Kartı */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          {/* Cover Fotoğrafı (Gradient) */}
          <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
            <button className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl backdrop-blur-md transition-colors">
              <ImageIcon size={20} />
            </button>
          </div>
          
          <div className="px-6 sm:px-10 pb-8 relative">
            {/* Avatar & Temel Bilgiler */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 mb-6">
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-3xl p-2 shadow-lg relative z-10">
                  <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-6xl">
                    {currentUser.avatar}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-extrabold px-3 py-1 rounded-full border-4 border-white z-20 shadow-sm">
                  Lv. {currentUser.level}
                </div>
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-extrabold text-slate-800">{currentUser.username}</h1>
                <p className="text-slate-500 font-medium text-sm flex items-center justify-center sm:justify-start gap-1 mt-1">
                  <ShieldCheck size={16} className="text-green-500"/> Doğrulanmış Satıcı • {currentUser.joinDate}'den beri üye
                </p>
              </div>

              {/* Bakiye Kartı */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                  <Wallet size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500">Cüzdan Bakiyesi</div>
                  <div className="text-xl font-extrabold text-slate-800">{currentUser.balance.toFixed(2)} ₺</div>
                </div>
                <button className="ml-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-colors">
                  Yükle
                </button>
              </div>
            </div>

            {/* XP Bar */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-600">Seviye {currentUser.level}</span>
                <span className="text-purple-600">{currentUser.xp}% XP</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full" 
                  style={{ width: `${currentUser.xp}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">Bir sonraki seviyeye ulaşmak için pazarda aktif olmaya devam et!</p>
            </div>
          </div>
        </div>

        {/* Profil Alt Sekmeleri */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sol Menü */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-2">
            <button 
              onClick={() => setActiveTab('listings')}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'listings' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
            >
              <List size={20} /> İlanlarım
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'orders' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
            >
              <Package size={20} /> Siparişlerim
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}
            >
              <Settings size={20} /> Hesap Ayarları
            </button>

            
{/* Profil sayfasındaki butonlar listesinde "Çıkış Yap" butonunu bul ve bu hale getir: */}
<button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all mt-4">
  <LogOut size={20} /> Çıkış Yap
</button>
          </div>

          {/* Sağ İçerik Alanı */}
          <div className="flex-1 bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100 min-h-[400px]">
            
            {/* Sekme: İlanlarım */}
            {activeTab === 'listings' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-extrabold text-slate-800">Yayındaki İlanların</h2>
                  <button onClick={() => setIsAddModalOpen(true)} className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 hover:bg-rose-600 transition-colors shadow-sm">
                    <Plus size={16} /> Yeni Ekle
                  </button>
                </div>
                {userListings.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="text-4xl mb-3">🏪</div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">Henüz ilan eklemedin</h3>
                    <p className="text-sm text-slate-500 mb-4">Eşyalarını veya hesaplarını satarak para kazanmaya başla.</p>
                    <button onClick={() => setIsAddModalOpen(true)} className="text-purple-600 font-bold hover:underline">Hemen İlk İlanını Ekle</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userListings.map(listing => (
                      <ListingCard 
                        key={listing.id} 
                        listing={listing} 
                        onAdd={(e) => { e.stopPropagation(); showToast("Bu senin kendi ilanın!"); }} 
                        onImageClick={(e) => { e.stopPropagation(); setSelectedListing(listing); }} 
                        onTitleClick={(e) => { e.stopPropagation(); setViewedListing(listing); navigateTo('listing-detail'); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sekme: Siparişlerim */}
            {activeTab === 'orders' && (
              <div className="animate-in fade-in duration-300 text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Siparişin bulunmuyor</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">Satın aldığın e-pinler ve hesaplar burada listelenecek.</p>
                <button onClick={() => navigateTo('store')} className="bg-purple-100 text-purple-700 px-6 py-3 rounded-xl font-bold hover:bg-purple-200 transition-colors">
                  Mağazayı Keşfet
                </button>
              </div>
            )}

            {/* Sekme: Ayarlar */}
            {activeTab === 'settings' && (
              <div className="animate-in fade-in duration-300 space-y-6 max-w-lg">
                <h2 className="text-xl font-extrabold text-slate-800 mb-6">Hesap Ayarları</h2>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Görünür İsim (Kullanıcı Adı)</label>
                  <input type="text" defaultValue={currentUser.username} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none font-medium" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-Posta Adresi</label>
                  <input type="email" defaultValue={currentUser.email} disabled className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-xl px-4 py-3 cursor-not-allowed font-medium" />
                  <p className="text-[10px] text-slate-400 mt-1">Güvenlik gereği e-posta adresin değiştirilemez.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Yeni Şifre</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none font-medium" />
                </div>

                <button className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all w-full sm:w-auto shadow-md">
                  Değişiklikleri Kaydet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- YENİ MODALLAR ---

  // 1. İlan Ekleme Modalı
  const AddListingModalContent = () => {
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [game, setGame] = useState(GAMES[0].name);
    const [subCategory, setSubCategory] = useState(GAMES[0].subcategories[0].name);
    const [photos, setPhotos] = useState([]);
    const [coverIndex, setCoverIndex] = useState(0);
    const [description, setDescription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGameChange = (e) => {
      const newGame = e.target.value;
      setGame(newGame);
      const gameObj = GAMES.find(g => g.name === newGame);
      if (gameObj && gameObj.subcategories?.length > 0) {
        setSubCategory(gameObj.subcategories[0].name);
      } else {
        setSubCategory("");
      }
    };

    // Komisyon Hesaplamaları
    const currentGameObj = GAMES.find(g => g.name === game);
    const currentSubObj = currentGameObj?.subcategories?.find(s => s.name === subCategory);
    const commissionRate = currentSubObj ? currentSubObj.commission : 0;
    const parsedPrice = parseFloat(price) || 0;
    const commissionFee = parsedPrice * (commissionRate / 100);
    const netEarnings = parsedPrice - commissionFee;

    const handlePhotoChange = (e) => {
      const files = Array.from(e.target.files);
      if (photos.length + files.length > 5) {
        alert("En fazla 5 fotoğraf ekleyebilirsin!");
        return;
      }
      // Demo amaçlı yüklenen dosyaları anlık görüntülemek için URL oluşturuyoruz
      const newPhotos = files.map(file => URL.createObjectURL(file));
      setPhotos([...photos, ...newPhotos]);
    };

    const removePhoto = (index) => {
      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);
      if (coverIndex === index) setCoverIndex(0);
      else if (coverIndex > index) setCoverIndex(coverIndex - 1);
    };



    
const handleSubmit = async (e) => { // Buraya async eklemeyi unutma
      e.preventDefault();
      
      if (!title || !price || photos.length === 0) {
        alert("Lütfen başlık, fiyat gir ve en az 1 fotoğraf ekle!");
        return;
      }

const listingData = {
        seller_id: currentUser.id, 
        game_name: game,
        category: subCategory || "Diğer",
        title: title,
        price: parseFloat(price),
        description: description || "Yeni ilan eklendi.",
        images: photos 
      };

try {
        const response = await fetch(`${API_URL}?action=add_listing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(listingData)
        });

        const result = await response.json();

if (result.status === 'success') {
          setIsAddModalOpen(false);
          showToast("İlanın başarıyla kaydedildi! 🚀");
          
          fetch(`${API_URL}?action=get_listings`)
            .then(res => res.json())
            .then(res => {
              if(res.status === 'success') setListingsData(res.data);
            });
            
        } else {
          alert("Hata: " + result.message);
        }
      } catch (err) {
        alert("Bağlantı hatası! API çalışıyor mu kontrol et.");
      }
    };


    
    const handleGenerateDescription = async () => {
      if (!title || !game) {
        alert("Lütfen önce oyun seçip başlık girin! Ben de ona göre yazabileyim.");
        return;
      }
      setIsGenerating(true);
      const prompt = `Sen 'Oyuncu Kantinim' adlı şirin bir oyun pazaryerinde satış uzmanısın. Kullanıcı şu ilanı satmak istiyor:\nOyun: ${game}\nKategori: ${subCategory}\nBaşlık: ${title}\nFiyat: ${price || "Belirtilmemiş"} TL\nLütfen bu ilan için alıcıları cezbedecek, güven veren, bol emojili ve oldukça şirin bir dille yazılmış kısa bir ilan açıklaması oluştur. Maksimum 3-4 cümle olsun. Sadece açıklamayı ver.`;
      const result = await callGeminiApi(prompt);
      setDescription(result.replace(/["']/g, "").trim());
      setIsGenerating(false);
    };

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-extrabold text-slate-800">Yeni İlan Ekle</h2>
            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">İlan Başlığı</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Yağmacı Vandal Hesap" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all font-medium" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Oyun</label>
                  <select value={game} onChange={handleGameChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all font-medium">
                    {GAMES.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Alt Kategori</label>
                  <select value={subCategory} onChange={e => setSubCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all font-medium">
                    {currentGameObj?.subcategories?.map((sub, idx) => (
                      <option key={idx} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Fiyat (₺)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all font-medium" />
                
                {/* Komisyon ve Net Kazanç Göstergesi */}
                <div className={`mt-3 transition-all duration-300 overflow-hidden ${parsedPrice > 0 ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-purple-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium flex items-center gap-1">
                        <Calculator size={14} className="text-purple-500" /> Platform Komisyonu (%{commissionRate})
                      </span>
                      <span className="text-rose-500 font-bold">-{commissionFee.toFixed(2)} ₺</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-purple-200/50 pt-2">
                      <span className="text-slate-800 font-extrabold text-sm">Net Kazancın</span>
                      <span className="text-green-600 font-extrabold text-lg">{netEarnings.toFixed(2)} ₺</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yapay Zeka ile Açıklama Alanı */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-slate-700">İlan Açıklaması</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="text-xs font-bold text-purple-600 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} /> 
                    {isGenerating ? "Yazılıyor..." : "✨ Büyülü Açıklama Yaz"}
                  </button>
                </div>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="İlanının detaylarını buraya yaz veya yapay zekaya yazdır..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all font-medium min-h-[100px] resize-y"
                />
              </div>
            </div>

            {/* Fotoğraf Yükleme Alanı */}
            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-indigo-900">Fotoğraflar ({photos.length}/5)</label>
                <span className="text-xs text-indigo-500 font-medium">Seçtiğin 1 fotoğraf kapak olur.</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className={`relative aspect-video rounded-xl overflow-hidden border-2 group ${coverIndex === index ? 'border-purple-500 shadow-md' : 'border-transparent'}`}>
                    <img src={photo} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                    
                    {/* Hover Araçları */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <button type="button" onClick={() => removePhoto(index)} className="self-end text-white hover:text-rose-400 drop-shadow-md">
                        <XCircle size={18} />
                      </button>
                      {coverIndex !== index && (
                        <button type="button" onClick={() => setCoverIndex(index)} className="bg-white/90 text-slate-800 text-xs font-bold py-1 px-2 rounded-lg backdrop-blur-sm self-center hover:bg-purple-500 hover:text-white transition-colors">
                          Kapak Yap
                        </button>
                      )}
                    </div>

                    {/* Kapak Etiketi */}
                    {coverIndex === index && (
                      <div className="absolute bottom-2 left-2 bg-purple-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-md shadow-sm flex items-center gap-1 pointer-events-none">
                        <Star size={10} className="fill-current" /> KAPAK
                      </div>
                    )}
                  </div>
                ))}
                
                {photos.length < 5 && (
                  <label className="aspect-video bg-white border-2 border-dashed border-indigo-200 rounded-xl flex flex-col items-center justify-center text-indigo-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all">
                    <ImagePlus size={24} className="mb-1" />
                    <span className="text-xs font-bold">Fotoğraf Ekle</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/30 transition-all">
              İlanı Yayınla
            </button>
          </form>
        </div>
      </div>
    );
  };

  // 2. İlan Detay Modalı (Galeri Görüntüleyici)
  const ListingDetailModal = () => {
    if (!selectedListing) return null;
    const { images, title, price, seller, type, game, rating, avatar, coverIndex } = selectedListing;
    const displayImages = images && images.length > 0 ? images : ["https://picsum.photos/seed/placeholder/800/600"];
    const [activeImgIndex, setActiveImgIndex] = useState(coverIndex || 0);

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col lg:flex-row relative">
          
          <button onClick={() => setSelectedListing(null)} className="absolute top-4 right-4 z-10 bg-black/10 hover:bg-black/20 text-slate-800 p-2 rounded-full backdrop-blur-md transition-colors">
            <X size={20} />
          </button>

          {/* Sol: Fotoğraf Galerisi */}
          <div className="w-full lg:w-3/5 bg-slate-950 p-4 sm:p-6 flex flex-col gap-4 rounded-t-[2rem] lg:rounded-l-[2rem] lg:rounded-tr-none">
            {/* Ana Fotoğraf */}
            <div className="w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden relative">
              <img src={displayImages[activeImgIndex]} alt="Listing preview" className="w-full h-full object-contain" />
              {activeImgIndex === (coverIndex || 0) && (
                 <span className="absolute top-4 left-4 bg-purple-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-md">
                   Kapak Fotoğrafı
                 </span>
              )}
            </div>
            {/* Küçük Fotoğraflar (Thumbnails) */}
            {displayImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {displayImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImgIndex(idx)}
                    className={`flex-shrink-0 w-24 aspect-video rounded-xl overflow-hidden border-2 transition-all ${activeImgIndex === idx ? 'border-purple-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sağ: İlan Detayları */}
          <div className="w-full lg:w-2/5 p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-extrabold px-3 py-1.5 rounded-full">{type}</span>
              <span className="text-slate-500 text-sm font-bold flex items-center gap-1"><Gamepad2 size={14}/> {game}</span>
            </div>
            
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 leading-tight">{title}</h2>
            
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl">
                  {avatar}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 mb-1">Satıcı: {seller}</div>
                  <div className="flex items-center text-xs font-bold text-yellow-500 bg-yellow-50 px-2 py-1 rounded-md w-max">
                    <Star size={12} className="fill-current mr-1" /> {rating} / 5.0
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-slate-800 mb-2">Açıklama</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {selectedListing.description || "Satıcı bu ilan için ek bir açıklama girmemiş."}
              </p>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500 mb-1">Fiyat</div>
                <div className="text-3xl font-extrabold text-slate-800">{price.toFixed(2)} ₺</div>
              </div>
              <button 
                onClick={() => {
                  addToCart(selectedListing, true);
                  setSelectedListing(null);
                }}
                className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2"
              >
                <ShoppingCart size={20} /> Sepete Ekle
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 3. PatiBot Yapay Zeka Asistanı
  const PatiBot = () => {
    const handleSendMessage = async (e) => {
      e.preventDefault();
      if (!userMessage.trim()) return;

      const newMessages = [...botMessages, { sender: 'user', text: userMessage }];
      setBotMessages(newMessages);
      setUserMessage('');
      setIsBotTyping(true);

      const prompt = `Sen Oyuncu Kantinim adlı şirin oyun pazaryerinde yapay zeka asistanı 'KantinBot'sun. Şirin, yardımsever bir oyuncu dili kullan (bol emoji kullan). 
      Sitedeki güncel E-Pinler: ${JSON.stringify(EPINS.map(e => ({isim: e.title, fiyat: e.price})))}, 
      Sitedeki güncel İlanlar: ${JSON.stringify(listingsData.map(l => ({isim: l.title, fiyat: l.price, satici: l.seller})))}. 
      Kullanıcının mesajı: "${userMessage}". 
      Sadece sana verdiğim bu güncel ilan ve e-pin verilerine bakarak kullanıcıya mantıklı bir tavsiye veya cevap ver. İlgili ürünlerin fiyatlarını söyleyebilirsin. (Maksimum 3-4 cümle, çok sıcak ve samimi bir ton kullan.)`;

      const responseText = await callGeminiApi(prompt);
      setBotMessages([...newMessages, { sender: 'bot', text: responseText }]);
      setIsBotTyping(false);
    };

    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isBotOpen && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-80 sm:w-96 mb-4 overflow-hidden flex flex-col h-[400px] animate-in slide-in-from-bottom-5">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white flex justify-between items-center shadow-md z-10">
              <div className="flex items-center gap-2 font-bold">
                <Bot size={20} /> ✨ KantinBot
              </div>
              <button onClick={() => setIsBotOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={18}/></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
              {botMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-sm shadow-md' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isBotTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-500 p-3 rounded-2xl rounded-bl-sm shadow-sm text-sm flex gap-1">
                    <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input 
                type="text" 
                value={userMessage} 
                onChange={e => setUserMessage(e.target.value)} 
                placeholder="Ne arıyorsun? ✨" 
                className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-purple-400 focus:bg-white outline-none transition-all"
              />
              <button type="submit" disabled={isBotTyping || !userMessage.trim()} className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-md">
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
        <button 
          onClick={() => setIsBotOpen(!isBotOpen)}
          className={`${isBotOpen ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-600 to-pink-500 animate-bounce'} text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center`}
        >
          {isBotOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </button>
      </div>
    );
  };

  // --- ANA RENDER ---

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 selection:bg-purple-200 selection:text-purple-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => navigateTo('home')}
            >
              <div className="bg-gradient-to-tr from-purple-500 to-pink-500 p-2 rounded-2xl group-hover:rotate-12 transition-transform">
                <Gamepad2 className="text-white" size={28} />
              </div>
              <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500 tracking-tight">
                Oyuncu Kantinim
              </span>
            </div>

            {/* Desktop Menü */}
            <div className="hidden md:flex items-center space-x-1">
              <button 
                onClick={() => navigateTo('home')} 
                className={`px-4 py-2 rounded-full font-bold transition-all ${currentPage === 'home' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
              >
                Ana Sayfa
              </button>
              <button 
                onClick={() => navigateTo('store')} 
                className={`px-4 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${currentPage === 'store' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
              >
                <Store size={18} /> E-Pin
              </button>
              <button 
                onClick={() => navigateTo('market')} 
                className={`px-4 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${currentPage === 'market' ? 'bg-rose-100 text-rose-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
              >
                <User size={18} /> Oyuncu Pazarı
              </button>
            </div>

            {/* Sağ Araçlar */}
            <div className="hidden md:flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-slate-400" size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Oyun, e-pin ara..." 
                  className="bg-slate-100 border-transparent focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-200 rounded-full py-2 pl-10 pr-4 text-sm font-medium transition-all w-48 focus:w-64 placeholder-slate-400 outline-none"
                />
              </div>
              
              <button 
                onClick={() => navigateTo('cart')}
                className="relative p-2 text-slate-500 hover:text-purple-600 transition-colors bg-slate-100 hover:bg-purple-50 rounded-full"
              >
                <ShoppingCart size={22} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {cart.length}
                  </span>
                )}
              </button>
              
              {/* Giriş Yap / Kullanıcı Butonu Güncellemesi */}
              {currentUser ? (
                <button 
                  onClick={() => navigateTo('profile')}
                  className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 border border-purple-100 pl-2 pr-4 py-1.5 rounded-full transition-colors group"
                >
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm shadow-sm">
                    {currentUser.avatar}
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-bold text-slate-400 leading-none">Cüzdan</div>
                    <div className="text-sm font-extrabold text-purple-700 leading-tight">
                      {currentUser.balance.toFixed(2)} ₺
                    </div>
                  </div>
                </button>
              ) : (
                <button 
                  onClick={() => navigateTo('login')}
                  className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-full font-bold hover:bg-purple-600 transition-colors text-sm shadow-md"
                >
                  Giriş Yap
                </button>
              )}
            </div>

            {/* Mobil Menü Butonu */}
            <div className="md:hidden flex items-center gap-4">
              <button 
                onClick={() => navigateTo('cart')}
                className="relative p-2 text-slate-500"
              >
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                  <span className="absolute 0 right-0 bg-pink-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-500 p-1">
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobil Menü İçeriği */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 absolute w-full shadow-xl">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <button onClick={() => navigateTo('home')} className="block w-full text-left px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 rounded-xl">Ana Sayfa</button>
              <button onClick={() => navigateTo('store')} className="block w-full text-left px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 rounded-xl">E-Pin Mağazası</button>
              <button onClick={() => navigateTo('market')} className="block w-full text-left px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 rounded-xl">Oyuncu Pazarı</button>
              <div className="pt-4 px-4 border-t border-slate-100 mt-2">
                {currentUser ? (
                  <button onClick={() => navigateTo('profile')} className="w-full bg-purple-100 text-purple-700 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    {currentUser.avatar} Hesabım ({currentUser.balance.toFixed(2)} ₺)
                  </button>
                ) : (
                  <button onClick={() => navigateTo('login')} className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl font-bold">
                    Giriş Yap / Kayıt Ol
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Ana İçerik Alanı */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'store' && <StorePage />}
        {currentPage === 'market' && <MarketPage />}
        {currentPage === 'cart' && <CartPage />}
        {currentPage === 'listing-detail' && <ListingDetailPage />}
        {currentPage === 'login' && <LoginPage />}
        {currentPage === 'profile' && <ProfilePage />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Gamepad2 size={24} />
            <span className="font-extrabold text-xl tracking-tight">Oyuncu Kantinim</span>
          </div>
          <div className="text-slate-400 text-sm font-medium">
            © 2026 Oyuncu Kantinim. Tüm hakları saklıdır.
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-purple-100 hover:text-purple-500 cursor-pointer transition-colors"><Heart size={18} /></div>
          </div>
        </div>
      </footer>

      {/* Modallar ve Bildirimler */}
      {isAddModalOpen && <AddListingModalContent />}
      {selectedListing && <ListingDetailModal />}

      {/* PatiBot Asistan */}
      <PatiBot />

      {/* Global Toast Bildirimi */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle2 className="text-green-400" size={20} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
