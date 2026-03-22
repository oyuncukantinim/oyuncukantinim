import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, ShoppingBag, Store, User, Search, Heart, 
  Star, ChevronRight, Menu, X, ShieldCheck, Zap, 
  Flame, ShoppingCart, Trash2, CheckCircle2,
  Upload, Image as ImageIcon, Plus, Check, ImagePlus, XCircle,
  Sparkles, Bot, Send, MessageCircle,
  Wallet, Package, Settings, LogOut, Mail, Lock, List, Calculator
} from 'lucide-react';

// --- ARKA YÜZ BAĞLANTISI ---
const API_URL = "https://api.oyuncukantinim.com.tr/api.php";

const GAMES = [
  { id: 1, name: "Valorant", color: "from-red-400 to-rose-500", emoji: "🔫", subcategories: [{name: "Hesap", commission: 10}, {name: "Boost", commission: 15}, {name: "VP", commission: 3}] },
  { id: 2, name: "League of Legends", color: "from-blue-400 to-cyan-500", emoji: "⚔️", subcategories: [{name: "Hesap", commission: 10}, {name: "Koçluk", commission: 12}, {name: "RP", commission: 3}] },
  { id: 3, name: "Roblox", color: "from-zinc-400 to-zinc-600", emoji: "🧱", subcategories: [{name: "İtem", commission: 8}, {name: "Hesap", commission: 10}, {name: "Robux", commission: 5}] },
  { id: 4, name: "Minecraft", color: "from-emerald-400 to-green-500", emoji: "⛏️", subcategories: [{name: "Premium", commission: 8}, {name: "Sunucu", commission: 5}] },
  { id: 5, name: "Genshin Impact", color: "from-fuchsia-400 to-purple-500", emoji: "✨", subcategories: [{name: "Hesap", commission: 12}, {name: "Boost", commission: 15}] },
];

const callGeminiApi = async (prompt) => {
  const apiKey = ""; // Buraya Gemini API anahtarını ekleyebilirsin
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Şu an yanıt veremiyorum 🐾";
  } catch (error) {
    return "Bağlantı sorunu oluştu 🐾";
  }
};

