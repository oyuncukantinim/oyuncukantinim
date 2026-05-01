import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Copy, Gift, RotateCcw, Send, ShieldCheck, TicketPercent, Wallet } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';
import { cancelBalanceCoupon, createBalanceCoupon, getBalanceCoupons, redeemBalanceCoupon } from '../lib/api';

const STATUS_META = {
  active: { label: 'Aktif', className: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100' },
  used: { label: 'Kullanıldı', className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100' },
  cancelled: { label: 'İptal', className: 'border-rose-400/40 bg-rose-400/10 text-rose-100' },
  expired: { label: 'Süresi Doldu', className: 'border-amber-400/40 bg-amber-400/10 text-amber-100' },
};

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} ₺`;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value.replace(' ', 'T')).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.active;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function CouponCard({ coupon, direction, onCancel, onRedeem, busy }) {
  const active = coupon.status === 'active';
  const username = direction === 'sent' ? coupon.recipient_username : coupon.sender_username;
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-lg shadow-slate-950/15 backdrop-blur">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(110px,0.7fr)_minmax(0,1.45fr)_minmax(0,1.55fr)_minmax(96px,auto)] lg:items-center">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/80">{direction === 'sent' ? 'Alıcı' : 'Gönderen'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-black text-white">{username || '-'}</h3>
            <StatusBadge status={coupon.status} />
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">Tutar</p>
          <p className="text-lg font-black text-emerald-300">{formatMoney(coupon.amount)}</p>
        </div>

        <div className="min-w-0 rounded-xl border border-violet-400/20 bg-violet-400/10 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <p className="min-w-0 flex-1 truncate font-mono text-sm font-black text-white">{coupon.code}</p>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(coupon.code)}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.07] text-slate-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
              title="Kodu kopyala"
              aria-label="Kodu kopyala"
            >
              <Copy size={13} />
            </button>
          </div>
        </div>

        <div className="grid gap-1 text-xs font-semibold text-slate-300 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {formatDate(coupon.created_at)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {formatDate(coupon.expires_at)}</span>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {direction === 'sent' && active ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onCancel(coupon.id)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-300/30 bg-rose-400/10 px-3 text-xs font-black text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-50"
            >
              <RotateCcw size={13} /> İptal
            </button>
          ) : null}
          {direction === 'received' && active ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRedeem(coupon.code)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-3 text-xs font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:brightness-110 disabled:opacity-50"
            >
              <CheckCircle size={13} /> Ekle
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function GiftBalanceCouponPage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();
  const [data, setData] = useState({ sent: [], received: [], can_create: false });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [recipientUsername, setRecipientUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [couponListTab, setCouponListTab] = useState('sent');

  const verified = Boolean(user?.email_verified_at || user?.is_verified_store || user?.identity_verified_at);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getBalanceCoupons();
      setData(response.data || { sent: [], received: [], can_create: false });
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    load();
  }, [load, navigate, user]);

  const updateBalance = (payload) => {
    if (!payload || payload.new_balance === undefined) return;
    updateUser({
      ...user,
      balance: Number(payload.new_balance),
      ...(payload.new_withdrawable_balance !== undefined ? { withdrawable_balance: Number(payload.new_withdrawable_balance) } : {}),
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!verified) {
      showToast('Kupon oluşturmak için hesabınızı doğrulamalısınız.');
      return;
    }
    setBusy(true);
    try {
      const response = await createBalanceCoupon({
        recipient_username: recipientUsername.trim(),
        amount: Number(amount),
      });
      updateBalance(response.data);
      setRecipientUsername('');
      setAmount('');
      showToast(response.message || 'Kupon oluşturuldu.');
      await load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRedeem = async (code = redeemCode) => {
    const cleanCode = String(code || '').trim();
    if (!cleanCode) {
      showToast('Kupon kodu girin.');
      return;
    }
    setBusy(true);
    try {
      const response = await redeemBalanceCoupon(cleanCode);
      updateBalance(response.data);
      setRedeemCode('');
      showToast(response.message || 'Kupon kullanıldı.');
      await load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (couponId) => {
    if (!confirm('Bu kullanılmamış kuponu iptal edip tutarı bakiyenize iade etmek istiyor musunuz?')) return;
    setBusy(true);
    try {
      const response = await cancelBalanceCoupon(couponId);
      updateBalance(response.data);
      showToast(response.message || 'Kupon iptal edildi.');
      await load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  const couponTabs = [
    {
      id: 'sent',
      label: 'Gönderdiğim Kuponlar',
      icon: Send,
      count: data.sent.length,
      empty: 'Henüz kupon göndermedin.',
    },
    {
      id: 'received',
      label: 'Bana Gelen Kuponlar',
      icon: Gift,
      count: data.received.length,
      empty: 'Henüz kupon almadın.',
    },
  ];
  const activeCouponTab = couponTabs.find((tab) => tab.id === couponListTab) || couponTabs[0];
  const activeCoupons = data[couponListTab] || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 px-5 py-5 text-white shadow-2xl shadow-slate-950/20 sm:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(139,92,246,0.24),transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]" />
        </div>
        <div className="relative grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              <ShieldCheck size={14} /> Güvenli Bakiye Transferi
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">Hediye Bakiye Kuponu</h1>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-300">
              Kullanıcı adına özel kupon oluştur, bakiye 24 saat boyunca güvenli şekilde rezerve edilsin. Alıcı kullanmazsa tutar otomatik olarak sana döner.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm font-black text-emerald-200">
              <Wallet size={15} /> Bakiyen: {formatMoney(user.balance)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Kupon Kullan</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">Sana tanımlanan kodu bakiyene ekle.</p>
              </div>
              <TicketPercent className="text-emerald-200" size={24} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={redeemCode}
                onChange={(event) => setRedeemCode(event.target.value.toUpperCase())}
                placeholder="OK-XXXX-XXXX-XXXX"
                className="h-12 flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 font-mono text-sm font-black text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50 focus:ring-4 focus:ring-emerald-300/10"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => handleRedeem()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:brightness-110 disabled:opacity-50"
              >
                <Wallet size={16} /> Kullan
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleCreate}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-900">Kupon Oluştur</h2>
              <p className="text-xs font-semibold text-slate-500">Alıcı kullanıcı adı ile tek kişiye özel oluşturulur.</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Gift size={20} />
            </div>
          </div>
            {!verified ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                Kupon oluşturmak için hesabınız doğrulanmış olmalı. Profilinizden e-posta veya kimlik doğrulamasını tamamlayın.
              </div>
            ) : null}
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
              <input
                value={recipientUsername}
                onChange={(event) => setRecipientUsername(event.target.value)}
                placeholder="Alıcı kullanıcı adı"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Tutar (₺)"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
              <button
                type="submit"
                disabled={busy || !verified}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} /> Hediye Kuponu Gönder
              </button>
            </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-900/10 bg-slate-950 shadow-2xl shadow-slate-950/15">
        <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Kuponlarım</h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">Gönderdiğin ve sana gelen bakiye kuponlarını tek yerden takip et.</p>
          </div>
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-1 sm:grid-cols-2">
            {couponTabs.map((tab) => {
              const Icon = tab.icon;
              const active = couponListTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCouponListTab(tab.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${
                    active
                      ? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30'
                      : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-slate-950/15 text-slate-950' : 'bg-white/10 text-slate-300'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="py-12 text-center text-sm font-bold text-slate-400">Yükleniyor...</div>
          ) : activeCoupons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm font-bold text-slate-500">{activeCouponTab.empty}</div>
          ) : (
            <div className="space-y-2">
              {activeCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} direction={couponListTab} onCancel={handleCancel} onRedeem={handleRedeem} busy={busy} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
