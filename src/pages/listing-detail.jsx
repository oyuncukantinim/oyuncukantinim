import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Gamepad2, Star, ShoppingCart, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { getListing, idFromSlug } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ListingDetailPage() {
  const { slug } = useParams();
  const id = idFromSlug(slug);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    getListing(id)
      .then(r => { setListing(r.data); setActiveImg(r.data.cover_index || 0); })
      .catch(() => navigate('/market'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center py-40"><div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" /></div>;
  if (!listing) return null;

  const images = listing.images?.length > 0 ? listing.images : [];
  const isSeller = user && user.id === listing.seller_id;

  const handleBuy = () => {
    addToCart({ id: listing.id, itemType: 'listing', title: listing.title, price: Number(listing.price), game: listing.game_name, image: listing.avatar, listing_id: listing.id, seller: listing.seller });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-6 text-gray-400 hover:text-neon-purple font-bold flex items-center gap-2 transition-colors">
        <ChevronLeft size={20} /> Geri Dön
      </button>
      <div className="card p-6 sm:p-8 flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-1/2 space-y-4">
          <div className="w-full aspect-video bg-surface-100 rounded-2xl overflow-hidden">
            {images.length > 0 ? <img src={images[activeImg]} alt={listing.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={60} /></div>}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button key={idx} onClick={() => setActiveImg(idx)} className={`flex-shrink-0 w-20 aspect-video rounded-xl overflow-hidden border-2 transition-all ${activeImg === idx ? 'border-neon-purple opacity-100' : 'border-transparent opacity-40 hover:opacity-80'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="flex items-center flex-wrap gap-2 mb-4">
            <Link to={listing.category_id ? `/categories/${listing.category_slug || listing.category}-${listing.category_id}` : '/categories'} className="badge-cyan hover:opacity-80 transition-opacity">{listing.category}</Link>
            <span className="text-gray-400 text-sm font-bold flex items-center gap-1"><Gamepad2 size={14} /> {listing.game_name}</span>
            {listing.delivery_type === 'stock'
              ? <span className="text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">⚡ Anında Teslimat</span>
              : listing.delivery_hours
                ? <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">🕐 {listing.delivery_hours < 24 ? listing.delivery_hours + ' saat' : Math.floor(listing.delivery_hours / 24) + ' gün'} içinde teslimat</span>
                : null
            }
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-4 leading-tight">{listing.title}</h1>
          <div className="flex items-center gap-4 mb-6 bg-surface-100 p-4 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-gray-100">{listing.avatar || '👤'}</div>
            <div className="flex-1">
              <Link to={`/p/${listing.seller}`} className="text-sm font-bold text-gray-700 hover:text-violet-600 transition-colors">🏪 {listing.seller}</Link>
              <div className="flex items-center text-xs font-bold text-yellow-500 mt-1"><Star size={12} className="fill-current mr-1" /> {listing.rating || 5.0} / 5.0</div>
            </div>
            {user && !isSeller && (
              <Link to={`/messages/${listing.seller_id}`} className="btn-secondary py-2 px-4 text-sm flex items-center gap-1"><MessageCircle size={14} /> Mesaj</Link>
            )}
          </div>
          <div className="mb-8 flex-1">
            <h3 className="font-bold text-gray-700 mb-3">İlan Açıklaması</h3>
            <div className="text-gray-500 text-sm leading-relaxed bg-surface-100 p-5 rounded-2xl border border-gray-100 whitespace-pre-wrap min-h-[100px]">
              {listing.description || 'Satıcı bu ilan için açıklama girmemiş.'}
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
            <div>
              <div className="text-sm text-gray-400 mb-1">Fiyat</div>
              <div className="text-4xl font-extrabold text-neon-green">{Number(listing.price).toFixed(2)} ₺</div>
            </div>
            {isSeller ? <span className="badge-purple py-2 px-4 text-sm">Kendi ilanin</span> : (
              <button onClick={handleBuy} className="btn-primary flex items-center gap-2 text-lg py-4 px-8"><ShoppingCart size={20} /> Sepete Ekle</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
