import React, { useState, useEffect } from 'react';

export default function Store({ cart, setCart }) {
  const [epins, setEpins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Veritabanından e-pinleri çek
  useEffect(() => {
    // API URL'ni buraya yazıyoruz (action parametresi api.php yapına göre değişebilir)
    fetch('https://api.oyuncukantinim.com.tr/api.php?action=get_epins')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data && data.data.length > 0) {
          setEpins(data.data);
        } else {
          // API'den henüz veri gelmiyorsa sitenin boş kalmaması için örnek veriler gösteriyoruz
          setEpins([
            { id: 1, game_name: 'Valorant', title: '1250 VP', price: 250.00, image_emoji: '💎' },
            { id: 2, game_name: 'League of Legends', title: '850 RP', price: 170.00, image_emoji: '🔮' },
            { id: 3, game_name: 'PUBG Mobile', title: '660 UC', price: 200.00, image_emoji: '📦' },
            { id: 4, game_name: 'Steam', title: '100 TL Cüzdan Kodu', price: 100.00, image_emoji: '💳' },
          ]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("API Bağlantı Hatası:", err);
        // Hata durumunda da örnek verileri gösterelim
        setEpins([
          { id: 1, game_name: 'Valorant', title: '1250 VP', price: 250.00, image_emoji: '💎' },
          { id: 2, game_name: 'League of Legends', title: '850 RP', price: 170.00, image_emoji: '🔮' },
        ]);
        setLoading(false);
      });
  }, []);

  // Sepete Ekleme Fonksiyonu
  const addToCart = (product) => {
    // Ürün zaten sepette var mı kontrol et
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      alert("Bu ürün zaten sepetinizde var!");
      return;
    }
    // Yoksa sepete ekle
    setCart([...cart, product]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Sayfa Başlığı */}
      <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/5">
        <h1 className="text-4xl font-black mb-4">Resmi E-Pin Mağazası</h1>
        <p className="text-gray-400">Anında teslimat garantisiyle en uygun fiyatlı dijital kodlar.</p>
      </div>

      {/* Ürün Listesi (Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {epins.map((epin) => (
          <div key={epin.id} className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all flex flex-col items-center text-center group">
            
            {/* Ürün Görseli / Emojisi */}
            <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center text-5xl mb-4 group-hover:scale-110 transition-transform">
              {epin.image_emoji || '🎮'}
            </div>
            
            {/* Oyun Adı ve Ürün Başlığı */}
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">{epin.game_name}</span>
            <h3 className="text-xl font-bold text-white mb-4">{epin.title}</h3>
            
            {/* Fiyat ve Sepete Ekle Butonu */}
            <div className="mt-auto w-full space-y-3">
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                {Number(epin.price).toFixed(2)} ₺
              </div>
              <button 
                onClick={() => addToCart(epin)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors active:scale-95"
              >
                Sepete Ekle
              </button>
            </div>
            
          </div>
        ))}
      </div>
      
      {epins.length === 0 && (
        <div className="text-center text-gray-400 py-10">
          Şu an için mağazada ürün bulunmamaktadır.
        </div>
      )}
    </div>
  );
}