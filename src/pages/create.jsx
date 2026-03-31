import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calculator, XCircle, ImagePlus } from 'lucide-react';
import { GAMES } from '../data/catalog';
import { addListing } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function CreatePage() {
  const { user } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [game, setGame] = useState(GAMES[0].name);
  const [subCategory, setSubCategory] = useState(GAMES[0].subcategories[0].name);
  const [photos, setPhotos] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleGameChange = (e) => {
    const newGame = e.target.value;
    setGame(newGame);
    const gameObj = GAMES.find(g => g.name === newGame);
    setSubCategory(gameObj?.subcategories?.[0]?.name || 'Diger');
  };

  const currentGameObj = GAMES.find(g => g.name === game);
  const currentSubObj = currentGameObj?.subcategories?.find(s => s.name === subCategory);
  const commissionRate = currentSubObj?.commission || 10;
  const parsedPrice = parseFloat(price) || 0;
  const commissionFee = parsedPrice * (commissionRate / 100);
  const netEarnings = parsedPrice - commissionFee;

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      showToast('En fazla 5 fotograf ekleyebilirsin!');
      return;
    }

    const oversized = files.find(f => f.size > 2 * 1024 * 1024);
    if (oversized) {
      showToast(`${oversized.name} 2MB'dan buyuk!`);
      return;
    }

    const readerPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readerPromises).then(base64Array => {
      setPhotos(prev => [...prev, ...base64Array]);
    }).catch(() => showToast('Fotograf okunurken hata olustu.'));
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    if (coverIndex === index) setCoverIndex(0);
    else if (coverIndex > index) setCoverIndex(coverIndex - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price) { showToast('Baslik ve fiyat zorunlu!'); return; }

    setIsLoading(true);
    try {
      await addListing({
        game_name: game,
        category: subCategory,
        title,
        price: parseFloat(price),
        description: description || 'Yeni ilan.',
        images: photos,
        cover_index: coverIndex,
      });
      showToast('Ilan basariyla eklendi!');
      navigate('/profile');
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="card p-6 sm:p-8">
        <h2 className="text-2xl font-extrabold mb-6">Yeni Ilan Ekle</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Ilan Basligi</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Orn: Yagmaci Vandal Hesap" className="input-field" />
          </div>

          {/* Game & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Oyun</label>
              <select value={game} onChange={handleGameChange} className="input-field">
                {GAMES.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Kategori</label>
              <select value={subCategory} onChange={e => setSubCategory(e.target.value)} className="input-field">
                {currentGameObj?.subcategories?.map((sub, idx) => (
                  <option key={idx} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Commission */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Fiyat (₺)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="input-field" />

            {parsedPrice > 0 && (
              <div className="mt-3 bg-surface-100/50 rounded-xl p-3 border border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Calculator size={14} className="text-neon-purple" /> Komisyon (%{commissionRate})
                  </span>
                  <span className="text-red-400 font-bold">-{commissionFee.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                  <span className="text-white font-extrabold text-sm">Net Kazancin</span>
                  <span className="text-neon-green font-extrabold text-lg">{netEarnings.toFixed(2)} ₺</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Aciklama</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ilan detaylari, teslimat sureci vb." className="input-field min-h-[100px] resize-y" />
          </div>

          {/* Photos */}
          <div className="bg-surface-100/30 p-5 rounded-2xl border border-gray-100">
            <label className="block text-sm font-bold text-gray-400 mb-3">Fotograflar ({photos.length}/5)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className={`relative aspect-video rounded-xl overflow-hidden border-2 group ${coverIndex === index ? 'border-neon-purple shadow-neon-purple' : 'border-transparent'}`}>
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button type="button" onClick={() => removePhoto(index)} className="self-end text-white hover:text-red-400">
                      <XCircle size={18} />
                    </button>
                    {coverIndex !== index && (
                      <button type="button" onClick={() => setCoverIndex(index)} className="bg-white/90 text-gray-800 text-xs font-bold py-1 px-2 rounded-lg hover:bg-neon-purple hover:text-white transition-colors self-center">Kapak Yap</button>
                    )}
                  </div>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="aspect-video bg-surface-100 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-neon-purple hover:border-neon-purple/30 cursor-pointer transition-all">
                  <ImagePlus size={24} className="mb-1" />
                  <span className="text-xs font-bold">Fotograf Ekle</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Ilani Yayinla'}
          </button>
        </form>
      </div>
    </div>
  );
}
