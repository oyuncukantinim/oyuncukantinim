export function getAuctionStatusMeta(status) {
  switch (status) {
    case 'live':
      return { label: 'Canli', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    case 'scheduled':
      return { label: 'Yaklasiyor', className: 'bg-amber-50 text-amber-700 border border-amber-200' };
    case 'ended':
      return { label: 'Tamamlandi', className: 'bg-slate-100 text-slate-600 border border-slate-200' };
    case 'cancelled':
      return { label: 'Iptal', className: 'bg-rose-50 text-rose-700 border border-rose-200' };
    default:
      return { label: 'Taslak', className: 'bg-slate-100 text-slate-600 border border-slate-200' };
  }
}

export function formatAuctionMoney(value) {
  return `${Number(value || 0).toFixed(2)} ₺`;
}

export function getAuctionCountdown(now, auction) {
  if (!auction) return 'Bilinmiyor';
  const targetDate = auction.status === 'scheduled' ? auction.start_at : auction.end_at;
  if (!targetDate) return 'Bilinmiyor';

  const diff = new Date(targetDate).getTime() - now;
  if (diff <= 0) return auction.status === 'scheduled' ? 'Basladi' : 'Sona erdi';

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}g ${hours}s ${minutes}dk`;
  if (hours > 0) return `${hours}s ${minutes}dk`;
  if (minutes > 0) return `${minutes}dk ${seconds}sn`;
  return `${seconds}sn`;
}
