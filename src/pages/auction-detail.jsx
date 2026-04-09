import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Gavel, Shield, TimerReset, Trophy } from 'lucide-react';
import { getAuction, getAuctionBids, idFromSlug, placeBid } from '../lib/api';
import { formatAuctionMoney, getAuctionStatusMeta } from '../lib/auctions';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AuctionCountdown from '../components/AuctionCountdown';

function getAuctionImage(auction, index) {
  if (!Array.isArray(auction?.images) || auction.images.length === 0) return '';
  const safeIndex = Math.max(0, Math.min(index, auction.images.length - 1));
  return auction.images[safeIndex] || auction.images[0];
}

export default function AuctionDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useCart();
  const id = idFromSlug(slug);

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [placingBid, setPlacingBid] = useState(false);

  const loadAuction = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [auctionResponse, bidsResponse] = await Promise.all([
        getAuction(id),
        getAuctionBids(id),
      ]);
      const nextAuction = auctionResponse.data || null;
      setAuction(nextAuction);
      setBids(bidsResponse.data || []);
      setActiveImage(Math.max(0, Number(nextAuction?.cover_index || 0)));
      if (nextAuction?.next_min_bid) {
        setBidAmount((current) => current || String(nextAuction.next_min_bid));
      }
    } catch {
      navigate('/auctions');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadAuction();
    const interval = setInterval(() => loadAuction({ silent: true }), 5000);
    return () => clearInterval(interval);
  }, [loadAuction]);

  const statusMeta = useMemo(() => getAuctionStatusMeta(auction?.status), [auction?.status]);
  const nextBid = auction?.next_min_bid ?? auction?.start_price ?? 0;
  const topBidder = auction?.top_bid?.username || auction?.winner_username || null;
  const canBid = Boolean(user) && auction?.status === 'live' && !user?.is_admin;

  const handleBid = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setPlacingBid(true);
    try {
      const response = await placeBid({ auction_id: auction.id, amount: Number(bidAmount) });
      showToast(response.message || 'Teklif verildi.');
      setBidAmount(String(response.data?.next_min_bid || nextBid));
      await loadAuction({ silent: true });
    } catch (error) {
      showToast(error.message);
    } finally {
      setPlacingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
      </div>
    );
  }

  if (!auction) return null;

  const activeImageUrl = getAuctionImage(auction, activeImage);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-amber-600"
      >
        <ChevronLeft size={18} /> Geri don
      </button>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_420px]">
        <section className="space-y-4">
          <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="aspect-[16/10] bg-slate-100">
              {activeImageUrl ? (
                <img src={activeImageUrl} alt={auction.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-400">
                  <Gavel size={52} />
                </div>
              )}
            </div>

            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${statusMeta.className}`}>
                {statusMeta.label}
              </span>
              <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white backdrop-blur">
                Acik Arttirma
              </span>
            </div>
          </div>

          {auction.images?.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {auction.images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`h-20 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                    activeImage === index ? 'border-amber-500' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
              <span>{auction.category_name || 'Kategori'}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{auction.bid_count} teklif</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">{auction.title}</h1>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-500">
              {auction.description || 'Bu acik arttirma icin aciklama girilmedi.'}
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              <h2 className="text-lg font-black text-slate-900">Teklif Gecmisi</h2>
            </div>

            {bids.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                Henuz teklif verilmedi.
              </div>
            ) : (
              <div className="space-y-3">
                {bids.map((bid, index) => (
                  <div key={bid.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <div className="text-sm font-black text-slate-900">{bid.username}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        {new Date(bid.created_at).toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-600">{formatAuctionMoney(bid.amount)}</div>
                      <div className={`mt-1 text-[11px] font-black uppercase tracking-wide ${index === 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {index === 0 ? 'Lider teklif' : 'Teklif'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900 p-6 text-white shadow-2xl shadow-slate-900/10">
            <div className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-amber-100/70">Panel</div>
            <div className="text-4xl font-black">{formatAuctionMoney(auction.current_price || auction.start_price)}</div>
            <div className="mt-1 text-sm font-semibold text-amber-100/80">Guncel en yuksek teklif</div>

            <div className="mt-5">
              <AuctionCountdown auction={auction} className="bg-white text-slate-900" />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-wide text-amber-100/70">Baslangic</div>
                <div className="mt-1 text-lg font-black">{formatAuctionMoney(auction.start_price)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div className="text-[11px] font-black uppercase tracking-wide text-amber-100/70">Min. artis</div>
                <div className="mt-1 text-lg font-black">{formatAuctionMoney(auction.min_increment)}</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="text-[11px] font-black uppercase tracking-wide text-amber-100/70">Durum</div>
              <div className="mt-1 text-sm font-semibold text-white">
                {topBidder ? `Su an lider: ${topBidder}` : 'Lider teklif henuz yok'}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TimerReset size={16} className="text-amber-500" />
              <h2 className="text-lg font-black text-slate-900">Teklif Ver</h2>
            </div>

            {canBid ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  Minimum gecerli teklif: <strong>{formatAuctionMoney(nextBid)}</strong>
                </div>

                <input
                  type="number"
                  min={nextBid}
                  step="0.01"
                  value={bidAmount}
                  onChange={(event) => setBidAmount(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-lg font-black text-slate-900 outline-none transition-colors focus:border-amber-400"
                />

                <button
                  type="button"
                  onClick={handleBid}
                  disabled={placingBid}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                  <Gavel size={16} />
                  {placingBid ? 'Gonderiliyor...' : 'Teklif Ver'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {auction.status === 'ended' ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
                    Bu acik arttirma tamamlandi.
                  </div>
                ) : !user ? (
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition-colors hover:bg-amber-500 hover:text-slate-950"
                  >
                    Giris Yap ve Teklif Ver
                  </button>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
                    Bu hesapla su an teklif veremezsin.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Shield size={16} className="text-emerald-500" />
              <h2 className="text-lg font-black text-slate-900">Kurallar</h2>
            </div>
            <ul className="space-y-2 text-sm leading-6 text-slate-500">
              <li>Teklifler admin tarafindan olusturulan acik arttirmalar icin gecerlidir.</li>
              <li>Gecerli teklif tutari mevcut lider teklifin ustunde olmalidir.</li>
              <li>Sure bitince lider teklif kazanan olarak belirlenir.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
