import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  MessageCircle,
  UserPlus,
  UserCheck,
  Package,
  ThumbsUp,
  Clock,
  Trophy,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  getSellerProfile,
  getSellerListings,
  getSellerReviews,
  getSellerFollowers,
  followSeller,
  unfollowSeller,
} from '../lib/api';
import ListingCard from '../components/ListingCard';
import useSiteBrand from '../hooks/useSiteBrand';

// ---- Seviye renk haritasi ----
function getLevelColor(level) {
  if (level >= 50) return { ring: 'from-amber-400 via-yellow-300 to-amber-500', text: 'text-amber-500', bg: 'bg-amber-500', label: 'Efsane' };
  if (level >= 30) return { ring: 'from-violet-400 via-fuchsia-400 to-violet-500', text: 'text-violet-500', bg: 'bg-violet-500', label: 'Usta' };
  if (level >= 15) return { ring: 'from-cyan-400 via-blue-400 to-cyan-500', text: 'text-cyan-500', bg: 'bg-cyan-500', label: 'Deneyimli' };
  if (level >= 5)  return { ring: 'from-emerald-400 via-green-400 to-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Acemi' };
  return { ring: 'from-slate-400 via-gray-300 to-slate-400', text: 'text-slate-500', bg: 'bg-slate-500', label: 'Yeni' };
}

// ---- XP hesaplama ----
function getXpProgress(level, xp) {
  const currentLevelXp = (level - 1) * 100;
  const nextLevelXp = level * 100;
  const progress = xp - currentLevelXp;
  const needed = nextLevelXp - currentLevelXp;
  return { progress: Math.max(0, progress), needed, pct: Math.min(100, Math.max(0, (progress / needed) * 100)) };
}

