import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Star, Zap } from 'lucide-react';
import { listingSlug } from '../lib/api';
import { getListingCoverImage } from '../lib/listingMedia';
import { getListingActiveDopingTypes } from '../lib/doping';

const DOPING_META = {
  vitrine:  { label: 'Vitrin',     Icon: Star,  strip: 'bg-amber-500',  ring: 'ring-amber-400/60' },
  featured: { label: 'Öne Çıkar', Icon: Zap,   strip: 'bg-violet-600', ring: 'ring-violet-500/60' },
};

const BASE_FONT  = 15; // px — başlangıç font boyutu
const MIN_FONT   = 9;  // px — minimum font boyutu
const LINE_COUNT = 2;  // max satır sayısı

function AutoFitTitle({ title, compact, className }) {
  const ref = useRef(null);
  const [fontSize, setFontSize] = useState(compact ? 11 : BASE_FONT);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const startSize = compact ? 11 : BASE_FONT;
    el.style.fontSize = `${startSize}px`;
    setFontSize(startSize);

    const lh = parseFloat(getComputedStyle(el).lineHeight) || startSize * 1.375;
    const maxH = lh * LINE_COUNT;

    let size = startSize;
    while (el.scrollHeight > maxH + 1 && size > MIN_FONT) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
    setFontSize(size);
  }, [title, compact]);

  return (
    <h3
      ref={ref}
      style={{ fontSize: `${fontSize}px` }}
      className={className}
    >
      {title}
    </h3>
  );
}

export default function ListingCard({ listing, compact = false, fallbackImage = '' }) {
  const coverImg = getListingCoverImage(listing, fallbackImage);
  const activeTypes = getListingActiveDopingTypes(listing);
  const hasDoping = activeTypes.length > 0;

  const ringClass = activeTypes.includes('vitrine')
    ? DOPING_META.vitrine.ring
    : activeTypes.includes('featured')
    ? DOPING_META.featured.ring
    : '';

  return (
    <Link
      to={listingSlug(listing.title, listing.id)}
      className={`card group block h-full flex flex-col overflow-hidden ${compact ? 'p-2.5' : 'p-4'} ${hasDoping ? `ring-2 ${ringClass}` : ''}`}
    >
      <div className={`relative w-full overflow-hidden rounded-xl bg-surface-100 ${compact ? 'mb-2.5 h-24' : 'mb-4 h-40'}`}>
        {coverImg ? (
          <img loading="lazy"             src={coverImg}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ImageIcon size={compact ? 30 : 40} />
          </div>
        )}

        {hasDoping ? (
          <div className="absolute inset-x-0 bottom-0 flex divide-x divide-white/20">
            {activeTypes.map((type) => {
              const m = DOPING_META[type];
              return (
                <div
                  key={type}
                  className={`flex flex-1 items-center justify-center gap-1 py-1 text-white ${m.strip} ${compact ? 'text-[9px]' : 'text-[10px]'} font-extrabold tracking-wide`}
                >
                  <m.Icon size={compact ? 8 : 9} strokeWidth={2.5} />
                  {m.label}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className={`flex items-center justify-between ${compact ? 'mb-1.5' : 'mb-3'}`}>
        <span className="badge-cyan">{listing.category_name || listing.category || listing.type}</span>
        <span className={`font-bold text-gray-400 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {listing.game_name || listing.game}
        </span>
      </div>

      <AutoFitTitle
        title={listing.title}
        compact={compact}
        className={`w-full min-w-0 overflow-hidden break-all font-bold leading-snug text-gray-800 transition-colors group-hover:text-neon-purple ${compact ? 'mb-1.5' : 'mb-3'}`}
      />

      <div className={`flex items-center rounded-xl bg-surface-100 ${compact ? 'mb-2.5 gap-1.5 p-1.5' : 'mb-4 gap-2.5 p-2.5'}`}>
        <div
          className={`flex flex-shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm ${
            compact ? 'h-6 w-6 text-sm' : 'h-8 w-8 text-lg'
          }`}
        >
          {listing.avatar || '👤'}
        </div>
        <Link
          to={`/p/${listing.seller}`}
          onClick={(e) => e.stopPropagation()}
          className={`truncate font-bold text-gray-700 transition-colors hover:text-neon-purple ${compact ? 'text-[10px]' : 'text-xs'}`}
        >
          {listing.seller || 'Satıcı'}
        </Link>
      </div>

      <div className={`mt-auto flex items-center justify-between border-t border-gray-100 ${compact ? 'pt-2.5' : 'pt-3'}`}>
        <div className={`font-extrabold text-neon-green ${compact ? 'text-base' : 'text-xl'}`}>
          {Number(listing.price).toFixed(2)} ₺
        </div>
        <span className={`badge-purple ${compact ? 'text-[10px]' : 'text-xs'}`}>Detay</span>
      </div>
    </Link>
  );
}
