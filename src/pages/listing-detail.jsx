import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Star, ShoppingCart,
  MessageCircle, Image as ImageIcon, Clock, Zap, Shield, Tag, Heart,
  User, X, Eye, Check, Sparkles, TrendingUp, Maximize2,
} from 'lucide-react';
import { getListing, idFromSlug, toggleFavorite, checkFavorite, getSellerReviews, getSellerListings, listingSlug, getCategoryAttributes } from '../lib/api';
import { useCart } from '../context/useCart';
import { useAuth } from '../context/useAuth';
import useSiteBrand from '../hooks/useSiteBrand';
import { getListingCoverImage, getListingImageSet } from '../lib/listingMedia';
import { IdentityVerifiedIcon, StoreBadgeIcon } from '../components/StoreBadges';
import { isIdentityVerified } from '../lib/identityVerification';
import { buildListingSeo, useSeo } from '../hooks/useSeo';
import UserAvatar from '../components/UserAvatar';
import Breadcrumb from '../components/Breadcrumb';

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [tab, setTab] = useState('description');
  const [reviewScope, setReviewScope] = useState('all');
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsHasMore, setReviewsHasMore] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [sellerListings, setSellerListings] = useState([]);
  const listingSeo = useMemo(
    () => listing ? buildListingSeo(listing) : { title: 'Oyuncu İlanı', canonical: `/listing/${slug}` },
    [listing, slug],
  );
  useSeo(listingSeo);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const listingPromise = getListing(id);
        // Prefetch attrs as soon as we know the category_id; we still have to await listing first,
        // but we fire the attrs fetch immediately after the headers return without a microtask gap.
        const r = await listingPromise;
        if (cancelled) return;
        setListing(r.data);
        setActiveImg(r.data.cover_index || 0);
        if (r.data.category_id) {
          getCategoryAttributes(r.data.category_id)
            .then((j) => { if (!cancelled) setCatAttrs(j.data || []); })
            .catch(() => {});
        }
      } catch {
        if (!cancelled) navigate('/market');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    checkFavorite(id).then(r => setFavorited(r.data?.favorited ?? false)).catch(() => {});
  }, [user, id]);

  useEffect(() => {
    if (!listing?.seller_id) return;
    setReviews([]);
    setReviewsTotal(0);
    setReviewsHasMore(false);
  }, [listing?.seller_id, reviewScope]);

  useEffect(() => {
    if (tab !== 'reviews' || !listing?.seller_id) return;
    loadReviews(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, reviewScope, listing?.seller_id, listing?.id]);

  useEffect(() => {
    if (!listing?.seller_id) return;
    getSellerListings(listing.seller_id)
      .then((response) => {
        const items = (response.data || []).filter((item) => Number(item.id) !== Number(listing.id));
        setSellerListings(items.slice(0, 10));
      })
      .catch(() => setSellerListings([]));
  }, [listing?.seller_id, listing?.id]);

  const loadReviews = async (offset = 0, replace = false) => {
    if (!listing?.seller_id || reviewsLoading) return;
    setReviewsLoading(true);
    try {
      const query = {
        paginated: 1,
        limit: 10,
        offset,
        ...(reviewScope === 'listing' ? { listing_id: listing.id } : {}),
      };
      const response = await getSellerReviews(listing.seller_id, query);
      const nextReviews = response.data?.reviews || [];
      setReviews(prev => (replace ? nextReviews : [...prev, ...nextReviews]));
      setReviewsTotal(Number(response.data?.total || 0));
      setReviewsHasMore(Boolean(response.data?.has_more));
    } catch {
      if (replace) {
        setReviews([]);
        setReviewsTotal(0);
        setReviewsHasMore(false);
      }
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    setFavLoading(true);
    try {
      const r = await toggleFavorite(listing.id);
      setFavorited(r.data?.favorited ?? false);
    } catch {
      // Keep the current favorite state if the toggle request fails.
    } finally { setFavLoading(false); }
  };

  const images = useMemo(() => (listing ? getListingImageSet(listing, defaultListingImage) : []), [listing, defaultListingImage]);
  const hasAttrs = useMemo(
    () => catAttrs.length > 0 && listing?.attributes && Object.keys(listing.attributes).length > 0,
    [catAttrs, listing]
  );

  if (loading) return (
    <div className="flex justify-center py-40">
      <div className="w-14 h-14 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );
  if (!listing) return null;

  const isSeller = user && user.id === listing.seller_id;
  const isUnavailable = listing.status === 'sold' || listing.status === 'passive' || listing.status === 'expired' || listing.status === 'inactive';

  const handleBuy = () => {
    if (isUnavailable) return;
    const coverImg = getListingCoverImage(listing, defaultListingImage);
    addToCart({
      id: listing.id, itemType: 'listing', title: listing.title,
      price: Number(listing.price),
      image: coverImg || '', listing_id: listing.id, seller: listing.seller,
      path: listingSlug(listing.title, listing.id),
    });
  };

  const prevImg = () => setActiveImg(i => (i - 1 + images.length) % images.length);
  const nextImg = () => setActiveImg(i => (i + 1) % images.length);

  const deliveryLabel = listing.delivery_type === 'stock'
    ? 'Anında'
    : listing.delivery_hours
      ? (listing.delivery_hours < 24 ? listing.delivery_hours + ' saat' : Math.floor(listing.delivery_hours / 24) + ' gün')
      : 'Manuel';
  const sellerRating = Number(listing.seller_avg_rating || listing.rating || 5).toFixed(1);
  const sellerReviewCount = Number(listing.seller_review_count || 0);
  const sellerSalesCount = Number(listing.seller_total_sales || 0);
  const sellerLevel = Number(listing.seller_level || 1);
  const listingViewCount = Number(listing.view_count || 0);
  const sellerBadges = (listing.seller_store_badges?.length ? listing.seller_store_badges : [listing.seller_highest_store_badge]).filter(Boolean).slice(0, 5);

  return (
    <div className="mx-auto max-w-[1144px]">
      <style>{`
        @keyframes ld-fade-up { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes ld-float { 0%,100% { transform: translate(0,0); } 50% { transform: translate(18px,-14px); } }
        @keyframes ld-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .ld-fade-up { animation: ld-fade-up 0.55s cubic-bezier(.4,0,.2,1) both; }
        .ld-float { animation: ld-float 12s ease-in-out infinite; }
        .ld-shimmer::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: ld-shimmer 2.5s ease-in-out infinite; }
        .ld-stagger > * { opacity: 0; animation: ld-fade-up 0.5s cubic-bezier(.4,0,.2,1) forwards; }
        .ld-stagger > *:nth-child(1) { animation-delay: .05s; }
        .ld-stagger > *:nth-child(2) { animation-delay: .1s; }
        .ld-stagger > *:nth-child(3) { animation-delay: .15s; }
        .ld-stagger > *:nth-child(4) { animation-delay: .2s; }
      `}</style>

      {/* Breadcrumb — shared component */}
      <Breadcrumb
        className="mb-4"
        items={[
          { label: 'Pazar', to: '/market' },
          (listing.category_name || listing.category)
            ? {
                label: listing.category_name || listing.category,
                to: listing.category_slug ? `/categories/${listing.category_slug}` : '/categories',
              }
            : null,
          { label: listing.title },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[700px_minmax(0,1fr)]">
        {/* LEFT — Gallery + Content */}
        <div className="space-y-5 min-w-0">
          {/* Title block */}
          <div className="ld-fade-up rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Link
                to={listing.category_slug ? `/categories/${listing.category_slug}` : '/categories'}
                className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-300"
              >
                <Tag size={10} /> {listing.category_name || listing.category}
              </Link>
              {listing.delivery_type !== 'stock' && listing.delivery_hours ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-black text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-300">
                  <Clock size={10} /> {deliveryLabel} içinde
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Eye size={10} /> {listingViewCount}
              </span>
            </div>
            <h1 className="break-words text-2xl font-black leading-tight text-slate-900 dark:text-white sm:text-3xl">
              {listing.title}
            </h1>
          </div>

          {/* Gallery card */}
          <div className="ld-fade-up overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
            <div className="flex flex-col gap-3 p-3 sm:flex-row">
              {/* Vertical thumbnails (desktop) */}
              {images.length > 1 ? (
                <div className="hidden max-h-[380px] w-20 shrink-0 flex-col gap-2 overflow-y-auto sm:flex">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImg(idx)}
                      className={`relative aspect-[3/2] w-full flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                        idx === activeImg
                          ? 'border-violet-500 shadow-md shadow-violet-200 dark:shadow-violet-900/40'
                          : 'border-transparent opacity-60 hover:border-slate-300 hover:opacity-100 dark:hover:border-slate-700'
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover bg-slate-50 dark:bg-slate-800" />
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Main image */}
              <div className="relative mx-auto aspect-[3/2] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
                {images.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="group/zoom block h-full w-full cursor-zoom-in"
                      title="Görseli büyüt"
                    >
                      <img
                        src={images[activeImg]}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/zoom:scale-[1.02]"
                      />
                      <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow-md backdrop-blur transition-opacity duration-300 group-hover/zoom:opacity-100">
                        <Maximize2 size={15} />
                      </span>
                    </button>
                    {images.length > 1 ? (
                      <>
                        <button
                          onClick={prevImg}
                          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          onClick={nextImg}
                          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                        >
                          <ChevronRight size={18} />
                        </button>
                        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2 py-1.5 backdrop-blur">
                          {images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveImg(idx)}
                              className={`h-1.5 rounded-full transition-all ${idx === activeImg ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    ) : null}
                    {/* status ribbon */}
                    {isUnavailable ? (
                      <div className="absolute left-0 top-4 rounded-r-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-lg">
                        {listing.status === 'sold' ? 'Satıldı' : 'Müsait Değil'}
                      </div>
                    ) : listing.delivery_type === 'stock' ? (
                      <div className="absolute left-0 top-4 inline-flex items-center gap-1.5 rounded-r-xl bg-gradient-to-r from-cyan-600 to-sky-500 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                        <Zap size={12} className="fill-current" /> Anında Teslimat
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon size={64} className="text-slate-300 dark:text-slate-700" />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile thumbnails */}
            {images.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto border-t border-slate-100 p-3 dark:border-slate-800 sm:hidden">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    className={`h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      idx === activeImg ? 'border-violet-500' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover bg-slate-50 dark:bg-slate-800" />
                  </button>
                ))}
              </div>
            ) : null}

          </div>

          {/* Tabs */}
          <div className="ld-fade-up overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              {[
                { key: 'description', label: 'Açıklama', icon: ImageIcon },
                ...(hasAttrs ? [{ key: 'attributes', label: 'Özellikler', icon: Tag }] : []),
                { key: 'reviews', label: 'Değerlendirme', icon: Star },
              ].map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`group relative inline-flex items-center gap-2 px-5 py-4 text-sm font-black transition-colors ${
                      active
                        ? 'text-violet-600 dark:text-violet-300'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <t.icon size={14} />
                    {t.label}
                    <span className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-transform duration-300 ${active ? 'scale-x-100' : 'scale-x-0'}`} />
                  </button>
                );
              })}
            </div>
            <div className="p-5 sm:p-6">
              {tab === 'description' ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {listing.description || (
                    <span className="italic text-slate-400 dark:text-slate-500">Satıcı bu ilan için açıklama girmemiş.</span>
                  )}
                </div>
              ) : null}
              {tab === 'attributes' && hasAttrs ? (
                <div className="ld-stagger grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {catAttrs.map(attr => {
                    const val = listing.attributes?.[attr.slug];
                    if (!val && val !== 0) return null;
                    const display = Array.isArray(val) ? val.join(', ') : val;
                    return (
                      <div key={attr.slug} className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md dark:border-slate-800 dark:from-slate-800 dark:to-slate-900 dark:hover:border-violet-800">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{attr.name}</div>
                        <div className="mt-1 truncate text-sm font-black text-slate-800 dark:text-slate-100">{display}</div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {tab === 'reviews' ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">Satıcı değerlendirmeleri</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {reviewScope === 'all'
                          ? `Son yorumlar gösteriliyor. Toplam ${reviewsTotal} değerlendirme var.`
                          : `Bu ilana ait ${reviewsTotal} değerlendirme gösteriliyor.`}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 dark:bg-slate-900">
                      {[
                        { key: 'all', label: 'Tüm değerlendirmeler' },
                        { key: 'listing', label: 'İlan Değerlendirmeleri' },
                      ].map(item => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setReviewScope(item.key)}
                          className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${
                            reviewScope === item.key
                              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {reviewsLoading && reviews.length === 0 ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-800">
                      <Star size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                      <div className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">
                        {reviewScope === 'listing' ? 'Bu ilana ait değerlendirme yok.' : 'Satıcı için henüz değerlendirme yok.'}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Yorumlar tamamlanan siparişlerden sonra görünür.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map(review => (
                        <ListingReviewCard
                          key={review.id}
                          review={review}
                        />
                      ))}
                    </div>
                  )}

                  {reviewsHasMore ? (
                    <button
                      type="button"
                      onClick={() => loadReviews(reviews.length, false)}
                      disabled={reviewsLoading}
                      className="w-full rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 transition-all hover:-translate-y-0.5 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:bg-violet-950/50"
                    >
                      {reviewsLoading ? 'Yükleniyor...' : 'Daha fazla göster'}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* RIGHT — Sticky sidebar */}
        <div className="min-w-0">
          <div className="space-y-4 lg:sticky lg:top-4">
            {/* Seller card */}
            <div className="ld-fade-up relative z-20 rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="relative flex h-10 items-center justify-center overflow-hidden rounded-t-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500">
                <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                <span className="relative text-[11px] font-black uppercase tracking-[0.2em] text-white/95">Satıcı</span>
              </div>
              <div className="relative -mt-6 px-5 pb-5">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    value={listing.avatar}
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border-4 border-white bg-white text-4xl shadow-xl dark:border-slate-900 dark:bg-slate-800"
                    iconSize={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/p/${listing.seller}`}
                        className="max-w-full truncate text-base font-black text-slate-900 transition-colors hover:text-violet-600 dark:text-white dark:hover:text-violet-300 sm:text-lg"
                      >
                        {listing.seller}
                      </Link>
                      {isIdentityVerified(listing) ? <IdentityVerifiedIcon compact /> : null}
                      {sellerBadges.map((badge) => (
                        <StoreBadgeIcon key={badge.id || badge.title} badge={badge} />
                      ))}
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                        LV {sellerLevel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-3 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-slate-900">
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-lg font-black leading-none text-slate-900 dark:text-white">{sellerRating}</span>
                    </div>
                    <div className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">{sellerReviewCount} yorum</div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3 dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-slate-900">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-emerald-500" />
                      <span className="text-lg font-black leading-none text-slate-900 dark:text-white">{sellerSalesCount}</span>
                    </div>
                    <div className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">toplam satış</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    to={`/p/${listing.seller}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-black text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <User size={13} /> Profil
                  </Link>
                  {user && !isSeller ? (
                    <Link
                      to="/messages"
                      state={{ activeUserId: String(listing.seller_id) }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <MessageCircle size={13} /> Mesaj
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2.5 text-xs font-black text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                      <Shield size={13} /> Sen
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Price + buy */}
            <div className="ld-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 shadow-2xl shadow-violet-500/30">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl ld-float" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl ld-float" style={{ animationDelay: '2s' }} />
              <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              <div className="relative">
                <div className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-violet-200">
                  <Sparkles size={12} /> İlan Fiyatı
                </div>
                <div className="flex items-end gap-2">
                  <div className="text-5xl font-black leading-none text-white">{Number(listing.price).toFixed(2)}</div>
                  <div className="pb-1 text-xl font-black text-violet-200">₺</div>
                </div>
                <div className="mt-5">
                  {isSeller ? (
                    <div className="block w-full rounded-2xl bg-white/10 py-3.5 text-center text-sm font-black text-violet-100 backdrop-blur">
                      <Shield size={14} className="mr-1.5 inline" /> Kendi İlanın
                    </div>
                  ) : isUnavailable ? (
                    <div className="block w-full rounded-2xl bg-white/10 py-3.5 text-center text-sm font-black text-white/70 backdrop-blur">
                      {listing.status === 'sold' ? 'Satıldı' : 'Müsait Değil'}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleBuy}
                        className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white py-4 text-base font-black text-violet-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
                      >
                        <ShoppingCart size={18} strokeWidth={2.4} />
                        Sepete Ekle
                      </button>
                      <button
                        onClick={handleToggleFavorite}
                        disabled={favLoading}
                        title={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                          favorited ? 'bg-rose-500 text-white hover:bg-rose-400' : 'bg-white/15 text-white backdrop-blur hover:bg-white/25'
                        }`}
                      >
                        <Heart size={20} className={favorited ? 'fill-current' : ''} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Trust mini-row */}
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2 text-[10px] font-black text-violet-100 backdrop-blur">
                  <span className="inline-flex items-center gap-1"><Check size={11} /> Güvenli</span>
                  <span className="inline-flex items-center gap-1"><Zap size={11} /> Hızlı</span>
                  <span className="inline-flex items-center gap-1"><Shield size={11} /> Korumalı</span>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="ld-fade-up ld-stagger grid grid-cols-2 gap-2.5">
              <div className="group rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Shield size={16} />
                </div>
                <div className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Güvence</div>
                <div className="text-xs font-black text-slate-700 dark:text-slate-200">Güvenli Alışveriş</div>
              </div>
              <div className="group rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  listing.delivery_type === 'stock'
                    ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300'
                    : 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300'
                }`}>
                  {listing.delivery_type === 'stock' ? <Zap size={16} /> : <Clock size={16} />}
                </div>
                <div className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Teslimat</div>
                <div className="text-xs font-black text-slate-700 dark:text-slate-200">{deliveryLabel}</div>
              </div>
              {listing.delivery_type === 'stock' ? (
                <div className="group rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300">
                    <Tag size={16} />
                  </div>
                  <div className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Teslimat</div>
                  <div className="text-xs font-black text-slate-700 dark:text-slate-200">Hazır</div>
                </div>
              ) : null}
              <div className="group rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
                  <Eye size={16} />
                </div>
                <div className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Görüntülenme</div>
                <div className="text-xs font-black text-slate-700 dark:text-slate-200">{listingViewCount} kez</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sellerListings.length > 0 ? (
        <section className="ld-fade-up mt-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Satıcının Benzer İlanları</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {sellerListings.map((item) => {
              const image = getListingCoverImage(item, defaultListingImage);
              return (
                <Link
                  key={item.id}
                  to={`/listing/${listingSlug(item.title, item.id)}`}
                  className="group flex min-w-[190px] max-w-[210px] flex-1 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-2.5 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-violet-800 dark:hover:bg-slate-900"
                >
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
                    <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-xs font-black text-slate-800 dark:text-slate-100">{item.title}</div>
                    <div className="mt-1 text-sm font-black text-orange-500">{Number(item.price || 0).toFixed(2)} TL</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition-all hover:scale-110 hover:bg-white/20"
            title="Kapat"
          >
            <X size={22} />
          </button>
          {images.length > 1 ? (
            <button
              type="button"
              onClick={prevImg}
              className="absolute left-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/10 text-white transition-all hover:scale-110 hover:bg-white/20"
              title="Önceki görsel"
            >
              <ChevronLeft size={24} />
            </button>
          ) : null}
          <img
            src={images[activeImg]}
            alt={listing.title}
            className="max-h-[86vh] max-w-[92vw] rounded-3xl object-contain shadow-2xl"
          />
          {images.length > 1 ? (
            <button
              type="button"
              onClick={nextImg}
              className="absolute right-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/10 text-white transition-all hover:scale-110 hover:bg-white/20"
              title="Sonraki görsel"
            >
              <ChevronRight size={24} />
            </button>
          ) : null}
          {images.length > 1 ? (
            <div className="absolute bottom-4 left-1/2 z-10 flex max-w-[88vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-2xl bg-white/10 p-2 backdrop-blur">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImg(idx)}
                  className={`aspect-[3/2] w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${idx === activeImg ? 'border-white opacity-100' : 'border-transparent opacity-60 hover:opacity-90'}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover bg-slate-900" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function formatReviewDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getReviewRating(review) {
  const rating = Number(review.rating || 0);
  if (rating > 0) return rating;
  const parts = [review.reliability, review.satisfaction, review.speed, review.service_quality]
    .map(Number)
    .filter(Boolean);
  if (!parts.length) return 0;
  return Math.round(parts.reduce((sum, item) => sum + item, 0) / parts.length);
}

function ListingReviewCard({ review }) {
  const rating = getReviewRating(review);
  const metrics = [
    ['Güvenilirlik', review.reliability],
    ['Memnuniyet', review.satisfaction],
    ['Hız', review.speed],
    ['Hizmet', review.service_quality],
  ].filter(([, value]) => Number(value || 0) > 0);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex gap-3">
        <UserAvatar
          value={review.reviewer_avatar}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl dark:bg-slate-900"
          iconSize={18}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Link
                to={`/p/${review.reviewer_username}`}
                className="inline-flex items-center gap-1 text-sm font-black text-slate-900 transition-colors hover:text-violet-600 dark:text-white dark:hover:text-violet-300"
              >
                <span>{review.reviewer_username || 'Kullanıcı'}</span>
                {isIdentityVerified(review) ? <IdentityVerifiedIcon compact /> : null}
              </Link>
              <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{formatReviewDate(review.created_at)}</div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={12}
                  className={index < rating ? 'fill-amber-400 text-amber-400' : 'text-amber-200 dark:text-amber-900'}
                />
              ))}
              <span className="ml-1">{rating || '-'}</span>
            </div>
          </div>

          {metrics.length ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {metrics.map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-900">
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
                  <div className="mt-1 text-sm font-black text-slate-900 dark:text-white">{Number(value || 0)}/5</div>
                </div>
              ))}
            </div>
          ) : null}

          {review.comment ? (
            <p className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              {review.comment}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
