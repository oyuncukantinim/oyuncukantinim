import { Link } from 'react-router-dom';
import { Gavel, Layers3, TimerReset } from 'lucide-react';
import { auctionSlug } from '../lib/api';
import { formatAuctionMoney, getAuctionStatusMeta } from '../lib/auctions';
import AuctionCountdown from './AuctionCountdown';

function getAuctionImage(auction) {
  if (Array.isArray(auction?.images) && auction.images.length > 0) {
    const index = Math.max(0, Math.min(Number(auction.cover_index || 0), auction.images.length - 1));
    return auction.images[index] || auction.images[0];
  }
  return auction?.category_image || '';
}

export default function AuctionCard({ auction }) {
  const statusMeta = getAuctionStatusMeta(auction.status);
  const image = getAuctionImage(auction);
  const href = auctionSlug(auction.title, auction.id);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <Link to={href} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={auction.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-400">
            <Gavel size={42} />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
            <Gavel size={12} />
            Acik Arttirma
          </span>
        </div>

        <div className="absolute bottom-3 left-3">
          <AuctionCountdown auction={auction} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
          <span>{auction.category_name || 'Kategori'}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{auction.bid_count || 0} teklif</span>
        </div>

        <Link to={href} className="mb-4 block">
          <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-900 transition-colors group-hover:text-amber-600">
            {auction.title}
          </h3>
        </Link>

        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Guncel Teklif</div>
            <div className="text-xl font-black text-emerald-600">{formatAuctionMoney(auction.current_price || auction.start_price)}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-white px-3 py-2">
              <div className="mb-1 flex items-center gap-1 text-slate-400">
                <Layers3 size={12} />
                Min. artis
              </div>
              <div className="font-extrabold text-slate-800">{formatAuctionMoney(auction.min_increment)}</div>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2">
              <div className="mb-1 flex items-center gap-1 text-slate-400">
                <TimerReset size={12} />
                Baslangic
              </div>
              <div className="font-extrabold text-slate-800">{formatAuctionMoney(auction.start_price)}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">
            {auction.status === 'ended' && auction.winner_username ? `Kazanan: ${auction.winner_username}` : 'Teklif detayini gor'}
          </span>
          <Link
            to={href}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition-colors hover:bg-amber-500 hover:text-slate-950"
          >
            Incele
          </Link>
        </div>
      </div>
    </article>
  );
}
