import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Gift, RotateCcw, Search, ShieldCheck, TicketPercent, UserRound } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminCancelBalanceCoupon, adminGetBalanceCoupons } from '../../lib/adminApi';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'active', label: 'Aktif' },
  { value: 'used', label: 'Kullanıldı' },
  { value: 'cancelled', label: 'İptal' },
  { value: 'expired', label: 'Süresi Doldu' },
];

const STATUS_STYLE = {
  active: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  used: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
  expired: 'bg-amber-50 text-amber-700 border-amber-100',
};

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} ₺`;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(String(value).replace(' ', 'T')).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const option = STATUS_OPTIONS.find((item) => item.value === status);
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${STATUS_STYLE[status] || STATUS_STYLE.active}`}>
      {option?.label || status}
    </span>
  );
}

export default function AdminBalanceCoupons() {
  const [data, setData] = useState({ coupons: [], total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    adminGetBalanceCoupons({ page, status, search, limit: 30 })
      .then((response) => setData(response.data || { coupons: [], total: 0, page: 1, pages: 1 }))
      .catch((error) => showToast(error.message))
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const coupons = data.coupons || [];
    return {
      active: coupons.filter((coupon) => coupon.status === 'active').length,
      used: coupons.filter((coupon) => coupon.status === 'used').length,
      volume: coupons.reduce((total, coupon) => total + Number(coupon.amount || 0), 0),
    };
  }, [data.coupons]);

  const handleCancel = async (coupon) => {
    if (!confirm(`${coupon.code} kodlu aktif kupon iptal edilsin ve tutar gönderene iade edilsin mi?`)) return;
    setBusyId(coupon.id);
    try {
      const response = await adminCancelBalanceCoupon(coupon.id);
      showToast(response.message || 'Kupon iptal edildi.');
      load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout>
      {toast ? <div className="fixed right-4 top-4 z-50 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-xl">{toast}</div> : null}

      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-slate-950 p-5 text-white shadow-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_88%_0%,rgba(168,85,247,0.22),transparent_30%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                <Gift size={23} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200/80">Finans Kontrol</p>
                <h1 className="text-2xl font-black">Hediye Bakiye Kuponları</h1>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                <p className="text-xs font-bold text-slate-400">Aktif</p>
                <p className="text-xl font-black text-cyan-200">{summary.active}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                <p className="text-xs font-bold text-slate-400">Kullanılan</p>
                <p className="text-xl font-black text-emerald-200">{summary.used}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                <p className="text-xs font-bold text-slate-400">Sayfa Hacmi</p>
                <p className="text-xl font-black text-violet-200">{formatMoney(summary.volume)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Kod, gönderen veya alıcı kullanıcı adı ara..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setStatus(option.value);
                    setPage(1);
                  }}
                  className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                    status === option.value
                      ? 'border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-500/20'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:text-violet-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-black text-slate-900">Kupon Listesi</h2>
              <p className="text-xs font-semibold text-slate-400">{data.total || 0} kayıt</p>
            </div>
            <TicketPercent className="text-violet-500" size={20} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Kod</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Gönderen</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Alıcı</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Tutar</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Log</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center font-bold text-slate-400">Yükleniyor...</td></tr>
                ) : (data.coupons || []).length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center font-bold text-slate-400">Kayıt bulunamadı.</td></tr>
                ) : (
                  data.coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-black text-slate-900">{coupon.code}</div>
                        <div className="mt-1 text-[11px] font-bold text-slate-400">#{coupon.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 font-bold text-slate-700"><UserRound size={13} /> {coupon.sender_username || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 font-bold text-slate-700"><ShieldCheck size={13} /> {coupon.recipient_username || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600">{formatMoney(coupon.amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={coupon.status} /></td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5"><Clock size={12} /> {formatDate(coupon.created_at)}</div>
                        <div className="mt-1 text-slate-400">Son: {formatDate(coupon.expires_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[260px] space-y-1">
                          {(coupon.logs || []).slice(-3).map((log) => (
                            <div key={log.id} className="rounded-xl bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500">
                              <span className="font-black text-slate-700">{log.action}</span> · {log.actor_username || log.actor_type}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {coupon.status === 'active' ? (
                          <button
                            type="button"
                            disabled={busyId === coupon.id}
                            onClick={() => handleCancel(coupon)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                          >
                            <RotateCcw size={13} /> İptal / İade
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-slate-300">Kilitli</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data.pages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="inline-flex items-center gap-1 text-sm font-black text-slate-500 transition hover:text-violet-600 disabled:opacity-30"
              >
                <ChevronLeft size={16} /> Önceki
              </button>
              <span className="text-sm font-bold text-slate-500">{page} / {data.pages}</span>
              <button
                type="button"
                disabled={page >= data.pages}
                onClick={() => setPage((value) => Math.min(data.pages, value + 1))}
                className="inline-flex items-center gap-1 text-sm font-black text-slate-500 transition hover:text-violet-600 disabled:opacity-30"
              >
                Sonraki <ChevronRight size={16} />
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </AdminLayout>
  );
}
