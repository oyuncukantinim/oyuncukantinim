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
      showToast('Takip etmek için giriş yapın.');
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

  const stats = [
    { icon: Package, label: 'Toplam Satış', value: seller.total_sales ?? 0, color: 'text-neon-purple' },
    { icon: ThumbsUp, label: 'Başarı Oranı', value: `%${seller.success_rate ?? 100}`, color: 'text-neon-green' },
    { icon: Star, label: 'Ortalama Puan', stars: Number(seller.avg_rating ?? 5), color: 'text-yellow-500' },
    { icon: Clock, label: 'Üyelik', value: seller.created_at ? new Date(seller.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-', color: 'text-neon-cyan' },
  ];

  const tabs = [
    { id: 'listings', label: `İlanlar (${seller.listing_count ?? 0})` },
    { id: 'reviews', label: `Değerlendirmeler (${seller.review_count ?? 0})` },
    { id: 'followers', label: `Takipçiler (${seller.follower_count ?? 0})` },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="card overflow-hidden">
        <div className="aspect-[5/1] bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 relative overflow-hidden">
          {(seller.banner_image || defaultProfileBanner) ? (
            <img src={seller.banner_image || defaultProfileBanner} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-0 right-8 opacity-10 pointer-events-none">
                <Trophy size={120} className="text-white" />
              </div>
            </>
          )}
        </div>

        <div className="px-6 sm:px-8 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="w-24 h-24 bg-white border-4 border-white rounded-2xl flex items-center justify-center text-5xl shadow-xl flex-shrink-0 z-10">
              {seller.avatar || defaultAvatar}
            </div>

            {!isOwnProfile && (
              <div className="flex gap-2 pb-1">
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

          <div className="mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900">{seller.username}</h1>
              <span className="text-sm text-gray-400 font-medium">@{seller.username}</span>
            </div>
            {seller.bio && <p className="text-gray-500 text-sm mt-1 leading-relaxed">{seller.bio}</p>}
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              <Clock size={11} />
              Son görülme: {seller.last_seen || 'Çok önce değil'}
            </p>
          </div>

          <p className="text-xs text-gray-400 mt-2 mb-4">
            <span className="font-bold text-gray-700">{seller.follower_count ?? 0}</span> takipçi
          </p>


          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <div key={i} className="bg-surface-50 border border-gray-100 rounded-xl p-3 text-center">
                <stat.icon size={20} className={`mx-auto mb-1 ${stat.color}`} />
                {stat.stars ? (
                  <>
                    <div className="flex justify-center gap-0.5 my-1">
                      {[1,2,3,4,5].map((n) => {
                        const filled = n <= Math.floor(stat.stars);
                        const half = !filled && n - 0.5 <= stat.stars;
                        return (
                          <Star
                            key={n}
                            size={14}
                            className={filled || half ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
                          />
                        );
                      })}
                    </div>
                    <div className="text-xs font-bold text-gray-500">{stat.stars.toFixed(1)}</div>
                  </>
                ) : (
                  <div className="text-lg font-extrabold text-gray-800">{stat.value}</div>
                )}
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-neon-purple text-neon-purple'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'listings' && (
        <div>
          {listings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🏪</div>
              <p className="font-semibold">Henüz aktif ilan yok.</p>
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
                <div className="text-xs text-gray-400 mt-1">{seller.review_count ?? 0} değerlendirme</div>
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
                  { label: 'Güvenilirlik', value: seller.avg_reliability },
                  { label: 'Memnuniyet', value: seller.avg_satisfaction },
                  { label: 'Hız', value: seller.avg_speed },
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
              <p>Henüz değerlendirme yok.</p>
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
                          { label: 'Güvenilirlik', val: review.reliability },
                          { label: 'Memnuniyet', val: review.satisfaction },
                          { label: 'Hız', val: review.speed },
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
              <p>Henüz takipçi yok.</p>
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
