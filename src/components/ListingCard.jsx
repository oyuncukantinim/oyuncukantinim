import { Link } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import { listingSlug } from '../lib/api';

export default function ListingCard({ listing, compact = false }) {
  const coverImg = listing.images?.[listing.cover_index || 0];

  return (
    <Link
      to={listingSlug(listing.title, listing.id)}
      className={`card group block h-full flex flex-col ${compact ? 'p-2.5' : 'p-4'}`}
    >
      <div className={`w-full overflow-hidden rounded-xl bg-surface-100 relative ${compact ? 'mb-2.5 h-24' : 'mb-4 h-40'}`}>
        {coverImg ? (
          <img
            src={coverImg}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ImageIcon size={compact ? 30 : 40} />
          </div>
        )}
      </div>

      <div className={`flex items-center justify-between ${compact ? 'mb-1.5' : 'mb-3'}`}>
        <span className="badge-cyan">{listing.category_name || listing.category || listing.type}</span>
        <span className={`font-bold text-gray-400 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {listing.game_name || listing.game}
        </span>
      </div>

      <h3
        className={`flex-1 line-clamp-2 font-bold leading-tight text-gray-800 transition-colors group-hover:text-neon-purple ${
          compact ? 'mb-1.5 text-[13px]' : 'mb-3 text-base'
        }`}
      >
        {listing.title}
      </h3>

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
