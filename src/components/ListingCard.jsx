import { Link } from 'react-router-dom';
import { Star, Image as ImageIcon } from 'lucide-react';
import { listingSlug } from '../lib/api';

export default function ListingCard({ listing }) {
  const coverImg = listing.images?.[listing.cover_index || 0];

  return (
    <Link to={listingSlug(listing.title, listing.id)} className="card p-4 flex flex-col h-full group block">
      {/* Cover */}
      <div className="w-full h-40 bg-surface-100 rounded-xl mb-4 overflow-hidden relative">
        {coverImg ? (
          <img src={coverImg} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon size={40} />
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-md flex items-center gap-1">
          <ImageIcon size={10} /> {listing.images?.length || 0}
        </div>
      </div>

      {/* Tags */}
      <div className="flex justify-between items-center mb-3">
        <span className="badge-cyan">{listing.category || listing.type}</span>
        <span className="text-xs font-bold text-gray-400">{listing.game_name || listing.game}</span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-800 mb-3 line-clamp-2 leading-tight flex-1 text-base group-hover:text-neon-purple transition-colors">
        {listing.title}
      </h3>

      {/* Seller */}
      <div className="flex items-center gap-3 mb-4 bg-surface-100 p-2.5 rounded-xl">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg shadow-sm border border-gray-100">
          {listing.avatar || '👤'}
        </div>
        <div>
          <Link to={`/p/${listing.seller}`} onClick={e => e.stopPropagation()} className="text-xs font-bold text-gray-700 hover:text-neon-purple transition-colors">{listing.seller || 'Satici'}</Link>
          <div className="flex items-center text-[10px] text-yellow-500 font-bold">
            <Star size={10} className="fill-current mr-1" /> {listing.rating || 5.0}
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
        <div className="text-xl font-extrabold text-neon-green">{Number(listing.price).toFixed(2)} ₺</div>
        <span className="badge-purple text-xs">Detay</span>
      </div>
    </Link>
  );
}