export default function OyuncuKantinimApp() {
  const [currentPage, setCurrentPage] = useState('home');
  const [cart, setCart] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [listingsData, setListingsData] = useState([]);
  const [epinsData, setEpinsData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [botMessages, setBotMessages] = useState([{ sender: 'bot', text: 'Merhaba! Ben KantinBot 🐾 Sana nasıl yardımcı olabilirim?' }]);
  const [userMessage, setUserMessage] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Veritabanından verileri çekme
  useEffect(() => {
    fetch(`${API_URL}?action=get_epins`)
      .then(res => res.json())
      .then(res => { if(res.status === 'success') setEpinsData(res.data); });

    fetch(`${API_URL}?action=get_listings`)
      .then(res => res.json())
      .then(res => { if(res.status === 'success') setListingsData(res.data); });
  }, []);

  const addToCart = (item) => {
    setCart([...cart, { ...item, cartId: Math.random().toString() }]);
    showToast(`${item.title} sepete eklendi! 💖`);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    try {
      const response = await fetch(`${API_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setCurrentUser(result.user);
        showToast("Hoş geldin! 🐾");
        navigateTo('profile');
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert("API bağlantısı kurulamadı.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
          <div onClick={() => navigateTo('home')} className="flex items-center gap-2 cursor-pointer group">
            <div className="bg-gradient-to-tr from-purple-500 to-pink-500 p-2 rounded-2xl group-hover:rotate-12 transition-transform">
              <Gamepad2 className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">Oyuncu Kantinim</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigateTo('cart')} className="p-2 bg-slate-100 rounded-full relative">
              <ShoppingCart size={22}/>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{cart.length}</span>}
            </button>
            {currentUser ? (
              <button onClick={() => navigateTo('profile')} className="font-bold text-purple-600">{currentUser.username} ({Number(currentUser.balance).toFixed(2)} ₺)</button>
            ) : (
              <button onClick={() => navigateTo('login')} className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold hover:bg-purple-600 transition-colors">Giriş</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === 'home' && (
          <div className="space-y-12">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 sm:p-12 shadow-xl text-white">
              <h1 className="text-4xl sm:text-6xl font-black mb-4">Oyuncu Kantinim'e Hoş Geldin!</h1>
              <p className="text-xl mb-8">En ucuz E-Pinler ve en güvenilir oyuncu pazarı burada.</p>
              <button onClick={() => navigateTo('store')} className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold shadow-lg">Mağazayı Gez</button>
            </div>
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Zap className="text-yellow-500" /> Güncel E-Pinler</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {epinsData.length > 0 ? epinsData.map(epin => (
                  <div key={epin.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-5xl mb-4 text-center">{epin.image_emoji}</div>
                    <div className="text-xs font-bold text-purple-500 mb-1">{epin.game_name}</div>
                    <h3 className="font-bold text-slate-800 mb-4 line-clamp-1">{epin.title}</h3>
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-lg">{Number(epin.price).toFixed(2)} ₺</span>
                      <button onClick={() => addToCart(epin)} className="bg-purple-100 p-2 rounded-xl text-purple-600 hover:bg-purple-600 hover:text-white"><ShoppingBag size={20}/></button>
                    </div>
                  </div>
                )) : <p className="text-slate-400 italic">Şu an listelenecek ürün bulunamadı...</p>}
              </div>
            </section>
          </div>
        )}

        {currentPage === 'login' && (
          <div className="max-w-md mx-auto py-12 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h1 className="text-3xl font-black text-center mb-8">Giriş Yap</h1>
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="email" placeholder="E-posta" className="w-full bg-slate-50 border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-purple-400" required />
              <input type="password" placeholder="Şifre" className="w-full bg-slate-50 border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-purple-400" required />
              <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg">Giriş Yap</button>
            </form>
          </div>
        )}

        {currentPage === 'profile' && currentUser && (
          <div className="p-10 bg-white rounded-[2.5rem] text-center border border-slate-100 max-w-2xl mx-auto shadow-sm">
            <div className="text-6xl mb-4">{currentUser.avatar}</div>
            <h1 className="text-3xl font-black mb-2">{currentUser.username}</h1>
            <p className="text-slate-500 font-bold mb-6">{currentUser.email}</p>
            <div className="bg-purple-50 inline-block px-8 py-3 rounded-full text-purple-600 font-black text-xl">Bakiyen: {Number(currentUser.balance).toFixed(2)} ₺</div>
          </div>
        )}
      </main>

      {/* KantinBot */}
      {isBotOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[450px] z-50">
           <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 text-white font-bold flex justify-between items-center">
             <div className="flex items-center gap-2"><Bot size={20}/> KantinBot</div>
             <button onClick={() => setIsBotOpen(false)}><X size={20}/></button>
           </div>
           <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
             {botMessages.map((m,i) => (
               <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`p-3 rounded-2xl text-sm max-w-[85%] ${m.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-white shadow-sm text-slate-700'}`}>{m.text}</div>
               </div>
             ))}
           </div>
           <form onSubmit={async (e) => {
             e.preventDefault(); if(!userMessage.trim()) return;
             const newMsgs = [...botMessages, {sender:'user', text:userMessage}];
             setBotMessages(newMsgs); setUserMessage(''); setIsBotTyping(true);
             const reply = await callGeminiApi(userMessage);
             setBotMessages([...newMsgs, {sender:'bot', text:reply}]); setIsBotTyping(false);
           }} className="p-4 bg-white border-t flex gap-2">
             <input value={userMessage} onChange={e => setUserMessage(e.target.value)} placeholder="Bir şeyler sor..." className="flex-1 bg-slate-100 rounded-full px-4 py-2 outline-none text-sm"/>
             <button type="submit" className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors"><Send size={18}/></button>
           </form>
        </div>
      )}
      <button onClick={() => setIsBotOpen(!isBotOpen)} className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform z-50 animate-bounce"><MessageCircle size={28}/></button>

      {toastMessage && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-8 py-3 rounded-full font-bold z-50 shadow-2xl animate-in slide-in-from-bottom-5">{toastMessage}</div>}
    </div>
  );
}
