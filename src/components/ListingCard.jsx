import { Link } from 'react-router-dom';
import { Image as ImageIcon, Star, Zap } from 'lucide-react';
import { listingSlug } from '../lib/api';
import { getListingCoverImage } from '../lib/listingMedia';
import { getListingActiveDopingTypes } from '../lib/doping';

const DOPING_META = {
  vitrine: { label: 'Vitrin', Icon: Star, strip: 'bg-amber-500', ring: 'ring-amber-400/60' },
  featured: { label: 'Öne Çıkar', Icon: Zap, strip: 'bg-violet-600', ring: 'ring-violet-500/60' },
};

export default function ListingCard({ listing, compact = false, fallbackImage = '' }) {
  const coverImg = getListingCoverImage(listing, fallbackImage);
  const activeTypes = getListingActiveDopingTypes(listing);
  const hasDoping = activeTypes.length > 0;
  const listingUrl = listingSlug(listing.title, listing.id);

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
            <span className="badge-cyan mb-1 inline-block">{listing.category_name || listing.category || listing.type}</span>
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
                className="truncate text-xs font-bold text-gray-600 transition-colors hover:text-neon-purple"
              >
                {listing.seller || 'Satıcı'}
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

  return (
    <article className={`card group flex h-full flex-col overflow-hidden p-4 ${hasDoping ? `ring-2 ${ringClass}` : ''}`}>
      <Link to={listingUrl} className="block">
        <div className="relative mb-4 h-40 w-full overflow-hidden rounded-xl bg-surface-100">
          {coverImg ? (
            <img
              src={coverImg}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <ImageIcon size={40} />
            </div>
          )}

          {hasDoping ? (
            <div className="absolute inset-x-0 bottom-0 flex divide-x divide-white/20">
              {activeTypes.map((type) => {
                const meta = DOPING_META[type];
                return (
                  <div
                    key={type}
                    className={`flex flex-1 items-center justify-center gap-1 py-1 text-[10px] font-extrabold tracking-wide text-white ${meta.strip}`}
                  >
                    <meta.Icon size={9} strokeWidth={2.5} />
                    {meta.label}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mb-3">
          <span className="badge-cyan">{listing.category_name || listing.category || listing.type}</span>
        </div>

        <h3
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
          className="mb-3 w-full min-w-0 overflow-hidden break-words text-[15px] font-bold leading-snug text-gray-800 transition-colors group-hover:text-neon-purple"
        >
          {listing.title}
        </h3>
      </Link>

      <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-surface-100 p-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white text-lg shadow-sm">
          {listing.avatar || '👤'}
        </div>
        <Link
          to={`/p/${listing.seller}`}
          className="inline-flex min-h-[36px] min-w-0 items-center truncate px-1 text-[12px] font-bold text-gray-700 transition-colors hover:text-neon-purple"
        >
          {listing.seller || 'Satıcı'}
        </Link>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="text-xl font-extrabold text-emerald-700">
          {Number(listing.price).toFixed(2)} ₺
        </div>
        <Link to={listingUrl} className="badge-purple inline-flex min-h-[36px] items-center text-xs">
          Detay
        </Link>
      </div>
    </article>
  );
}
