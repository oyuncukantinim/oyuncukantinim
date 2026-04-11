import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, MessageCircle, UserPlus, UserCheck,
  Package, ThumbsUp, Clock, Trophy, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  getSellerProfile, getSellerListings, getSellerReviews,
  getSellerFollowers, followSeller, unfollowSeller,
} from '../lib/api';
import ListingCard from '../components/ListingCard';
import useSiteBrand from '../hooks/useSiteBrand';

/* ── Seviye meta ── */
function getLevelMeta(level) {
  if (level >= 50) return { border: 'border-amber-400',   ring: 'ring-amber-300',   bg: 'bg-amber-400',   bar: 'from-amber-400 to-yellow-300', text: 'text-amber-600',   label: '👑 Efsane'     };
  if (level >= 30) return { border: 'border-violet-400',  ring: 'ring-violet-300',  bg: 'bg-violet-500',  bar: 'from-violet-500 to-fuchsia-400', text: 'text-violet-600',  label: '💎 Usta'       };
  if (level >= 15) return { border: 'border-cyan-400',    ring: 'ring-cyan-300',    bg: 'bg-cyan-500',    bar: 'from-cyan-500 to-blue-400',      text: 'text-cyan-600',    label: '⚡ Deneyimli'  };
  if (level >= 5)  return { border: 'border-emerald-400', ring: 'ring-emerald-300', bg: 'bg-emerald-500', bar: 'from-emerald-500 to-green-400',  text: 'text-emerald-600', label: '🌱 Acemi'      };
  return             { border: 'border-slate-300',    ring: 'ring-slate-200',   bg: 'bg-slate-400',   bar: 'from-slate-400 to-slate-300',    text: 'text-slate-500',   label: '🐣 Yeni'       };
}

function getXpProgress(level, xp) {
  const base = (level - 1) * 100;
  const cap  = level * 100;
  const pct  = Math.min(100, Math.max(0, ((xp - base) / (cap - base)) * 100));
  return { pct, current: Math.max(0, xp - base), needed: cap - base };
}

