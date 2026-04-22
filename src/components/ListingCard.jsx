import { Link } from 'react-router-dom';
import { Image as ImageIcon, Star, Zap, BadgeCheck } from 'lucide-react';
import { listingSlug } from '../lib/api';
import { getListingCoverImage } from '../lib/listingMedia';
import { getListingActiveDopingTypes } from '../lib/doping';

const DOPING_META = {
  vitrine: { label: 'Vitrin', Icon: Star, strip: 'bg-amber-700/85', ring: 'ring-amber-500/60' },
  featured: { label: 'Öne Çıkar', Icon: Zap, strip: 'bg-violet-600', ring: 'ring-violet-500/60' },
};

const CATEGORY_CHIP_BASE = 'inline-flex items-center rounded-full border border-neon-cyan/20 bg-neon-cyan/10 font-bold text-cyan-700';

export default function ListingCard({ listing, compact = false, dense = false, fallbackImage = '' }) {
  const coverImg = getListingCoverImage(listing, fallbackImage);
  const activeTypes = getListingActiveDopingTypes(listing);
  const hasDoping = activeTypes.length > 0;
  const listingUrl = listingSlug(listing.title, listing.id);
  const sellerVerified = Number(listing.seller_is_verified_store) === 1;

  const ringClass = activeTypes.includes('vitrine')
    ? DOPING_META.vitrine.ring
    : activeTypes.includes('featured')
      ? DOPING_META.featured.ring
      : '';

  if (compact) {
    return (
      <article className={`card group flex flex-row overflow-hidden p-0 ${hasDoping ? `ring-2 ${ringClass}` : ''}`}>
        {/* Sol: Fotoğraf */}
        <Link to={listingUrl} className="relative w-36 shrink-0 self-stretch overflow-hidden rounded-l-2xl bg-surface-100 sm:w-40">
          {coverImg ? (
            <img
              src={coverImg}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <ImageIcon size={32} />
            </div>
          )}
          {hasDoping && (
            <div className="absolute inset-x-0 bottom-0 flex divide-x divide-white/20">
              {activeTypes.map((type) => {
                const meta = DOPING_META[type];
                return (
                  <div key={type} className={`flex flex-1 items-center justify-center gap-0.5 py-0.5 text-[8px] font-extrabold tracking-wide text-white ${meta.strip}`}>
                    <meta.Icon size={7} strokeWidth={2.5} />
                    {meta.label}
                  </div>
                );
              })}
            </div>
          )}
        </Link>

        {/* Sağ: Detaylar */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 p-3">
          <div className="min-w-0">
            <span className={`${CATEGORY_CHIP_BASE} mb-1 px-1.5 py-0 text-[9px] leading-4`}>{listing.category_name || listing.category || listing.type}</span>
            <Link to={listingUrl}>
              <h3
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                className="min-w-0 overflow-hidden break-words text-sm font-bold leading-snug text-gray-800 transition-colors group-hover:text-neon-purple"
              >
                {listing.title}
              </h3>
            </Link>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-100 bg-white text-sm shadow-sm">
                {listing.avatar || '👤'}
              </div>
              <Link
                to={`/p/${listing.seller}`}
                className="inline-flex min-w-0 items-center gap-1 truncate text-xs font-bold text-gray-600 transition-colors hover:text-neon-purple"
              >
                <span className="truncate">{listing.seller || 'Satıcı'}</span>
                {sellerVerified ? <BadgeCheck size={12} className="shrink-0 fill-emerald-500 text-white" aria-label="Onaylı Satıcı" /> : null}
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-base font-extrabold text-emerald-700">{Number(listing.price).toFixed(2)} ₺</span>
              <Link to={listingUrl} className="badge-purple inline-flex min-h-[32px] items-center text-[10px]">
                Detay
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  const cardPad = dense ? 'p-2.5' : 'p-4';
  const imgMb = dense ? 'mb-2' : 'mb-4';
  const badgeMb = dense ? 'mb-2' : 'mb-3';
  const titleCls = dense
    ? 'mb-2.5 text-[13px] leading-snug'
    : 'mb-3 text-[15px] leading-snug';
  const sellerBox = dense ? 'mb-2.5 gap-2 rounded-xl p-2' : 'mb-4 gap-2 rounded-xl p-2.5';
  const avatarCls = dense ? 'h-6 w-6 text-[12px]' : 'h-7 w-7 text-base';
  const sellerNameCls = dense ? 'text-[11px]' : 'text-[11px]';
  const priceCls = dense ? 'text-sm' : 'text-xl';
  const footerTopCls = dense ? 'pt-2' : 'pt-3';
  const detailBtnCls = dense ? 'min-h-[24px] text-[10px] px-2 py-0.5' : 'min-h-[36px] text-xs';
  const imageFallbackSize = dense ? 26 : 40;
  const imageAspectCls = dense ? 'aspect-[16/10]' : 'aspect-[4/3]';

  return (
    <article className={`card group flex h-full flex-col overflow-hidden ${cardPad} ${hasDoping ? `ring-2 ${ringClass}` : ''}`}>
      <Link to={listingUrl} className="block">
        <div className={`relative ${imgMb} ${imageAspectCls} w-full overflow-hidden rounded-xl bg-surface-100`}>
          {coverImg ? (
            <img
              src={coverImg}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <ImageIcon size={imageFallbackSize} />
            </div>
          )}

          {hasDoping ? (
            <div className="absolute inset-x-0 bottom-0 flex divide-x divide-white/20">
              {activeTypes.map((type) => {
                const meta = DOPING_META[type];
                return (
                  <div
                    key={type}
                    className={`flex flex-1 items-center justify-center gap-1 ${dense ? 'py-0.5 text-[9px]' : 'py-1 text-[10px]'} font-extrabold tracking-wide text-white ${meta.strip}`}
                  >
                    <meta.Icon size={dense ? 8 : 9} strokeWidth={2.5} />
                    {meta.label}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className={badgeMb}>
          <span className={`${CATEGORY_CHIP_BASE} ${dense ? 'px-1.5 py-0 text-[9px] leading-4' : 'px-2 py-0.5 text-[10px]'}`}>
            {listing.category_name || listing.category || listing.type}
          </span>
        </div>

        <h3
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
          className={`${titleCls} w-full min-w-0 overflow-hidden break-words font-bold text-gray-800 transition-colors group-hover:text-neon-purple`}
        >
          {listing.title}
        </h3>
      </Link>

      <div className={`${sellerBox} flex min-w-0 items-center bg-surface-100`}>
        <div className={`${avatarCls} flex shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm`}>
          {listing.avatar || '👤'}
        </div>
        <Link
          to={`/p/${listing.seller}`}
          className={`${sellerNameCls} inline-flex min-w-0 items-center gap-1 truncate font-bold text-gray-700 transition-colors hover:text-neon-purple`}
        >
          <span className="truncate">{listing.seller || 'Satıcı'}</span>
          {sellerVerified ? <BadgeCheck size={dense ? 11 : 13} className="shrink-0 fill-emerald-500 text-white" aria-label="Onaylı Satıcı" /> : null}
        </Link>
      </div>

      <div className={`mt-auto flex items-center justify-between border-t border-gray-100 ${footerTopCls}`}>
        <div className={`${priceCls} font-extrabold text-emerald-700`}>
          {Number(listing.price).toFixed(2)} ₺
        </div>
        <Link to={listingUrl} className={`badge-purple inline-flex items-center ${detailBtnCls}`}>
          Detay
        </Link>
      </div>
    </article>
  );
}
