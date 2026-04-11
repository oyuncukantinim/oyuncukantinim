import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Star, ShoppingCart,
  MessageCircle, Image as ImageIcon, Clock, Zap, Shield, Tag, Heart,
  User,
} from 'lucide-react';
import { getListing, idFromSlug, toggleFavorite, checkFavorite } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useSiteBrand from '../hooks/useSiteBrand';
import { getListingCoverImage, getListingImageSet } from '../lib/listingMedia';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

function parseDate(value) {
  if (!value) return null;
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMemberSince(value) {
  const date = parseDate(value);
  return date ? `${date.getFullYear()}'den beri` : 'Bilgi yok';
}

function formatLastSeen(value) {
  const date = parseDate(value);
  if (!date) return 'Bilgi yok';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 5) return 'Az önce';
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Dün';
  if (diffDays < 30) return `${diffDays} gün önce`;

  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ListingDetailPage() {
  const { slug } = useParams();
  const id = idFromSlug(slug);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { defaultListingImage } = useSiteBrand();
  const [listing, setListing] = useState(null);
  const [catAttrs, setCatAttrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    getListing(id)
      .then(r => {
        setListing(r.data);
        setActiveImg(r.data.cover_index || 0);
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

  // Favori durumu kontrol
  useEffect(() => {
    if (!user || !id) return;
    checkFavorite(id).then(r => setFavorited(r.data?.favorited ?? false)).catch(() => {});
  }, [user, id]);

  const handleToggleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    setFavLoading(true);
    try {
      const r = await toggleFavorite(listing.id);
      setFavorited(r.data?.favorited ?? false);
    } catch {}
    finally { setFavLoading(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-40">
      <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!listing) return null;

  const images = getListingImageSet(listing, defaultListingImage);
  const isSeller = user && user.id === listing.seller_id;
  const isUnavailable = listing.status === 'sold' || listing.status === 'passive' || listing.status === 'expired' || listing.status === 'inactive';

  const handleBuy = () => {
    if (isUnavailable) return;
    const coverImg = getListingCoverImage(listing, defaultListingImage);
    addToCart({
      id: listing.id, itemType: 'listing', title: listing.title,
      price: Number(listing.price),
      image: coverImg || '', listing_id: listing.id, seller: listing.seller,
    });
  };

  const prevImg = () => setActiveImg(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setActiveImg(i => (i + 1) % images.length);

  const deliveryLabel = listing.delivery_type === 'stock'
    ? 'Anında'
    : listing.delivery_hours
      ? (listing.delivery_hours < 24 ? listing.delivery_hours + ' saat' : Math.floor(listing.delivery_hours / 24) + ' gün')
      : 'Manuel';
  const stockCount = Math.max(0, Number(listing.stock_count || 0));
  const sellerRating = Number(listing.seller_avg_rating || listing.rating || 5).toFixed(1);
  const sellerReviewCount = Number(listing.seller_review_count || 0);
  const sellerSalesCount = Number(listing.seller_total_sales || 0);
  const sellerLevel = Number(listing.seller_level || 1);
  const sellerLastSeen = formatLastSeen(listing.seller_last_seen);
  const sellerMemberSince = formatMemberSince(listing.seller_created_at);

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
                <img                   src={images[activeImg]}
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
                {listing.category_name || listing.category}
              </Link>
              {listing.delivery_type === 'stock'
                ? <span className="text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">⚡ Anında Teslimat</span>
                : listing.delivery_hours
                  ? <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">🕐 {deliveryLabel} içinde</span>
                  : null
              }
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight mb-2 break-words">{listing.title}</h1>
          </div>

          {/* Fiyat + sepet */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 shadow-lg shadow-violet-500/20">
            <div className="text-violet-200 text-xs font-semibold mb-1">Fiyat</div>
            <div className="text-4xl font-black text-white mb-4">{Number(listing.price).toFixed(2)} ₺</div>
            {isSeller ? (
              <span className="w-full block text-center text-violet-200 font-bold text-sm py-3 bg-white/10 rounded-xl">
                Kendi İlanın
              </span>
            ) : isUnavailable ? (
              <span className="w-full block text-center text-white/60 font-bold text-sm py-3 bg-white/10 rounded-xl">
                {listing.status === 'sold' ? '✅ Satıldı' : '⏸ Müsait Değil'}
              </span>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleBuy}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-violet-700 font-extrabold text-base py-3.5 rounded-xl hover:bg-violet-50 active:scale-95 transition-all shadow-md"
                >
                  <ShoppingCart size={18} /> Sepete Ekle
                </button>
                <button
                  onClick={handleToggleFavorite}
                  disabled={favLoading}
                  title={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                  className={`w-14 flex items-center justify-center rounded-xl transition-all active:scale-95 ${
                    favorited ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Heart size={20} className={favorited ? 'fill-current' : ''} />
                </button>
              </div>
            )}
          </div>

          {/* Satıcı */}
          <div className="relative overflow-hidden bg-white border border-violet-100 rounded-3xl p-4 shadow-sm">
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-violet-600/10 via-cyan-500/10 to-emerald-500/10" />
            <div className="relative">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl border border-white shadow-sm ring-4 ring-white/70 flex-shrink-0 overflow-hidden">
                  {typeof listing.avatar === 'string' && (listing.avatar.startsWith('http') || listing.avatar.startsWith('/')) ? (
                    <img src={listing.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    listing.avatar || <User size={24} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link
                      to={`/p/${listing.seller}`}
                      className="font-black text-gray-900 hover:text-neon-purple transition-colors text-base block truncate"
                    >
                      {listing.seller}
                    </Link>
                    <span className="flex-shrink-0 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-black text-white">
                      Lv. {sellerLevel}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={11} /> {sellerLastSeen}</span>
                    <span>{sellerMemberSince}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-[1.35fr_1fr] gap-2">
                <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 px-3 py-2 text-white shadow-sm shadow-violet-500/20">
                  <div className="absolute -right-4 -top-5 h-14 w-14 rounded-full bg-white/20 blur-sm" />
                  <div className="absolute -bottom-5 left-5 h-10 w-10 rounded-full bg-cyan-200/25 blur-sm" />
                  <div className="relative flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-black">
                      <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/25">
                        <Star size={13} className="fill-amber-200 text-amber-200" />
                      </span>
                      <span className="text-lg leading-none">{sellerRating}</span>
                    </div>
                    <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-black text-white ring-1 ring-white/25">
                      {sellerReviewCount} yorum
                    </span>
                  </div>
                  <div className="relative mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-white/75">
                    <MessageCircle size={10} />
                    Toplam Puan ve Yorum
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50 px-2.5 py-2 text-center shadow-sm">
                  <div className="absolute -right-3 -top-3 h-9 w-9 rounded-full bg-emerald-300/30 blur-sm" />
                  <div className="relative mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
                    <Zap size={12} className="fill-current" />
                  </div>
                  <div className="relative text-sm font-black text-emerald-700">{sellerSalesCount}</div>
                  <div className="relative text-[10px] font-black uppercase tracking-wide text-emerald-600/70">Toplam Satış</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to={`/p/${listing.seller}`}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-3 py-2.5 text-xs font-black text-slate-700 transition-colors hover:bg-slate-200"
                >
                  <User size={13} /> Profili Gör
                </Link>
                {user && !isSeller ? (
                  <Link
                    to="/messages"
                    state={{ activeUserId: String(listing.seller_id) }}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-violet-600 px-3 py-2.5 text-xs font-black text-white shadow-sm shadow-violet-500/20 transition-colors hover:bg-violet-500"
                  >
                    <MessageCircle size={13} /> Mesaj Gönder
                  </Link>
                ) : (
                  <span className="flex items-center justify-center gap-1.5 rounded-2xl bg-violet-50 px-3 py-2.5 text-xs font-black text-violet-700">
                    <Shield size={13} /> Kendi İlanın
                  </span>
                )}
              </div>
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
                <div className="text-xs font-bold text-gray-700">Oyuncu Kantinim Güvenli Alışveriş</div>
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
            {listing.delivery_type === 'stock' && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Tag size={15} className="text-violet-600" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-semibold">Stok</div>
                  <div className="text-xs font-bold text-gray-700">{stockCount} adet</div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