/* ── Yıldız ── */
function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={readonly}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star size={readonly ? 14 : 24}
            className={`transition-colors ${n <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

/* ── Stat kartı ── */
function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="group flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-gray-100 p-3 shadow-sm transition-all hover:scale-[1.03] hover:shadow-md">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="text-lg font-black text-gray-800 leading-none">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  );
}

/* ════════════════════════════════════════════ */
export default function SellerPage() {
  const { username } = useParams();
  const { user }     = useAuth();
  const { showToast } = useCart();
  const { defaultAvatar, defaultProfileBanner, defaultListingImage } = useSiteBrand();
  const navigate = useNavigate();

  const [seller,       setSeller]       = useState(null);
  const [listings,     setListings]     = useState([]);
  const [reviews,      setReviews]      = useState([]);
  const [followers,    setFollowers]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('listings');
  const [isFollowing,  setIsFollowing]  = useState(false);
  const [followLoading,setFollowLoading]= useState(false);

  useEffect(() => {
    setLoading(true);
    getSellerProfile(username)
      .then((r) => { setSeller(r.data.seller); setIsFollowing(r.data.is_following); })
      .catch(() => navigate('/market'))
      .finally(() => setLoading(false));
  }, [username, navigate]);

  useEffect(() => {
    if (!seller) return;
    if (activeTab === 'listings')   getSellerListings(seller.id).then((r)  => setListings(r.data || [])).catch(() => {});
    if (activeTab === 'reviews')    getSellerReviews(seller.id).then((r)   => setReviews(r.data || [])).catch(() => {});
    if (activeTab === 'followers')  getSellerFollowers(seller.id).then((r) => setFollowers(r.data || [])).catch(() => {});
  }, [activeTab, seller]);

  const handleFollow = async () => {
    if (!user) { showToast('Takip etmek için giriş yapın.'); navigate('/login'); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowSeller(seller.id);
        setSeller((p) => ({ ...p, follower_count: p.follower_count - 1 }));
      } else {
        await followSeller(seller.id);
        setSeller((p) => ({ ...p, follower_count: p.follower_count + 1 }));
      }
      setIsFollowing(!isFollowing);
    } catch (err) { showToast(err.message); }
    finally { setFollowLoading(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-40">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!seller) return null;

  const isOwnProfile = user && user.username === username;
  const level   = seller.level || 1;
  const xp      = seller.xp    || 0;
  const lm      = getLevelMeta(level);
  const xpInfo  = getXpProgress(level, xp);
  const isOnline = seller.last_seen === 'Az önce';

  const tabs = [
    { id: 'listings',   label: 'İlanlar',           count: seller.listing_count ?? 0 },
    { id: 'reviews',    label: 'Değerlendirmeler',  count: seller.review_count   ?? 0 },
    { id: 'followers',  label: 'Takipçiler',        count: seller.follower_count ?? 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* ════ PROFİL KARTI ════ */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

        {/* Banner + SVG dalga */}
        <div className="relative">
          <div className="h-36 sm:h-44 w-full overflow-hidden">
            {(seller.banner_image || defaultProfileBanner) ? (
              <img src={seller.banner_image || defaultProfileBanner} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-400 relative overflow-hidden">
                {/* Hex desen */}
                <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="hex" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
                      <polygon points="28,2 52,14 52,34 28,46 4,34 4,14" fill="none" stroke="white" strokeWidth="1.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hex)" />
                </svg>
                <div className="absolute right-8 bottom-0 opacity-[0.07] pointer-events-none">
                  <Trophy size={130} className="text-white" />
                </div>
              </div>
            )}
          </div>
          {/* Dalga SVG */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
            <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="h-10 w-full" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,20 C200,40 400,0 600,20 C800,40 1000,0 1200,20 L1200,40 L0,40 Z" fill="white" />
            </svg>
          </div>
        </div>

        {/* İçerik */}
        <div className="px-5 sm:px-8 pb-6 -mt-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

            {/* Avatar */}
            <div className="relative flex-shrink-0 z-10 self-start">
              {/* Online nabız */}
              {isOnline && (
                <span className="absolute -top-1 -right-1 z-20 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-white" />
                </span>
              )}
              <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-[3px] ${lm.border} bg-white flex items-center justify-center text-5xl sm:text-6xl shadow-lg ring-4 ${lm.ring}`}>
                {seller.avatar || defaultAvatar}
              </div>
              {/* Seviye rozeti */}
              <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap ${lm.bg} text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow border-2 border-white`}>
                ⭐ {level}
              </div>
            </div>

            {/* Butonlar */}
            {!isOwnProfile && (
              <div className="flex gap-2 sm:pb-1 flex-wrap">
                <Link to={`/messages/${seller.id}`} className="btn-secondary py-2 px-4 text-sm flex items-center gap-1.5">
                  <MessageCircle size={15} /> Mesaj
                </Link>
                <button onClick={handleFollow} disabled={followLoading}
                  className={`py-2 px-4 text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-violet-50 text-violet-600 border border-violet-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                      : 'btn-primary'
                  }`}
                >
                  {isFollowing ? <><UserCheck size={15} /> Takip Ediliyor</> : <><UserPlus size={15} /> Takip Et</>}
                </button>
              </div>
            )}
          </div>

          {/* İsim + XP + Bio */}
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-gray-900">{seller.username}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white ${lm.bg}`}>
                <Zap size={9} /> {lm.label}
              </span>
            </div>

            {/* XP bar */}
            <div className="mt-2 flex items-center gap-2 max-w-xs">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${lm.bar} transition-all duration-700`}
                  style={{ width: `${xpInfo.pct}%` }} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{xpInfo.current}/{xpInfo.needed} XP</span>
            </div>

            {seller.bio && <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-2">{seller.bio}</p>}

            {/* Meta bilgiler */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock size={11} /> {seller.last_seen || 'Bilinmiyor'}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span><strong className="text-gray-700">{seller.follower_count ?? 0}</strong> takipçi</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{seller.created_at ? new Date(seller.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
            </div>
          </div>

          {/* Stat kartları */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Package}  label="Toplam Satış"  value={seller.total_sales ?? 0}                           iconBg="bg-violet-50"  iconColor="text-violet-500" />
            <StatCard icon={ThumbsUp} label="Başarı Oranı"  value={`%${seller.success_rate ?? 100}`}                  iconBg="bg-emerald-50" iconColor="text-emerald-500" />
            <StatCard icon={Star}     label="Ort. Puan"     value={Number(seller.avg_rating ?? 5).toFixed(1)}          iconBg="bg-amber-50"   iconColor="text-amber-500" />
            <StatCard icon={Trophy}   label="Aktif İlan"    value={seller.listing_count ?? 0}                          iconBg="bg-cyan-50"    iconColor="text-cyan-500" />
          </div>
        </div>
      </div>

      {/* ════ SEKMELER ════ */}
      <div className="flex gap-1.5 rounded-2xl bg-gray-50 border border-gray-100 p-1.5">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            <span className={`min-w-[20px] rounded-md px-1.5 py-0.5 text-[10px] font-black ${
              activeTab === tab.id ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ════ İLANLAR ════ */}
      {activeTab === 'listings' && (
        listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <div className="text-5xl mb-3">🏪</div>
            <p className="font-semibold text-gray-500">Henüz aktif ilan yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {listings.map((l) => <ListingCard key={l.id} listing={l} fallbackImage={defaultListingImage} />)}
          </div>
        )
      )}

      {/* ════ DEĞERLENDİRMELER ════ */}
      {activeTab === 'reviews' && (
        <div className="space-y-5">
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
                  const pct   = Math.round((count / (seller.review_count || 1)) * 100);
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-4 font-bold text-gray-500">{star}</span>
                      <Star size={11} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="bg-yellow-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-7 text-right text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {(seller.avg_reliability || seller.avg_satisfaction || seller.avg_speed || seller.avg_service_quality) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-gray-100 pt-4">
                {[
                  { label: 'Güvenilirlik', value: seller.avg_reliability },
                  { label: 'Memnuniyet',   value: seller.avg_satisfaction },
                  { label: 'Hız',          value: seller.avg_speed },
                  { label: 'Hizmet',       value: seller.avg_service_quality },
                ].map((c) => c.value != null && (
                  <div key={c.label} className="text-center bg-gray-50 rounded-xl p-3">
                    <div className="text-lg font-extrabold text-gray-800">{Number(c.value).toFixed(1)}</div>
                    <div className="text-xs text-gray-400">{c.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">💬</div><p>Henüz değerlendirme yok.</p></div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="card p-5 flex gap-4">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 w-16 text-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl">{review.reviewer_avatar || defaultAvatar}</div>
                    <Link to={`/p/${review.reviewer_username}`} className="font-bold text-gray-700 hover:text-violet-500 text-[11px] leading-tight transition-colors line-clamp-2">{review.reviewer_username}</Link>
                    <span className="text-[10px] text-gray-400">{formatDate(review.created_at)}</span>
                  </div>
                  {(review.item_title || review.item_image) && (
                    <div className="flex items-center gap-2 flex-shrink-0 border-x border-gray-100 px-3">
                      {review.item_image && <img src={review.item_image} alt="" className="w-14 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0" />}
                      <p className="text-[11px] font-bold text-gray-600 line-clamp-2 leading-tight max-w-[80px]">{review.item_title}</p>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <StarRating value={review.rating} readonly />
                    {(review.reliability || review.satisfaction || review.speed || review.service_quality) && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                        {[
                          { label: 'Güvenilirlik', val: review.reliability },
                          { label: 'Memnuniyet',   val: review.satisfaction },
                          { label: 'Hız',          val: review.speed },
                          { label: 'Hizmet',       val: review.service_quality },
                        ].map((c) => c.val != null && (
                          <span key={c.label} className="text-xs text-gray-400">
                            {c.label}: <span className="font-bold text-yellow-500">{c.val}</span>
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

      {/* ════ TAKİPÇİLER ════ */}
      {activeTab === 'followers' && (
        followers.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">👥</div><p>Henüz takipçi yok.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {followers.map((f) => (
              <Link key={f.id} to={`/p/${f.username}`}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
              >
                <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">{f.avatar || defaultAvatar}</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-gray-800">{f.username}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Seviye {f.level || 1}</div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}
