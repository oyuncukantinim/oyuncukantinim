import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  ThumbsUp,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';
import {
  getSellerProfile,
  getSellerListings,
  getSellerReviews,
  getSellerFollowers,
  getSellerFollowing,
  followSeller,
  unfollowSeller,
  listingSlug,
} from '../lib/api';
import ListingCard from '../components/ListingCard';
import useSiteBrand from '../hooks/useSiteBrand';
import {
  AchievementCard,
  IdentityVerifiedIcon,
  VerifiedAchievementCard,
  VerifiedStoreBadge,
} from '../components/StoreBadges';
import { isIdentityVerified } from '../lib/identityVerification';
import { useSeo } from '../hooks/useSeo';
import UserAvatar from '../components/UserAvatar';

function StarRating({ value, onChange, readonly = false, size = 'sm' }) {
  const [hovered, setHovered] = useState(0);
  const iconSize = size === 'lg' ? 22 : 15;

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
            size={iconSize}
            className={`transition-colors ${n <= (hovered || value) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewListingBlock({ review, defaultListingImage }) {
  if (!review.item_title && !review.item_image) return null;

  const titleForSlug = review.listing_title || review.item_title;
  const reviewLink = review.listing_active_id && titleForSlug
    ? listingSlug(titleForSlug, review.listing_id)
    : review.item_category_slug
      ? `/categories/${review.item_category_slug}`
      : null;

  const content = (
    <>
      <img
        src={review.item_image || defaultListingImage}
        alt=""
        className="h-20 w-28 flex-shrink-0 rounded-xl border border-slate-200 object-cover dark:border-white/10"
      />
      <p className="max-w-[150px] text-sm font-black leading-tight text-slate-700 line-clamp-3 dark:text-slate-200">{review.item_title}</p>
    </>
  );

  return (
    <div className="flex-shrink-0 border-x border-slate-100 px-3 dark:border-white/10">
      {reviewLink ? (
        <Link to={reviewLink} className="flex items-center gap-2 transition-opacity hover:opacity-80">
          {content}
        </Link>
      ) : (
        <div className="flex items-center gap-2">{content}</div>
      )}
    </div>
  );
}

function MetricTile({ icon: Icon, label, value, tone = 'violet' }) {
  const tones = {
    violet: 'from-violet-500/16 to-fuchsia-500/8 text-violet-600 dark:text-violet-200',
    emerald: 'from-emerald-500/16 to-cyan-500/8 text-emerald-600 dark:text-emerald-200',
    amber: 'from-amber-400/18 to-orange-500/8 text-amber-600 dark:text-amber-200',
    cyan: 'from-cyan-500/16 to-blue-500/8 text-cyan-600 dark:text-cyan-200',
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/78 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone] || tones.violet}`}>
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-xl font-black text-slate-950 dark:text-white">{value}</div>
          <div className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/72 px-6 py-16 text-center shadow-sm dark:border-white/15 dark:bg-white/[0.045]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
        <Icon size={30} />
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{title}</h3>
      {text ? <p className="mx-auto mt-1 max-w-md text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{text}</p> : null}
    </div>
  );
}

