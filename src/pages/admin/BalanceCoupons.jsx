import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Eye, Gift, Plus, RotateCcw, Search, ShieldCheck, TicketPercent, UserRound, Users, WalletCards, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminCancelBalanceCoupon, adminCreateBalanceCoupon, adminGetBalanceCoupons } from '../../lib/adminApi';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'active', label: 'Aktif' },
  { value: 'used', label: 'Kullanıldı' },
  { value: 'cancelled', label: 'İptal' },
  { value: 'expired', label: 'Süresi Doldu' },
];

const KIND_OPTIONS = [
  { value: 'all', label: 'Tüm Kuponlar' },
  { value: 'user_gift', label: 'Kullanıcı Hediyesi' },
  { value: 'admin', label: 'Admin Kuponu' },
];

const defaultCreateForm = () => {
  return {
    scope: 'recipient',
    recipient_username: '',
    code: '',
    title: '',
    amount: '',
    starts_at: '',
    expires_at: '',
    max_uses: '1',
    per_user_limit: '1',
    require_verified_user: true,
    min_account_age_days: '0',
    admin_note: '',
  };
};

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

function formatEndDate(value) {
  return value ? formatDate(value) : 'Sınırsız';
}

function formatUsageLimit(coupon) {
  const usedCount = Number(coupon.used_count || 0);
  const maxUses = Number(coupon.max_uses || 1);
  const perUserLimit = Number(coupon.per_user_limit || 1);
  return {
    total: `${usedCount}/${maxUses}`,
    perUser: `Kişi başı ${perUserLimit}`,
  };
}

