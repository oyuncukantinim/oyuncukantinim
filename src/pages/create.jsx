import React, { useState } from 'react';
import { X, Calculator, XCircle, ImagePlus } from 'lucide-react';

// Oyunlar ve alt kategorileri (Kendi sistemine göre güncelleyebilirsin)
const GAMES = [
  { id: 1, name: "Valorant", subcategories: [{name: "Hesap", commission: 10}, {name: "Boost", commission: 15}, {name: "VP (E-Pin)", commission: 3}] },
  { id: 2, name: "League of Legends", subcategories: [{name: "Hesap", commission: 10}, {name: "Koçluk", commission: 12}, {name: "RP (E-Pin)", commission: 3}] },
  { id: 3, name: "Roblox", subcategories: [{name: "Pet/İtem", commission: 8}, {name: "Hesap", commission: 10}, {name: "Robux", commission: 5}] },
  { id: 4, name: "Minecraft", subcategories: [{name: "Premium Hesap", commission: 8}, {name: "Sunucu (Server)", commission: 5}, {name: "İtem/Pelerin", commission: 10}] },
];

const API_URL = "https://api.oyuncukantinim.com.tr/api.php";

export default function Create({ currentUser, isModal = false, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [game, setGame] = useState(GAMES[0].name);
  const [subCategory, setSubCategory] = useState(GAMES[0].subcategories[0].name);
  const [photos, setPhotos] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Kategori değiştiğinde alt kategoriyi otomatik seç
  const handleGameChange = (e) => {
    const newGame = e.target.value;
    setGame(newGame);
    const gameObj = GAMES.find(g => g.name === newGame);
    if (gameObj && gameObj.subcategories?.length > 0) {
      setSubCategory(gameObj.subcategories[0].name);
    } else {
      setSubCategory("Diğer");
    }
  };

  // Komisyon hesaplamaları
  const currentGameObj = GAMES.find(g => g.name === game);
  const currentSubObj = currentGameObj?.subcategories?.find(s => s.name === subCategory);
  const commissionRate = currentSubObj ? currentSubObj.commission : 10; // Varsayılan %10
  const parsedPrice = parseFloat(price) || 0;
  const commissionFee = parsedPrice * (commissionRate / 100);
  const netEarnings = parsedPrice - commissionFee;

  // Fotoğraf yükleme — base64'e çevirerek backend'e gönderilebilir hale getirir
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      alert("En fazla 5 fotoğraf ekleyebilirsin!");
      return;
    }

    // Boyut kontrolü: her fotoğraf max 2MB
    const oversized = files.find(f => f.size > 2 * 1024 * 1024);
    if (oversized) {
      alert(`"${oversized.name}" dosyası 2MB'dan büyük. Lütfen daha küçük bir fotoğraf seç.`);
      return;
    }

    // Her dosyayı base64'e çevir
    const readerPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // "data:image/jpeg;base64,..." formatı
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readerPromises).then(base64Array => {
      setPhotos(prev => [...prev, ...base64Array]);
    }).catch(() => {
      alert("Fotoğraf okunurken bir hata oluştu, tekrar dene.");
    });
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    if (coverIndex === index) setCoverIndex(0);
    else if (coverIndex > index) setCoverIndex(coverIndex - 1);
  };

  // Formu Gönderme İşlemi
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Eğer giriş yapmamışsa engelle (Test aşamasındaysan bu bloğu yoruma alabilirsin)
    if (!currentUser) {
      alert("İlan eklemek için giriş yapmalısın!");
      return;
    }

    if (!title || !price) {
      alert("Lütfen başlık ve fiyat girin!");
      return;
    }

    setIsLoading(true);

    const listingData = {
      seller_id: currentUser.id, 
      game_name: game,
      category: subCategory || "Diğer",
      title: title,
      price: parseFloat(price),
      description: description || "Yeni ilan.",
      images: photos, // MySQL JSON sütununa gidecek
      cover_index: coverIndex
    };

    try {
      const response = await fetch(`${API_URL}?action=add_listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData)
      });

      const result = await response.json();

      if (result.status === 'success') {
        if (onSuccess) onSuccess(result); // Dışarıya başarılı olduğunu bildir
        if (isModal && onClose) onClose(); // Modal ise kapat
        
        // Formu temizle
        setTitle(""); setPrice(""); setPhotos([]); setDescription("");
      } else {
        alert("Hata: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Sunucu ile iletişim kurulamadı!");
    } finally {
      setIsLoading(false);
    }
  };

  // Tasarım İçeriği
  const formContent = (
    <div className={`bg-white w-full max-w-2xl mx-auto flex flex-col ${isModal ? 'rounded-3xl shadow-2xl max-h-[90vh]' : 'rounded-[2rem] shadow-sm border border-slate-100 min-h-[calc(100vh-8rem)]'}`}>
      
      {/* Üst Kısım (Header) */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-[2rem]">
        <h2 className="text-xl font-extrabold text-slate-800">Yeni İlan Ekle</h2>
        {isModal && onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        )}
      </div>
      
      {/* Form Alanı (Kaydırılabilir) */}
      <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
        <form id="create-listing-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Başlık */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">İlan Başlığı</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Yağmacı Vandal Hesap" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium" />
          </div>
          
          {/* Kategori ve Alt Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Oyun</label>
              <select value={game} onChange={handleGameChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-purple-400">
                {GAMES.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Kategori</label>
              <select value={subCategory} onChange={e => setSubCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-purple-400">
                {currentGameObj?.subcategories?.map((sub, idx) => (
                  <option key={idx} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fiyat ve Komisyon */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Fiyat (₺)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-purple-400" />
            
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

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">İlan Açıklaması</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="İlan detayları, teslimat süreci vb." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium min-h-[100px] focus:ring-2 focus:ring-purple-400" />
          </div>

          {/* Fotoğraf Yükleme Alanı */}
          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold text-indigo-900">Fotoğraflar ({photos.length}/5)</label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className={`relative aspect-video rounded-xl overflow-hidden border-2 group ${coverIndex === index ? 'border-purple-500 shadow-md' : 'border-transparent'}`}>
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button type="button" onClick={() => removePhoto(index)} className="self-end text-white hover:text-rose-400">
                      <XCircle size={18} />
                    </button>
                    {coverIndex !== index && (
                      <button type="button" onClick={() => setCoverIndex(index)} className="bg-white/90 text-slate-800 text-xs font-bold py-1 px-2 rounded-lg hover:bg-purple-500 hover:text-white transition-colors self-center">Kapak Yap</button>
                    )}
                  </div>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="aspect-video bg-white border-2 border-dashed border-indigo-200 rounded-xl flex flex-col items-center justify-center text-indigo-400 hover:text-indigo-600 cursor-pointer transition-colors">
                  <ImagePlus size={24} className="mb-1" />
                  <span className="text-xs font-bold">Fotoğraf Ekle</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

        </form>
      </div>

      {/* Alt Kısım (Footer & Buton) */}
      <div className="p-6 border-t border-slate-100 bg-white rounded-b-[2rem]">
         <button 
            type="submit" 
            form="create-listing-form" 
            disabled={isLoading}
            className={`w-full text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-md ${isLoading ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}>
            {isLoading ? 'Yükleniyor...' : 'İlanı Yayınla'}
          </button>
      </div>

    </div>
  );

  // Eğer `isModal` true olarak gelirse koyu arkaplan (backdrop) içine al
  return isModal ? (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      {formContent}
    </div>
  ) : (
    // Modal değilse, Sayfa görünümü için dış çerçeve
    <div className="max-w-4xl mx-auto py-8 px-4">
        {formContent}
    </div>
  );
}
