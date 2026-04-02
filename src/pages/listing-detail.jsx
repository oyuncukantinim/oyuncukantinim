import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Gamepad2, Star, ShoppingCart,
  MessageCircle, Image as ImageIcon, Clock, Zap, Shield, Tag,
} from 'lucide-react';
import { getListing, idFromSlug } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

export default function ListingDetailPage() {
  const { slug } = useParams();
  const id = idFromSlug(slug);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [catAttrs, setCatAttrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    getListing(id)
      .then(r => {
        setListing(r.data);
        setActiveImg(r.data.cover_index || 0);
        // Kategori özelliklerini çek
        if (r.data.category_id) {
          fetch(`${API_URL}?action=get_category_attributes&category_id=${r.data.category_id}`)
            .then(res => res.json())
            .then(j => { if (j.status === 'success') setCatAttrs(j.data || []); })
            .catch(() => {});
        }
      })
      .catch(() => navigate('/market'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="flex justify-center py-40">
      <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!listing) return null;

  const images = listing.images?.length > 0 ? listing.images : [];
  const isSeller = user && user.id === listing.seller_id;

  const handleBuy = () => {
    addToCart({
      id: listing.id, itemType: 'listing', title: listing.title,
      price: Number(listing.price), game: listing.game_name,
      image: listing.avatar, listing_id: listing.id, seller: listing.seller,
    });
  };

  const prevImg = () => setActiveImg(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setActiveImg(i => (i + 1) % images.length);

  const deliveryLabel = listing.delivery_type === 'stock'
    ? 'Anında'
    : listing.delivery_hours
      ? (listing.delivery_hours < 24 ? listing.delivery_hours + ' saat' : Math.floor(listing.delivery_hours / 24) + ' gün')
      : 'Manuel';

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 text-gray-400 hover:text-neon-purple font-bold flex items-center gap-1.5 text-sm transition-colors"
      >
        <ChevronLeft size={18} /> Geri Dön
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── SOL: Galeri + Açıklama ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Ana görsel */}
          <div className="relative w-full aspect-video bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {images.length > 0 ? (
              <>
                <img
                  src={images[activeImg]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    >
                      <ChevronLeft size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={nextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                    >
                      <ChevronRight size={16} className="text-gray-700" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImg(idx)}
                          className={`h-1.5 rounded-full transition-all ${idx === activeImg ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={60} className="text-gray-300" />
              </div>
            )}
          </div>

          {/* Küçük resimler */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(idx)}
                  className={`w-16 h-11 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === activeImg ? 'border-neon-purple opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Kategoriye özel özellikler */}
          {catAttrs.length > 0 && listing.attributes && Object.keys(listing.attributes).length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-extrabold text-gray-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <Tag size={13} className="text-violet-500" /> İlan Özellikleri
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {catAttrs.map(attr => {
                  const val = listing.attributes?.[attr.slug];
                  if (!val && val !== 0) return null;
                  const display = Array.isArray(val) ? val.join(', ') : val;
                  return (
                    <div key={attr.slug} className="bg-surface-50 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{attr.name}</div>
                      <div className="text-sm font-bold text-gray-700 mt-0.5 truncate">{display}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Açıklama */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-extrabold text-gray-800 mb-3 text-sm uppercase tracking-wide">
              İlan Açıklaması
            </h3>
            <div className="text-gray-500 text-sm leading-relaxed whitespace-pre-wrap">
              {listing.description || 'Satıcı bu ilan için açıklama girmemiş.'}
            </div>
          </div>
        </div>

        {/* ── SAĞ: Bilgi paneli ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Başlık + badge'ler */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Link
                to={listing.category_id ? `/categories/${listing.category_slug || listing.category}-${listing.category_id}` : '/categories'}
                className="badge-cyan text-xs hover:opacity-80 transition-opacity"
              >
                {listing.category}
              </Link>
              {listing.delivery_type === 'stock'
                ? <span className="text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">⚡ Anında Teslimat</span>
                : listing.delivery_hours
                  ? <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">🕐 {deliveryLabel} içinde</span>
                  : null
              }
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight mb-2">{listing.title}</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Gamepad2 size={12} /> {listing.game_name}
            </p>
          </div>

          {/* Fiyat + sepet */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 shadow-lg shadow-violet-500/20">
            <div className="text-violet-200 text-xs font-semibold mb-1">Fiyat</div>
            <div className="text-4xl font-black text-white mb-4">{Number(listing.price).toFixed(2)} ₺</div>
            {isSeller ? (
              <span className="w-full block text-center text-violet-200 font-bold text-sm py-3 bg-white/10 rounded-xl">
                Kendi İlanın
              </span>
            ) : (
              <button
                onClick={handleBuy}
                className="w-full flex items-center justify-center gap-2 bg-white text-violet-700 font-extrabold text-base py-3.5 rounded-xl hover:bg-violet-50 active:scale-95 transition-all shadow-md"
              >
                <ShoppingCart size={18} /> Sepete Ekle
              </button>
            )}
          </div>

          {/* Satıcı */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Satıcı</div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-surface-100 rounded-xl flex items-center justify-center text-xl border border-gray-100 flex-shrink-0">
                {listing.avatar || '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/p/${listing.seller}`}
                  className="font-extrabold text-gray-800 hover:text-neon-purple transition-colors text-sm block truncate"
                >
                  {listing.seller}
                </Link>
                <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold mt-0.5">
                  <Star size={11} className="fill-current" />
                  <span>{listing.rating || '5.0'}</span>
                  <span className="text-gray-400 font-normal">/ 5.0</span>
                </div>
              </div>
              {user && !isSeller && (
                <Link
                  to={`/messages/${listing.seller_id}`}
                  className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 flex-shrink-0"
                >
                  <MessageCircle size={12} /> Mesaj
                </Link>
              )}
            </div>
          </div>

          {/* Bilgi grid */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={15} className="text-emerald-600" />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-semibold">Güvence</div>
                <div className="text-xs font-bold text-gray-700">Escrow Korumalı</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${listing.delivery_type === 'stock' ? 'bg-cyan-50' : 'bg-orange-50'}`}>
                {listing.delivery_type === 'stock'
                  ? <Zap size={15} className="text-cyan-600" />
                  : <Clock size={15} className="text-orange-600" />
                }
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-semibold">Teslimat</div>
                <div className="text-xs font-bold text-gray-700">{deliveryLabel}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
