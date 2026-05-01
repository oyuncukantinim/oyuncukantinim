import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, Copy, Gift, RotateCcw, Send, ShieldCheck, TicketPercent, Wallet } from 'lucide-react';
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
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl shadow-slate-950/20 backdrop-blur">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-white/[0.08] to-transparent px-4 py-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200/80">{direction === 'sent' ? 'Alıcı' : 'Gönderen'}</p>
          <h3 className="mt-1 text-base font-black text-white">{username || '-'}</h3>
        </div>
        <StatusBadge status={coupon.status} />
      </div>
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-400">Tutar</p>
            <p className="text-2xl font-black text-emerald-300">{formatMoney(coupon.amount)}</p>
          </div>
          <div className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-3 py-2 text-right">
            <p className="text-[10px] font-black uppercase tracking-wide text-violet-200">Kod</p>
            <p className="font-mono text-sm font-black text-white">{coupon.code}</p>
          </div>
        </div>
        <div className="grid gap-2 text-xs font-semibold text-slate-300 sm:grid-cols-2">
          <span className="inline-flex items-center gap-1.5"><Clock size={13} /> Oluşturma: {formatDate(coupon.created_at)}</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={13} /> Son: {formatDate(coupon.expires_at)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(coupon.code)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-black text-slate-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
          >
            <Copy size={13} /> Kopyala
          </button>
          {direction === 'sent' && active ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onCancel(coupon.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-xs font-black text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-50"
            >
              <RotateCcw size={13} /> İptal Et
            </button>
          ) : null}
          {direction === 'received' && active ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRedeem(coupon.code)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-3 py-2 text-xs font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:brightness-110 disabled:opacity-50"
            >
              <CheckCircle size={13} /> Bakiyeye Ekle
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

  const verified = Boolean(user?.email_verified_at || user?.is_verified_store || user?.identity_verified_at);
  const activeSent = useMemo(() => data.sent.filter((coupon) => coupon.status === 'active').length, [data.sent]);
  const activeReceived = useMemo(() => data.received.filter((coupon) => coupon.status === 'active').length, [data.received]);

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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 px-5 py-6 text-white shadow-2xl shadow-slate-950/20 sm:px-7">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(139,92,246,0.24),transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.06)_48%,transparent_52%)]" />
        </div>
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              <ShieldCheck size={14} /> Güvenli Bakiye Transferi
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">Hediye Bakiye Kuponu</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
              Kullanıcı adına özel kupon oluştur, bakiye 24 saat boyunca güvenli şekilde rezerve edilsin. Alıcı kullanmazsa tutar otomatik olarak sana döner.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-bold text-slate-400">Mevcut Bakiye</p>
                <p className="mt-1 text-xl font-black text-emerald-300">{formatMoney(user.balance)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-bold text-slate-400">Aktif Gönderim</p>
                <p className="mt-1 text-xl font-black text-cyan-200">{activeSent}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-bold text-slate-400">Kullanılabilir Kupon</p>
                <p className="mt-1 text-xl font-black text-violet-200">{activeReceived}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreate} className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Kupon Oluştur</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">Alıcı kullanıcı adı ile tek kişiye özel oluşturulur.</p>
              </div>
              <Gift className="text-violet-200" size={24} />
            </div>
            {!verified ? (
              <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
                Kupon oluşturmak için hesabınız doğrulanmış olmalı. Profilinizden e-posta veya kimlik doğrulamasını tamamlayın.
              </div>
            ) : null}
            <div className="space-y-3">
              <input
                value={recipientUsername}
                onChange={(event) => setRecipientUsername(event.target.value)}
                placeholder="Alıcı kullanıcı adı"
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
              />
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Tutar (₺)"
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
              />
              <button
                type="submit"
                disabled={busy || !verified}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} /> Hediye Kuponu Gönder
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <TicketPercent size={20} />
            </div>
            <div>
              <h2 className="font-black text-slate-900">Kupon Kullan</h2>
              <p className="text-xs font-semibold text-slate-500">Sana tanımlanan kodu bakiyene ekle.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={redeemCode}
              onChange={(event) => setRedeemCode(event.target.value.toUpperCase())}
              placeholder="OK-XXXX-XXXX-XXXX"
              className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm font-black text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => handleRedeem()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              <Wallet size={16} /> Kullan
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="font-black text-slate-900">Çalışma Kuralı</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                Kupon tutarı oluşturma anında gönderen bakiyesinden düşer. Alıcı 24 saat içinde kullanmazsa veya gönderen aktif kuponu iptal ederse tutar gönderen bakiyesine iade edilir.
              </p>
              <Link to="/profile" className="mt-3 inline-flex text-sm font-black text-violet-600 hover:text-violet-700">
                Profil sayfasına dön
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-900/10 bg-slate-950 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white"><Send size={18} className="text-cyan-300" /> Gönderdiğim Kuponlar</h2>
          {loading ? (
            <div className="py-10 text-center text-sm font-bold text-slate-400">Yükleniyor...</div>
          ) : data.sent.length === 0 ? (
            <div className="py-10 text-center text-sm font-bold text-slate-500">Henüz kupon göndermedin.</div>
          ) : (
            <div className="space-y-3">
              {data.sent.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} direction="sent" onCancel={handleCancel} onRedeem={handleRedeem} busy={busy} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-900/10 bg-slate-950 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white"><Gift size={18} className="text-violet-300" /> Bana Gelen Kuponlar</h2>
          {loading ? (
            <div className="py-10 text-center text-sm font-bold text-slate-400">Yükleniyor...</div>
          ) : data.received.length === 0 ? (
            <div className="py-10 text-center text-sm font-bold text-slate-500">Henüz kupon almadın.</div>
          ) : (
            <div className="space-y-3">
              {data.received.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} direction="received" onCancel={handleCancel} onRedeem={handleRedeem} busy={busy} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