// ---- Yildiz ----
function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star
            size={readonly ? 14 : 24}
            className={`transition-colors ${n <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function SellerPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const { showToast } = useCart();
  const { defaultAvatar, defaultProfileBanner, defaultListingImage } = useSiteBrand();
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSellerProfile(username)
      .then((r) => {
        setSeller(r.data.seller);
        setIsFollowing(r.data.is_following);
      })
      .catch(() => navigate('/market'))
      .finally(() => setLoading(false));
  }, [username, navigate]);

  useEffect(() => {
    if (!seller) return;

    if (activeTab === 'listings') {
      getSellerListings(seller.id).then((r) => setListings(r.data || [])).catch(() => {});
    } else if (activeTab === 'reviews') {
      getSellerReviews(seller.id).then((r) => setReviews(r.data || [])).catch(() => {});
    } else if (activeTab === 'followers') {
      getSellerFollowers(seller.id).then((r) => setFollowers(r.data || [])).catch(() => {});
    }
  }, [activeTab, seller]);

  const handleFollow = async () => {
    if (!user) {
      showToast('Takip etmek icin giris yapin.');
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowSeller(seller.id);
        setSeller((prev) => ({ ...prev, follower_count: prev.follower_count - 1 }));
      } else {
        await followSeller(seller.id);
        setSeller((prev) => ({ ...prev, follower_count: prev.follower_count + 1 }));
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      showToast(err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!seller) return null;

  const isOwnProfile = user && user.username === username;
  const level = seller.level || 1;
  const xp = seller.xp || 0;
  const levelMeta = getLevelColor(level);
  const xpInfo = getXpProgress(level, xp);

  const stats = [
    { icon: Package, label: 'Satis', value: seller.total_sales ?? 0, color: 'text-violet-500' },
    { icon: ThumbsUp, label: 'Basari', value: `%${seller.success_rate ?? 100}`, color: 'text-emerald-500' },
    { icon: Star, label: 'Puan', value: Number(seller.avg_rating ?? 5).toFixed(1), color: 'text-yellow-500' },
    { icon: Shield, label: 'Ilan', value: seller.listing_count ?? 0, color: 'text-cyan-500' },
  ];

  const tabs = [
    { id: 'listings', label: 'Ilanlar', count: seller.listing_count ?? 0 },
    { id: 'reviews', label: 'Degerlendirmeler', count: seller.review_count ?? 0 },
    { id: 'followers', label: 'Takipciler', count: seller.follower_count ?? 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ===== OYUNCU KARTI ===== */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">

        {/* Banner - diagonal kesim */}
        <div className="relative h-40 sm:h-48 overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0 100%)' }}>
          {(seller.banner_image || defaultProfileBanner) ? (
            <img src={seller.banner_image || defaultProfileBanner} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500">
              {/* Geometrik desen */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-8 w-20 h-20 border-2 border-white rounded-lg rotate-12" />
                <div className="absolute top-8 right-16 w-16 h-16 border-2 border-white rounded-full" />
                <div className="absolute bottom-6 left-1/3 w-24 h-24 border-2 border-white rotate-45" />
                <div className="absolute top-2 right-1/3 w-12 h-12 border-2 border-white rounded-lg -rotate-6" />
              </div>
              <div className="absolute bottom-0 right-6 opacity-[0.07] pointer-events-none">
                <Trophy size={140} className="text-white" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Profil icerik */}
        <div className="relative px-5 sm:px-8 pb-6 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">

            {/* Avatar + Neon Ring */}
            <div className="relative flex-shrink-0 z-10">
              <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${levelMeta.ring} blur-sm opacity-70 animate-pulse`} />
              <div className={`relative w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl border-4 border-white flex items-center justify-center text-5xl sm:text-6xl shadow-xl`}>
                {seller.avatar || defaultAvatar}
              </div>
              {/* Seviye rozeti - avatar uzerinde */}
              <div className={`absolute -bottom-2 -right-2 ${levelMeta.bg} text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-lg border-2 border-white`}>
                LVL {level}
              </div>
            </div>

            {/* Isim + bilgiler + butonlar */}
            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">{seller.username}</h1>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${levelMeta.bg} text-white`}>
                      <Zap size={9} /> {levelMeta.label}
                    </span>
                  </div>

                  {/* XP Bar */}
                  <div className="flex items-center gap-2 mt-1.5 max-w-xs">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${levelMeta.ring} transition-all duration-700`}
                        style={{ width: `${xpInfo.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{xpInfo.progress}/{xpInfo.needed} XP</span>
                  </div>

                  {seller.bio && <p className="text-gray-500 text-sm mt-2 leading-relaxed line-clamp-2">{seller.bio}</p>}
                </div>

                {/* Butonlar */}
                {!isOwnProfile && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Link to={`/messages/${seller.id}`} className="btn-secondary py-2 px-4 text-sm flex items-center gap-1.5">
                      <MessageCircle size={15} /> Mesaj
                    </Link>
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`py-2 px-4 text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 ${
                        isFollowing
                          ? 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                          : 'btn-primary'
                      }`}
                    >
                      {isFollowing ? <><UserCheck size={15} /> Takip Ediliyor</> : <><UserPlus size={15} /> Takip Et</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Alt bilgi satiri */}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              Son gorulme: {seller.last_seen || 'Bilinmiyor'}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="font-bold text-slate-600">{seller.follower_count ?? 0}</span> takipci
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Uye: {seller.created_at ? new Date(seller.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
          </div>

          {/* HUD Stat Bar */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {stats.map((stat, i) => (
              <div key={i} className="relative group rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/80 p-3 text-center transition-all hover:border-slate-200 hover:shadow-sm">
                <div className={`absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r ${levelMeta.ring} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="flex items-center justify-center gap-1.5">
                  <stat.icon size={15} className={stat.color} />
                  <span className="text-lg font-black text-gray-800">{stat.value}</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== SEKMELER ===== */}
      <div className="flex gap-1 bg-slate-50 rounded-2xl p-1.5 border border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
              activeTab === tab.id
                ? 'bg-violet-100 text-violet-600'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ===== ICERIK ===== */}
      {activeTab === 'listings' && (
        <div>
          {listings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🏪</div>
              <p className="font-semibold">Henuz aktif ilan yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {listings.map((listing) => <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-5">
              <div className="text-center flex-shrink-0">
                <div className="text-5xl font-extrabold text-gray-800">{Number(seller.avg_rating ?? 5).toFixed(1)}</div>
                <StarRating value={Math.round(seller.avg_rating ?? 5)} readonly />
                <div className="text-xs text-gray-400 mt-1">{seller.review_count ?? 0} degerlendirme</div>
              </div>

              <div className="flex-1 w-full space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = seller.rating_dist?.[star] ?? 0;
                  const total = seller.review_count || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-gray-500 font-bold">{star}</span>
                      <Star size={11} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-yellow-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-gray-400 w-7 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {(seller.avg_reliability || seller.avg_satisfaction || seller.avg_speed || seller.avg_service_quality) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-gray-100 pt-4">
                {[
                  { label: 'Guvenilirlik', value: seller.avg_reliability },
                  { label: 'Memnuniyet', value: seller.avg_satisfaction },
                  { label: 'Hiz', value: seller.avg_speed },
                  { label: 'Hizmet', value: seller.avg_service_quality },
                ].map((criterion) => criterion.value != null && (
                  <div key={criterion.label} className="text-center bg-surface-50 rounded-xl p-3">
                    <div className="text-lg font-extrabold text-gray-800">{Number(criterion.value).toFixed(1)}</div>
                    <div className="text-xs text-gray-400">{criterion.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">💬</div>
              <p>Henuz degerlendirme yok.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="card p-5 flex gap-4">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 w-16 text-center">
                    <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center text-xl">
                      {review.reviewer_avatar || defaultAvatar}
                    </div>
                    <Link to={`/p/${review.reviewer_username}`} className="font-bold text-gray-700 hover:text-neon-purple text-[11px] leading-tight transition-colors line-clamp-2">
                      {review.reviewer_username}
                    </Link>
                    <span className="text-[10px] text-gray-400">{formatDate(review.created_at)}</span>
                  </div>

                  {(review.item_title || review.item_image) && (
                    <div className="flex items-center gap-2 flex-shrink-0 border-x border-gray-100 px-3">
                      {review.item_image && (
                        <img src={review.item_image} alt="" className="w-14 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                      )}
                      <p className="text-[11px] font-bold text-gray-600 line-clamp-2 leading-tight max-w-[80px]">{review.item_title}</p>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <StarRating value={review.rating} readonly />
                    {(review.reliability || review.satisfaction || review.speed || review.service_quality) && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                        {[
                          { label: 'Guvenilirlik', val: review.reliability },
                          { label: 'Memnuniyet', val: review.satisfaction },
                          { label: 'Hiz', val: review.speed },
                          { label: 'Hizmet', val: review.service_quality },
                        ].map((criterion) => criterion.val != null && (
                          <span key={criterion.label} className="text-xs text-gray-400">
                            {criterion.label}: <span className="font-bold text-yellow-500">{criterion.val}</span>
                            <Star size={9} className="inline ml-0.5 text-yellow-400 fill-yellow-400" />
                          </span>
                        ))}
                      </div>
                    )}
                    {review.comment && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{review.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'followers' && (
        <div>
          {followers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">👥</div>
              <p>Henuz takipci yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {followers.map((follower) => (
                <Link
                  key={follower.id}
                  to={`/p/${follower.username}`}
                  className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm hover:border-violet-200 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {follower.avatar || defaultAvatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-gray-800 truncate">{follower.username}</div>
                    <div className="text-xs text-gray-400 mt-1">Seviye {follower.level || 1}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