function StatusBadge({ status }) {
  const option = STATUS_OPTIONS.find((item) => item.value === status);
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${STATUS_STYLE[status] || STATUS_STYLE.active}`}>
      {option?.label || status}
    </span>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
      <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-black text-slate-100">{value || '-'}</div>
    </div>
  );
}

export default function AdminBalanceCoupons() {
  const [data, setData] = useState({ coupons: [], total: 0, page: 1, pages: 1 });
  const [activeTab, setActiveTab] = useState('list');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [kind, setKind] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    adminGetBalanceCoupons({ page, status, kind, search, limit: 30 })
      .then((response) => setData(response.data || { coupons: [], total: 0, page: 1, pages: 1 }))
      .catch((error) => showToast(error.message))
      .finally(() => setLoading(false));
  }, [kind, page, search, status]);

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

  const setForm = (key, value) => {
    setCreateForm((current) => ({ ...current, [key]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...createForm,
        amount: Number(createForm.amount),
        max_uses: Number(createForm.max_uses || 1),
        per_user_limit: Number(createForm.per_user_limit || 1),
        min_account_age_days: Number(createForm.min_account_age_days || 0),
        require_verified_user: Boolean(createForm.require_verified_user),
      };
      const response = await adminCreateBalanceCoupon(payload);
      showToast(response.message || 'Kupon oluşturuldu.');
      setCreateForm(defaultCreateForm());
      setActiveTab('list');
      setKind('admin');
      setPage(1);
      load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setCreating(false);
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

        <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { id: 'list', label: 'Kupon Yönetimi', icon: TicketPercent },
              { id: 'create', label: 'Admin Kuponu Oluştur', icon: Plus },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                  activeTab === tab.id
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'create' ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">Admin Bakiye Kuponu Oluştur</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Aynı kupon sistemi içinde genel veya tek kullanıcıya özel promosyon bakiyesi üret.</p>
              </div>
              <WalletCards className="text-violet-500" size={24} />
            </div>

            <form onSubmit={handleCreate} className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setCreateForm((current) => ({ ...current, scope: 'recipient', max_uses: '1', per_user_limit: '1' }))}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${createForm.scope === 'recipient' ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                  >
                    <UserRound size={18} />
                    <div className="mt-2 font-black">Tek Kullanıcı</div>
                    <p className="mt-1 text-xs font-semibold opacity-80">Sadece belirlenen kullanıcı adı kullanır.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateForm((current) => ({ ...current, scope: 'public' }))}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${createForm.scope === 'public' ? 'border-cyan-400 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                  >
                    <Users size={18} />
                    <div className="mt-2 font-black">Genel Kupon</div>
                    <p className="mt-1 text-xs font-semibold opacity-80">Limit dahilinde uygun kullanıcılar kullanır.</p>
                  </button>
                </div>

                {createForm.scope === 'recipient' ? (
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Alıcı Kullanıcı Adı</label>
                    <input value={createForm.recipient_username} onChange={(e) => setForm('recipient_username', e.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="kullaniciadi" />
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Tutar</label>
                    <input type="number" min="1" step="0.01" value={createForm.amount} onChange={(e) => setForm('amount', e.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Manuel Kod</label>
                    <input value={createForm.code} onChange={(e) => setForm('code', e.target.value.toUpperCase())} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm font-black outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="Boşsa otomatik" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Başlık</label>
                  <input value={createForm.title} onChange={(e) => setForm('title', e.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="Mayıs kampanyası, telafi kuponu..." />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Başlangıç</label>
                    <input type="datetime-local" value={createForm.starts_at} onChange={(e) => setForm('starts_at', e.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Bitiş</label>
                    <input type="datetime-local" value={createForm.expires_at} onChange={(e) => setForm('expires_at', e.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">Boş bırakırsan kupon sınırsız süreli olur.</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Toplam Limit</label>
                    <input type="number" min="1" value={createForm.max_uses} onChange={(e) => setForm('max_uses', e.target.value)} disabled={createForm.scope === 'recipient'} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Kullanıcı Limiti</label>
                    <input type="number" min="1" value={createForm.per_user_limit} onChange={(e) => setForm('per_user_limit', e.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Hesap Yaşı</label>
                    <input type="number" min="0" value={createForm.min_account_age_days} onChange={(e) => setForm('min_account_age_days', e.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="Gün" />
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                  <input type="checkbox" checked={createForm.require_verified_user} onChange={(e) => setForm('require_verified_user', e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  Sadece doğrulanmış kullanıcılar kullanabilsin
                </label>

                <textarea value={createForm.admin_note} onChange={(e) => setForm('admin_note', e.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="Admin iç notu..." />

                <button type="submit" disabled={creating} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:opacity-60">
                  <Plus size={16} /> Admin Kuponu Oluştur
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {activeTab === 'list' ? (
        <>
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
              {KIND_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setKind(option.value);
                    setPage(1);
                  }}
                  className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                    kind === option.value
                      ? 'border-slate-900 bg-slate-950 text-white shadow-md shadow-slate-950/15'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
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
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Tür</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Kupon Kodu</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Alıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Kullanım</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Tutar</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Başlangıç Tarihi</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Bitiş Tarihi</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">İşlem</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-slate-500">Göz</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="px-4 py-12 text-center font-bold text-slate-400">Yükleniyor...</td></tr>
                ) : (data.coupons || []).length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-12 text-center font-bold text-slate-400">Kayıt bulunamadı.</td></tr>
                ) : (
                  data.coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-xs font-black text-slate-400">#{coupon.id}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={coupon.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${coupon.coupon_kind === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-cyan-50 text-cyan-700'}`}>
                          {coupon.coupon_kind === 'admin' ? 'Admin' : 'Kullanıcı'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-black text-slate-900">{coupon.code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 font-bold text-slate-700"><ShieldCheck size={13} /> {coupon.recipient_username || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-700">{formatUsageLimit(coupon).total}</div>
                        <div className="mt-1 text-[11px] font-bold text-slate-400">{formatUsageLimit(coupon).perUser}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600">{formatMoney(coupon.amount)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5"><Clock size={12} /> {coupon.starts_at ? formatDate(coupon.starts_at) : 'Hemen'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                        {formatEndDate(coupon.expires_at)}
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
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCoupon(coupon)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                          title="Kupon detayını görüntüle"
                        >
                          <Eye size={16} />
                        </button>
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
        </>
        ) : null}
      </div>

      {selectedCoupon ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 px-4 py-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-cyan-300/15 bg-slate-950 text-white shadow-2xl shadow-cyan-950/30">
            <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 backdrop-blur">
              <div className="relative overflow-hidden px-5 py-5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_92%_10%,rgba(168,85,247,0.18),transparent_30%)]" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-cyan-200">
                        #{selectedCoupon.id}
                      </span>
                      <StatusBadge status={selectedCoupon.status} />
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${selectedCoupon.coupon_kind === 'admin' ? 'bg-violet-400/15 text-violet-200' : 'bg-cyan-400/15 text-cyan-200'}`}>
                        {selectedCoupon.coupon_kind === 'admin' ? 'Admin kuponu' : 'Kullanıcı hediyesi'}
                      </span>
                    </div>
                    <h3 className="mt-3 font-mono text-2xl font-black tracking-wide text-white">{selectedCoupon.code}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-400">{selectedCoupon.title || 'Kupon detay formu'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCoupon(null)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-white"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-wide text-emerald-200">Tutar</div>
                  <div className="mt-1 text-xl font-black text-emerald-100">{formatMoney(selectedCoupon.amount)}</div>
                </div>
                <DetailField label="Durum" value={(STATUS_OPTIONS.find((item) => item.value === selectedCoupon.status) || {}).label || selectedCoupon.status} />
                <DetailField label="Oluşturma" value={formatDate(selectedCoupon.created_at)} />
                <DetailField label="Kullanım" value={`${selectedCoupon.used_count || 0}/${selectedCoupon.max_uses || 1}`} />
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-black uppercase tracking-wide text-slate-400">Kupon Bilgileri</h4>
                  <span className="h-px flex-1 bg-gradient-to-r from-cyan-300/30 to-transparent" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailField label="Kaynak" value={selectedCoupon.coupon_kind === 'admin' ? (selectedCoupon.admin_username || 'Admin') : (selectedCoupon.sender_username || '-')} />
                  <DetailField label="Alıcı" value={selectedCoupon.recipient_username || '-'} />
                  <DetailField label="Kapsam" value={selectedCoupon.scope === 'public' ? 'Genel' : 'Tek kullanıcı'} />
                  <DetailField label="Admin Notu" value={selectedCoupon.admin_note || '-'} />
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-black uppercase tracking-wide text-slate-400">Kurallar</h4>
                  <span className="h-px flex-1 bg-gradient-to-r from-violet-300/30 to-transparent" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailField label="Başlangıç" value={selectedCoupon.starts_at ? formatDate(selectedCoupon.starts_at) : 'Hemen'} />
                  <DetailField label="Bitiş" value={formatEndDate(selectedCoupon.expires_at)} />
                  <DetailField label="Kullanıcı Limiti" value={selectedCoupon.per_user_limit || 1} />
                  <DetailField label="Hesap Yaşı Şartı" value={`${selectedCoupon.min_account_age_days || 0} gün`} />
                  <DetailField label="Doğrulama Şartı" value={Number(selectedCoupon.require_verified_user) === 1 ? 'Var' : 'Yok'} />
                  <DetailField label="Aktiflik" value={Number(selectedCoupon.is_enabled) === 1 ? 'Aktif' : 'Pasif'} />
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-black uppercase tracking-wide text-slate-400">Loglar</h4>
                  {selectedCoupon.status === 'active' ? (
                    <button
                      type="button"
                      disabled={busyId === selectedCoupon.id}
                      onClick={() => handleCancel(selectedCoupon)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs font-black text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-50"
                    >
                      <RotateCcw size={13} /> Kuponu İptal Et
                    </button>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {(selectedCoupon.logs || []).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 py-6 text-center text-sm font-bold text-slate-500">Log kaydı yok.</div>
                  ) : (
                    selectedCoupon.logs.map((log) => (
                      <div key={log.id} className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-black text-slate-100">{log.action}</div>
                          <div className="text-xs font-semibold text-slate-500">{log.note || log.actor_username || log.actor_type}</div>
                        </div>
                        <div className="text-xs font-bold text-slate-500">{formatDate(log.created_at)}</div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
