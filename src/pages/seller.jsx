import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, MessageCircle, UserPlus, UserCheck, ShieldCheck,
  Package, ThumbsUp, Clock, ChevronRight, Image as ImageIcon,
  Flame, Award, Zap, Diamond, Trophy, Medal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  getSellerProfile, getSellerListings, getSellerReviews,
  followSeller, unfollowSeller, addReview
} from '../lib/api';
import ListingCard from '../components/ListingCard';

// Rozet tanımları
const BADGE_META = {
  verified:    { icon: '🛡️', label: 'Doğrulanmış Satıcı', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  fast:        { icon: '⚡', label: 'Hızlı Teslimat',      color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  super:       { icon: '🏆', label: 'Süper Satıcı',        color: 'bg-purple-50 text-purple-600 border-purple-200' },
  elite:       { icon: '💎', label: 'Elite Satıcı',        color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  trend:       { icon: '🔥', label: 'Trend',               color: 'bg-orange-50 text-orange-600 border-orange-200' },
  veteran:     { icon: '🎖️', label: 'Veteran',             color: 'bg-green-50 text-green-600 border-green-200' },
};

function Badge({ type }) {
  const meta = BADGE_META[type];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
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
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Yorum formu
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSellerProfile(username)
      .then(r => {
        setSeller(r.data.seller);
        setIsFollowing(r.data.is_following);
      })
      .catch(() => navigate('/market'))
      .finally(() => setLoading(false));
  }, [username, navigate]);

  useEffect(() => {
    if (!seller) return;
    if (activeTab === 'listings') {
      getSellerListings(seller.id).then(r => setListings(r.data || [])).catch(() => {});
    } else if (activeTab === 'reviews') {
      getSellerReviews(seller.id).then(r => setReviews(r.data || [])).catch(() => {});
    }
  }, [activeTab, seller]);

  const handleFollow = async () => {
    if (!user) { showToast('Takip etmek için giriş yapın!'); navigate('/login'); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowSeller(seller.id);
        setSeller(prev => ({ ...prev, follower_count: prev.follower_count - 1 }));
      } else {
        await followSeller(seller.id);
        setSeller(prev => ({ ...prev, follower_count: prev.follower_count + 1 }));
      }
      setIsFollowing(!isFollowing);
    } catch (err) { showToast(err.message); }
    finally { setFollowLoading(false); }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!user) { showToast('Yorum yapmak için giriş yapın!'); navigate('/login'); return; }
    setReviewLoading(true);
    try {
      await addReview({ seller_id: seller.id, rating: reviewRating, comment: reviewText });
      showToast('Yorumun eklendi!');
      setReviewText('');
      setReviewRating(5);
      getSellerReviews(seller.id).then(r => setReviews(r.data || []));
      getSellerProfile(username).then(r => setSeller(r.data.seller));
    } catch (err) { showToast(err.message); }
    finally { setReviewLoading(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-40">
      <div className="w-12 h-12 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!seller) return null;

  const isOwnProfile = user && user.username === username;
  const badges = seller.badges || [];

  const stats = [
    { icon: Package,   label: 'Toplam Satış',   value: seller.total_sales ?? 0,                    color: 'text-neon-purple' },
    { icon: ThumbsUp,  label: 'Başarı Oranı',   value: `%${seller.success_rate ?? 100}`,            color: 'text-neon-green' },
    { icon: Star,      label: 'Ortalama Puan',  value: Number(seller.avg_rating ?? 5).toFixed(1),   color: 'text-yellow-500' },
    { icon: Clock,     label: 'Üyelik',         value: seller.member_since,                         color: 'text-neon-cyan' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* KAPAK + PROFİL */}
      <div className="card overflow-hidden">
        {/* Kapak */}
        <div className="h-44 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 relative">
          <div className="absolute inset-0 bg-black/10" />
          {/* Dekoratif */}
          <div className="absolute bottom-0 right-8 opacity-10 pointer-events-none">
            <Trophy size={120} className="text-white" />
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-14 mb-4">
            {/* Avatar */}
            <div className="w-24 h-24 bg-white border-4 border-white rounded-2xl flex items-center justify-center text-5xl shadow-lg flex-shrink-0 z-10">
              {seller.avatar || '👤'}
            </div>

            {/* İsim + bio */}
            <div className="flex-1 pt-2 sm:pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-gray-800">{seller.username}</h1>
                <span className="text-xs text-gray-400 font-medium">@{seller.username}</span>
              </div>
              {seller.bio && <p className="text-gray-500 text-sm">{seller.bio}</p>}
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Clock size={12} /> Son görülme: {seller.last_seen || 'Çok önce değil'}
              </p>
            </div>

            {/* Aksiyon Butonları */}
            {!isOwnProfile && (
              <div className="flex gap-2 flex-shrink-0">
                <Link to={`/messages/${seller.id}`} className="btn-secondary py-2 px-4 text-sm flex items-center gap-1">
                  <MessageCircle size={16} /> Mesaj
                </Link>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`py-2 px-4 text-sm font-bold rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                      : 'btn-primary'
                  }`}
                >
                  {isFollowing ? <><UserCheck size={16} /> Takip Ediliyor</> : <><UserPlus size={16} /> Takip Et</>}
                </button>
              </div>
            )}
            {isOwnProfile && (
              <Link to="/profile" className="btn-secondary py-2 px-4 text-sm">Profili Düzenle</Link>
            )}
          </div>

          {/* Rozetler */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {badges.map(b => <Badge key={b} type={b} />)}
            </div>
          )}

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-surface-50 border border-gray-100 rounded-xl p-3 text-center">
                <s.icon size={20} className={`mx-auto mb-1 ${s.color}`} />
                <div className="text-lg font-extrabold text-gray-800">{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Takipçi sayısı */}
          <p className="text-xs text-gray-400 mt-3">
            <span className="font-bold text-gray-600">{seller.follower_count ?? 0}</span> takipçi
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-gray-100">
        {[
          { id: 'listings', label: `İlanlar (${seller.listing_count ?? 0})` },
          { id: 'reviews',  label: `Değerlendirmeler (${seller.review_count ?? 0})` },
        ].map(tab => (
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

      {/* İLANLAR */}
      {activeTab === 'listings' && (
        <div>
          {listings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🏪</div>
              <p className="font-semibold">Henüz aktif ilan yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      )}

      {/* DEĞERLENDİRMELER */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">

          {/* Özet kutusu */}
          <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-extrabold text-gray-800">{Number(seller.avg_rating ?? 5).toFixed(1)}</div>
              <StarRating value={Math.round(seller.avg_rating ?? 5)} readonly />
              <div className="text-xs text-gray-400 mt-1">{seller.review_count ?? 0} değerlendirme</div>
            </div>
            {/* Dağılım barları */}
            <div className="flex-1 w-full space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => {
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

          {/* Yorum Formu */}
          {user && !isOwnProfile && (
            <div className="card p-6">
              <h3 className="font-bold text-gray-800 mb-4">Değerlendirme Yap</h3>
              <form onSubmit={handleAddReview} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 mb-2 block">Puanın</label>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                </div>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Deneyimini paylaş..."
                  className="input-field min-h-[80px] resize-none"
                  required
                />
                <button type="submit" disabled={reviewLoading} className="btn-primary py-2 px-6 disabled:opacity-50 flex items-center gap-2">
                  {reviewLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Gönder'}
                </button>
              </form>
            </div>
          )}

          {/* Yorum Listesi */}
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">💬</div>
              <p>Henüz değerlendirme yok.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="card p-5 flex gap-4">
                  <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {r.reviewer_avatar || '👤'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Link to={`/p/${r.reviewer_username}`} className="font-bold text-gray-800 hover:text-neon-purple text-sm transition-colors">
                        {r.reviewer_username}
                      </Link>
                      <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                    </div>
                    <StarRating value={r.rating} readonly />
                    {r.comment && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{r.comment}</p>}
                  </div>
                </div>
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
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}