function PublicUserCard({ item, defaultAvatar }) {
  return (
    <Link
      to={`/p/${item.username}`}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/78 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.055] dark:hover:border-violet-400/35"
    >
      <UserAvatar
        value={item.avatar}
        fallback={defaultAvatar}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-100 text-2xl shadow-sm dark:border-white/10 dark:bg-white/10"
        iconSize={22}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate text-sm font-black text-slate-900 transition-colors group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-200">
            {item.username}
          </span>
          {isIdentityVerified(item) ? <IdentityVerifiedIcon compact /> : null}
        </div>
        <div className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">Seviye {item.level || 1}</div>
      </div>
      <ChevronRight size={17} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-400" />
    </Link>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
            <Icon size={18} />
          </span>
          <h2 className="truncate text-xl font-black text-slate-950 dark:text-white">{title}</h2>
        </div>
        {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
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
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useSeo({
    title: `${seller?.username || username} Mağazası`,
    description: `${seller?.username || username} satıcısının ilanlarını, değerlendirmelerini ve profil bilgilerini Oyuncu Kantinim'de incele.`,
    canonical: `/p/${username}`,
    image: seller?.banner_image || seller?.avatar || '/og-image.png',
  });

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
    } else if (activeTab === 'following') {
      getSellerFollowing(seller.id).then((r) => setFollowing(r.data || [])).catch(() => {});
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
        setSeller((prev) => ({ ...prev, follower_count: Math.max(0, (prev.follower_count || 0) - 1) }));
      } else {
        await followSeller(seller.id);
        setSeller((prev) => ({ ...prev, follower_count: (prev.follower_count || 0) + 1 }));
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neon-purple border-t-transparent" />
      </div>
    );
  }

  if (!seller) return null;

  const isOwnProfile = user && user.username === username;
  const sellerIdentityVerified = isIdentityVerified(seller);
  const isVerifiedStore = Number(seller.is_verified_store) === 1;
  const canShowPublicAchievements = sellerIdentityVerified;
  const visibleAchievements = isVerifiedStore
    ? (seller.store_badges || []).filter((badge) => Boolean(badge?.is_unlocked))
    : [];

  const registeredAt = seller.created_at
    ? new Date(seller.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

  const lastSeen = seller.last_seen || 'Çok önce değil';
  const avgRating = Number(seller.avg_rating ?? 5);

  const stats = [
    { icon: Package, label: 'Toplam Satış', value: seller.total_sales ?? 0, tone: 'violet' },
    { icon: ThumbsUp, label: 'Başarı Oranı', value: `%${seller.success_rate ?? 100}`, tone: 'emerald' },
    { icon: Star, label: 'Ortalama Puan', value: avgRating.toFixed(1), tone: 'amber' },
    { icon: Users, label: 'Takipçi', value: seller.follower_count ?? 0, tone: 'cyan' },
  ];

  const tabs = [
    { id: 'listings', label: 'İlanlar', count: seller.listing_count ?? 0, icon: ShoppingBag },
    { id: 'achievements', label: 'Başarımlar', count: canShowPublicAchievements ? visibleAchievements.length + 1 : 0, icon: Trophy },
    { id: 'reviews', label: 'Değerlendirmeler', count: seller.review_count ?? 0, icon: Star },
    { id: 'followers', label: 'Takipçiler', count: seller.follower_count ?? 0, icon: Users },
    { id: 'following', label: 'Takip', count: seller.following_count ?? 0, icon: UserCheck },
  ];

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-950 text-white shadow-2xl shadow-slate-950/10 dark:border-white/10">
        <div className="absolute inset-0">
          {(seller.banner_image || defaultProfileBanner) ? (
            <img src={seller.banner_image || defaultProfileBanner} alt="" className="h-full w-full object-cover opacity-62" />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_20%_12%,rgba(139,92,246,0.55),transparent_30rem),radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.38),transparent_30rem),linear-gradient(135deg,#111827,#1e1b4b_52%,#083344)]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92),rgba(15,23,42,0.72)_48%,rgba(15,23,42,0.45))]" />
          <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:44px_44px]" />
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-cyan-400/22 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-violet-500/24 blur-3xl" />
        </div>

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 max-w-full flex-col gap-5 sm:flex-row sm:items-end">
              <UserAvatar
                value={seller.avatar}
                fallback={defaultAvatar}
                className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border border-white/35 bg-white/15 text-5xl shadow-2xl shadow-black/25 backdrop-blur-xl ring-4 ring-white/10 sm:h-32 sm:w-32"
                iconSize={48}
              />

              <div className="min-w-0 max-w-full pb-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {sellerIdentityVerified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-400/12 px-3 py-1 text-xs font-black text-emerald-100">
                      <ShieldCheck size={14} /> Onaylı Satıcı
                    </span>
                  ) : null}
                  {isVerifiedStore ? <VerifiedStoreBadge /> : null}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-violet-100">
                    <Activity size={14} /> Seviye {seller.level || 1}
                  </span>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h1 className="break-words text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {seller.username}
                  </h1>
                  {sellerIdentityVerified ? <IdentityVerifiedIcon compact={false} /> : null}
                </div>

                {seller.bio ? (
                  <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/72">{seller.bio}</p>
                ) : (
                  <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/58">Oyuncu Kantinim satıcı vitrini.</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-white/62">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} /> Kayıt: {registeredAt}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:inline-block" />
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} /> Son görülme: {lastSeen}
                  </span>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="flex w-full max-w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row lg:pb-1">
                <Link
                  to="/messages"
                  state={{ activeUserId: String(seller.id) }}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/12 px-5 text-sm font-black text-white shadow-lg shadow-black/10 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/18 sm:w-auto"
                >
                  <MessageCircle size={17} /> Mesaj Gönder
                </Link>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black shadow-lg transition-all disabled:opacity-50 sm:w-auto ${
                    isFollowing
                      ? 'border border-emerald-300/25 bg-emerald-400/14 text-emerald-100 hover:-translate-y-0.5 hover:border-red-300/30 hover:bg-red-400/15 hover:text-red-100'
                      : 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-violet-950/25 hover:-translate-y-0.5'
                  }`}
                >
                  {isFollowing ? <><UserCheck size={17} /> Takibi Bırak</> : <><UserPlus size={17} /> Takip Et</>}
                </button>
              </div>
            )}
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <MetricTile key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-slate-200/80 bg-white/76 p-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-3 text-sm font-black transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-900/20'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white'
              }`}
            >
              <tab.icon size={17} />
              <span className="truncate">{tab.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${activeTab === tab.id ? 'bg-white/18 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'listings' && (
        <section>
          <SectionHeader icon={Store} title="Satıcı İlanları" subtitle="Bu satıcının aktif vitrindeki ilanları." />
          {listings.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="Henüz aktif ilan yok" text="Satıcı yeni ilan eklediğinde burada görünecek." />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {listings.map((listing) => <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />)}
            </div>
          )}
        </section>
      )}

      {activeTab === 'achievements' && (
        <section>
          <SectionHeader icon={Trophy} title="Başarım Vitrini" subtitle="Satıcının güven, mağaza ve topluluk rozetleri." />
          {canShowPublicAchievements ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              <VerifiedAchievementCard isVerified />
              {visibleAchievements.map((badge) => (
                <AchievementCard key={badge.id} badge={badge} />
              ))}
            </div>
          ) : (
            <EmptyState icon={BadgeCheck} title="Başarım vitrini henüz açılmadı" text={isOwnProfile ? 'Kimlik doğrulaması tamamlandığında Onaylı Satıcı rozetin burada görünür.' : 'Bu satıcının herkese açık başarım vitrini henüz aktif değil.'} />
          )}
        </section>
      )}

      {activeTab === 'reviews' && (
        <section className="space-y-5">
          <SectionHeader icon={Star} title="Satıcı Değerlendirmeleri" subtitle="Alıcı deneyimleri ve hizmet puanları." />

          <div className="rounded-3xl border border-slate-200/80 bg-white/78 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055]">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 text-center dark:border-amber-400/15 dark:from-amber-400/10 dark:to-white/[0.04]">
                <div className="text-5xl font-black text-slate-950 dark:text-white">{avgRating.toFixed(1)}</div>
                <div className="mt-2 flex justify-center">
                  <StarRating value={Math.round(avgRating)} readonly size="lg" />
                </div>
                <div className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{seller.review_count ?? 0} değerlendirme</div>
              </div>

              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = seller.rating_dist?.[star] ?? 0;
                  const total = seller.review_count || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={star} className="grid grid-cols-[34px_1fr_42px] items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 font-black text-slate-600 dark:text-slate-300">
                        {star}<Star size={11} className="fill-yellow-400 text-yellow-400" />
                      </span>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-right font-bold text-slate-400">{count}</span>
                    </div>
                  );
                })}

                {(seller.avg_reliability || seller.avg_satisfaction || seller.avg_speed || seller.avg_service_quality) && (
                  <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4">
                    {[
                      { label: 'Güvenilirlik', value: seller.avg_reliability },
                      { label: 'Memnuniyet', value: seller.avg_satisfaction },
                      { label: 'Hız', value: seller.avg_speed },
                      { label: 'Hizmet', value: seller.avg_service_quality },
                    ].map((criterion) => criterion.value != null && (
                      <div key={criterion.label} className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-white/[0.055]">
                        <div className="text-lg font-black text-slate-900 dark:text-white">{Number(criterion.value).toFixed(1)}</div>
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{criterion.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {reviews.length === 0 ? (
            <EmptyState icon={MessageCircle} title="Henüz değerlendirme yok" text="İlk değerlendirme geldiğinde burada listelenecek." />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article key={review.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/78 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] md:flex-row">
                  <div className="flex w-full shrink-0 items-center gap-3 md:w-48 md:flex-col md:items-start">
                    <UserAvatar
                      value={review.reviewer_avatar}
                      fallback={defaultAvatar}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl dark:bg-white/10"
                      iconSize={18}
                    />
                    <div className="min-w-0">
                      <Link to={`/p/${review.reviewer_username}`} className="inline-flex max-w-full items-center gap-1 text-sm font-black text-slate-800 transition-colors hover:text-violet-600 dark:text-white dark:hover:text-violet-200">
                        <span className="truncate">{review.reviewer_username}</span>
                        {isIdentityVerified(review) ? <IdentityVerifiedIcon compact /> : null}
                      </Link>
                      <div className="mt-1 text-xs font-bold text-slate-400">{formatDate(review.created_at)}</div>
                    </div>
                  </div>

                  <ReviewListingBlock review={review} defaultListingImage={defaultListingImage} />

                  <div className="min-w-0 flex-1">
                    <StarRating value={review.rating} readonly />
                    {(review.reliability || review.satisfaction || review.speed || review.service_quality) && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        {[
                          { label: 'Güvenilirlik', val: review.reliability },
                          { label: 'Memnuniyet', val: review.satisfaction },
                          { label: 'Hız', val: review.speed },
                          { label: 'Hizmet', val: review.service_quality },
                        ].map((criterion) => criterion.val != null && (
                          <span key={criterion.label} className="text-xs font-bold text-slate-400">
                            {criterion.label}: <span className="text-yellow-500">{criterion.val}</span>
                            <Star size={9} className="ml-0.5 inline fill-yellow-400 text-yellow-400" />
                          </span>
                        ))}
                      </div>
                    )}
                    {review.comment && <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{review.comment}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'followers' && (
        <section>
          <SectionHeader icon={Users} title="Takipçiler" subtitle="Bu satıcıyı takip eden kullanıcılar." />
          {followers.length === 0 ? (
            <EmptyState icon={Users} title="Henüz takipçi yok" text="İlk takipçiler burada listelenecek." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {followers.map((follower) => <PublicUserCard key={follower.id} item={follower} defaultAvatar={defaultAvatar} />)}
            </div>
          )}
        </section>
      )}

      {activeTab === 'following' && (
        <section>
          <SectionHeader icon={UserCheck} title="Takip Edilenler" subtitle="Satıcının takip ettiği kullanıcılar." />
          {following.length === 0 ? (
            <EmptyState icon={UserCheck} title="Henüz takip ettiği kullanıcı yok" text="Takip edilen kullanıcılar burada görünür." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {following.map((followed) => <PublicUserCard key={followed.id} item={followed} defaultAvatar={defaultAvatar} />)}
            </div>
          )}
        </section>
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
