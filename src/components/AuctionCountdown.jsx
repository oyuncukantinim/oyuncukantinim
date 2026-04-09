import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { getAuctionCountdown } from '../lib/auctions';

const INITIAL_NOW = Date.now();

export default function AuctionCountdown({ auction, className = '' }) {
  const [now, setNow] = useState(INITIAL_NOW);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white ${className}`}>
      <Clock3 size={13} />
      <span>{getAuctionCountdown(now, auction)}</span>
    </div>
  );
}
