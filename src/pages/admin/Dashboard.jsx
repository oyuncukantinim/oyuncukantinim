import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  CheckCircle2,
  CreditCard,
  Flame,
  LifeBuoy,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import UserAvatar from '../../components/UserAvatar';
import { adminStats } from '../../lib/adminApi';

const LABELS = {
  order: { completed: 'Tamamlandı', pending: 'Bekliyor', refunded: 'İade', cancelled: 'İptal' },
  listing: { active: 'Aktif', sold: 'Satıldı', pending: 'Bekliyor', removed: 'Kaldırıldı', expired: 'Süresi Doldu' },
  support: { open: 'Açık', in_review: 'İncelemede', waiting_user: 'Üye Yanıtı' },
  store: { pending: 'Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' },
};

const money = (value) => `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
const count = (value) => Number(value || 0).toLocaleString('tr-TR');
const percent = (value) => `${Number(value || 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%`;
const compactMoney = (value) => `${new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))} ₺`;

function dateTime(value) {
  if (!value) return 'Tarih yok';
  return new Date(value).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function rate(part, total) {
  return Number(total || 0) ? (Number(part || 0) / Number(total || 0)) * 100 : 0;
}

function dayLabel(day) {
  return day ? new Date(`${day}T00:00:00`).toLocaleDateString('tr-TR', { weekday: 'short' }) : '';
}

function lastDays(countValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: countValue }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (countValue - index - 1));
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  });
}

function series(rows = [], key) {
  const map = new Map((rows || []).map((row) => [row.day, Number(row[key] || 0)]));
  return lastDays(7).map((day) => ({ day, label: dayLabel(day), value: map.get(day) || 0 }));
}

function toneFor(status, type = 'default') {
  if (status === 'completed' || status === 'approved' || status === 'active') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300';
  if (status === 'pending' || status === 'processing' || status === 'in_review' || status === 'waiting_user') return 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300';
  if (status === 'rejected' || status === 'refunded' || status === 'removed' || status === 'cancelled') return 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300';
  return type === 'light' ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-semibold text-slate-400 dark:border-slate-800 dark:text-slate-500">
      {text}
    </div>
  );
}

function Skeleton() {
  return (
    <AdminLayout>
      <div className="space-y-4 animate-pulse">
        <div className="h-64 rounded-[32px] bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-[26px] bg-slate-200 dark:bg-slate-800" />)}
        </div>
        <div className="h-96 rounded-[26px] bg-slate-200 dark:bg-slate-800" />
      </div>
    </AdminLayout>
  );
}

function Stat({ title, value, helper, icon: Icon, to, tone = 'from-violet-500 to-indigo-500' }) {
  const card = (
    <div className="group h-full rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg shadow-slate-900/10`}>
          <Icon size={18} />
        </div>
        {to ? <ArrowRight size={16} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-300" /> : null}
      </div>
      <div className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</div>
      <div className="mt-1 text-[13px] font-black text-slate-700 dark:text-slate-200">{title}</div>
      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

function Queue({ title, value, helper, icon: Icon, to, tone, urgent }) {
  return (
    <Link to={to} className={`group relative overflow-hidden rounded-[24px] border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${urgent ? 'border-amber-200 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'}`}>
      <div className={`absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tone} opacity-10 blur-2xl`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} text-white`}><Icon size={18} /></div>
        <ArrowRight size={16} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-300" />
      </div>
      <div className="relative mt-4 text-3xl font-black text-slate-950 dark:text-white">{value}</div>
      <div className="relative mt-1 text-[13px] font-black text-slate-800 dark:text-slate-100">{title}</div>
      <p className="relative mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</p>
    </Link>
  );
}

function Panel({ title, subtitle, to, children }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {to ? <Link to={to} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">Git <ArrowRight size={13} /></Link> : null}
      </div>
      {children}
    </div>
  );
}

function Bars({ items, formatter = count, tone = 'from-cyan-400 to-violet-500' }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="grid h-44 grid-cols-7 items-end gap-2 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
      {items.map((item) => (
        <div key={item.day} className="flex h-full flex-col items-center justify-end gap-2">
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500">{formatter(item.value)}</div>
          <div className="flex h-[106px] w-full items-end justify-center">
            <div className={`w-full max-w-[34px] rounded-t-2xl bg-gradient-to-t ${tone} shadow-lg shadow-violet-500/10`} style={{ height: `${18 + ((item.value / max) * 82)}%` }} />
          </div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function WorkItem({ avatar, title, meta, value, badge, badgeTone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
      {avatar !== undefined ? <UserAvatar value={avatar} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base dark:bg-slate-900" iconSize={15} /> : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-black text-slate-900 dark:text-white">{title}</div>
        <div className="mt-0.5 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{meta}</div>
      </div>
      <div className="shrink-0 text-right">
        {value ? <div className="text-[13px] font-black text-slate-950 dark:text-white">{value}</div> : null}
        {badge ? <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${badgeTone || toneFor()}`}>{badge}</div> : null}
      </div>
    </div>
  );
}

function Rank({ title, rows, columns, emptyText }) {
  return (
    <Panel title={title} subtitle="Tamamlanmış satışlara göre güncel performans görünümü.">
      {!rows.length ? <Empty text={emptyText} /> : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={`${title}-${index}`} className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white dark:bg-white dark:text-slate-950">{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-black text-slate-900 dark:text-white">{row.title}</div>
                  <div className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{row.subtitle}</div>
                </div>
                <div className="text-right text-[12px] font-black text-emerald-600 dark:text-emerald-400">{row.trailing}</div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {columns.map((column) => (
                  <div key={column.label} className="rounded-xl bg-slate-50 px-2 py-2 dark:bg-slate-900">
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{column.label}</div>
                    <div className="mt-1 truncate text-[12px] font-black text-slate-900 dark:text-white">{column.render(row.raw)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminStats()
      .then((response) => {
        setStats(response.data || {});
        setError('');
      })
      .catch((err) => setError(err.message || 'Dashboard verileri alınamadı.'))
      .finally(() => setLoading(false));
  }, []);

  const orderSeries = useMemo(() => series(stats?.chart_orders, 'count'), [stats?.chart_orders]);
  const revenueSeries = useMemo(() => series(stats?.chart_orders, 'revenue'), [stats?.chart_orders]);
  const commissionSeries = useMemo(() => series(stats?.chart_orders, 'commission'), [stats?.chart_orders]);
  const userSeries = useMemo(() => series(stats?.chart_users, 'count'), [stats?.chart_users]);

  const derived = useMemo(() => {
    const weeklyOrders = orderSeries.reduce((sum, item) => sum + item.value, 0);
    const weeklyRevenue = revenueSeries.reduce((sum, item) => sum + item.value, 0);
    const weeklyUsers = userSeries.reduce((sum, item) => sum + item.value, 0);
    const operationsQueue = Number(stats?.pending_withdrawals || 0)
      + Number(stats?.processing_withdrawals || 0)
      + Number(stats?.pending_payment_accounts || 0)
      + Number(stats?.pending_store_applications || 0)
      + Number(stats?.open_support_tickets || 0);

    return {
      weeklyOrders,
      weeklyRevenue,
      weeklyUsers,
      operationsQueue,
      avgTicket: weeklyOrders ? weeklyRevenue / weeklyOrders : 0,
      activeListingRate: rate(stats?.active_listings, stats?.total_listings),
    };
  }, [orderSeries, revenueSeries, stats, userSeries]);

  const sellerRows = useMemo(() => (stats?.top_sellers || []).map((item) => ({
    title: item.username || 'Bilinmeyen satıcı',
    subtitle: `${count(item.order_count)} başarılı satış`,
    trailing: money(item.paid_earnings),
    raw: item,
  })), [stats?.top_sellers]);

  const categoryRows = useMemo(() => (stats?.top_categories || []).map((item) => ({
    title: item.category_name || 'Kategorisiz',
    subtitle: `${count(item.order_count)} sipariş`,
    trailing: money(item.revenue),
    raw: item,
  })), [stats?.top_categories]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <AdminLayout>
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="max-w-md rounded-[28px] border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-400/20 dark:bg-slate-950">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
              <AlertTriangle size={24} />
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">Dashboard yüklenemedi</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[34px] border border-slate-900 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/10 sm:p-6">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute right-10 top-8 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>
          <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <div className="relative grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">
                <Zap size={14} />
                Operasyon Komuta Merkezi
              </div>
              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                Oyuncu Kantinim yönetimini tek ekranda hızlandır.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Para çekim, banka onayı, mağaza başvurusu, destek kuyruğu, satış hacmi ve pazar sağlığı aynı karar panelinde. Bugün {count(stats?.orders_today)} sipariş ve {money(stats?.revenue_today)} tamamlanan ciro var.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <HeroMini title="Platform Geliri" value={compactMoney(stats?.platform_revenue_week)} text="Komisyon, doping ve çekim masrafı / 7 gün" />
                <HeroMini title="Satış Hacmi" value={compactMoney(derived.weeklyRevenue)} text={`${count(derived.weeklyOrders)} tamamlanan sipariş`} />
                <HeroMini title="Satıcıya Aktarılan" value={compactMoney(stats?.seller_earnings_paid_week)} text="Bu hafta satıcı bakiyesine geçen kazanç" />
                <HeroMini title="Operasyon Kuyruğu" value={count(derived.operationsQueue)} text="Aksiyon bekleyen toplam kayıt" />
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Bugünün Kontrol Listesi</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-300">Önce bakılması gereken canlı kuyruklar.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-200"><Flame size={20} /></div>
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  ['Para çekim', Number(stats?.pending_withdrawals || 0) + Number(stats?.processing_withdrawals || 0), '/admin/payment-management'],
                  ['Banka hesabı', stats?.pending_payment_accounts || 0, '/admin/payment-management'],
                  ['Mağaza başvurusu', stats?.pending_store_applications || 0, '/admin/store-management'],
                  ['Destek talebi', stats?.open_support_tickets || 0, '/admin/support'],
                ].map(([label, value, to]) => (
                  <Link key={label} to={to} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-3 py-3 transition-colors hover:bg-white/10">
                    <span className="text-sm font-bold text-slate-200">{label}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">{count(value)}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                <div className="flex items-center gap-2 text-sm font-black text-emerald-200"><CheckCircle2 size={16} /> Finans Riski</div>
                <p className="mt-2 text-sm leading-6 text-emerald-50">
                  Bekleyen/işlemde çekim toplamı {money(stats?.pending_withdrawal_amount)}. Ödeme yönetiminden hızla sonuçlandırabilirsin.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Queue title="Çekim Talepleri" value={count(Number(stats?.pending_withdrawals || 0) + Number(stats?.processing_withdrawals || 0))} helper={`${money(stats?.pending_withdrawal_amount)} toplam bekleyen/işlemde tutar.`} icon={Wallet} to="/admin/payment-management" urgent={Number(stats?.pending_withdrawals || 0) > 0} tone="from-emerald-500 to-teal-500" />
          <Queue title="Banka Hesap Onayı" value={count(stats?.pending_payment_accounts)} helper={`${count(stats?.approved_payment_accounts)} onaylı hesap kullanımda.`} icon={CreditCard} to="/admin/payment-management" urgent={Number(stats?.pending_payment_accounts || 0) > 0} tone="from-violet-500 to-fuchsia-500" />
          <Queue title="Mağaza Başvuruları" value={count(stats?.pending_store_applications)} helper={`${count(stats?.active_store_badges)} aktif rozet ve ${count(stats?.verified_stores)} onaylı mağaza.`} icon={Store} to="/admin/store-management" urgent={Number(stats?.pending_store_applications || 0) > 0} tone="from-cyan-500 to-blue-500" />
          <Queue title="Destek Kuyruğu" value={count(stats?.open_support_tickets)} helper={`${count(stats?.unassigned_support_tickets)} talep admin ataması bekliyor.`} icon={LifeBuoy} to="/admin/support" urgent={Number(stats?.open_support_tickets || 0) > 0} tone="from-rose-500 to-orange-500" />
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Stat title="Satış Hacmi" value={money(stats?.revenue_total)} helper={`${money(stats?.revenue_week)} son 7 gün tamamlanan sipariş hacmi.`} icon={BadgeDollarSign} to="/admin/orders" tone="from-orange-500 to-amber-500" />
          <Stat title="Platform Komisyonu" value={money(stats?.commission_total)} helper={`${money(stats?.commission_week)} son 7 gün satış komisyonu.`} icon={Banknote} to="/admin/finance" tone="from-amber-500 to-yellow-500" />
          <Stat title="Doping Geliri" value={money(stats?.doping_revenue_total)} helper={`${money(stats?.doping_revenue_week)} son 7 gün ilan vitrin/öne çıkarma geliri.`} icon={Zap} to="/admin/doping" tone="from-fuchsia-500 to-pink-500" />
          <Stat title="Çekim Masrafı" value={money(stats?.withdrawal_fee_total)} helper={`${money(stats?.withdrawal_fee_week)} son 7 gün para çekim işlem masrafı.`} icon={Wallet} to="/admin/payment-management" tone="from-emerald-500 to-teal-500" />
          <Stat title="Bakiye Yükleme" value={money(stats?.balance_topup_total)} helper={`${money(stats?.balance_topup_week)} son 7 gün kullanıcı bakiye yüklemesi.`} icon={CreditCard} to="/admin/finance" tone="from-sky-500 to-blue-500" />
          <Stat title="Satıcı Kazancı" value={money(stats?.seller_earnings_paid_total)} helper={`${money(stats?.pending_payout)} satıcıya aktarılmayı bekliyor.`} icon={Users} to="/admin/finance" tone="from-lime-500 to-green-500" />
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Panel title="Sipariş Ritmi" subtitle="Son 7 günün sipariş yoğunluğu. Ani düşüş veya yoğunluk burada hızlı görünür.">
              <Bars items={orderSeries} />
            </Panel>
            <Panel title="Komisyon Akışı" subtitle={`${money(stats?.commission_week)} haftalık satış komisyonu ve ${money(derived.avgTicket)} ortalama sepet.`}>
              <Bars items={commissionSeries} formatter={compactMoney} tone="from-emerald-400 to-cyan-500" />
            </Panel>
          </div>

          <Panel title="Pazar Kontrolü" subtitle="İlan, doping, yorum ve mağaza havuzunun kısa sağlık özeti.">
            <div className="space-y-3">
              <div className="rounded-3xl bg-slate-950 p-4 text-white dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Aktif İlan Oranı</div>
                    <div className="mt-2 text-3xl font-black">{percent(derived.activeListingRate)}</div>
                  </div>
                  <ShoppingBag className="text-cyan-300" size={34} />
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${Math.min(100, derived.activeListingRate)}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Info title="Yorum" value={count(stats?.total_reviews)} icon={Star} />
                <Info title="Aktif Doping" value={count(Number(stats?.active_vitrine_listings || 0) + Number(stats?.active_featured_listings || 0))} icon={Zap} />
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <Panel title="Çekim Kuyruğu" subtitle="İşlem bekleyen son para çekim talepleri." to="/admin/payment-management">
            <WorkList items={stats?.recent_withdrawals} empty="Bekleyen çekim talebi yok." render={(request) => (
              <WorkItem key={request.id} avatar={request.avatar} title={request.username || 'Kullanıcı yok'} meta={`${request.bank_name || 'Banka yok'} · ${request.account_holder || 'Hesap sahibi yok'}`} value={money(request.total_amount || request.amount)} badge={request.status === 'processing' ? 'İşlemde' : 'Bekliyor'} badgeTone={toneFor(request.status)} />
            )} />
          </Panel>
          <Panel title="Mağaza Başvuruları" subtitle="Onaylı mağaza modülündeki son başvurular." to="/admin/store-management">
            <WorkList items={stats?.recent_store_applications} empty="Mağaza başvurusu yok." render={(application) => (
              <WorkItem key={application.id} avatar={application.avatar} title={application.username || 'Kullanıcı yok'} meta={`${application.email || 'E-posta yok'} · ${dateTime(application.created_at)}`} badge={LABELS.store[application.status] || application.status} badgeTone={toneFor(application.status)} />
            )} />
          </Panel>
          <Panel title="Destek Alarmı" subtitle="Açık ve incelemede olan son destek talepleri." to="/admin/support">
            <WorkList items={stats?.recent_support_tickets} empty="Açık destek talebi yok." render={(ticket) => (
              <WorkItem key={ticket.id} avatar={ticket.avatar} title={ticket.subject || ticket.ticket_no || 'Destek talebi'} meta={`${ticket.username || 'Kullanıcı yok'} · ${dateTime(ticket.last_reply_at || ticket.created_at)}`} badge={LABELS.support[ticket.status] || ticket.status} badgeTone={ticket.priority === 'critical' || ticket.priority === 'high' ? toneFor('rejected') : toneFor(ticket.status)} />
            )} />
          </Panel>
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <Rank title="Satıcı Performansı" rows={sellerRows} emptyText="Satıcı performans verisi yok." columns={[
            { label: 'Ciro', render: (row) => money(row.revenue) },
            { label: 'Bekleyen', render: (row) => money(row.pending_earnings) },
            { label: 'Komisyon', render: (row) => money(row.commission) },
          ]} />
          <Rank title="Kategori Performansı" rows={categoryRows} emptyText="Kategori performans verisi yok." columns={[
            { label: 'Ciro', render: (row) => money(row.revenue) },
            { label: 'Komisyon', render: (row) => money(row.commission) },
            { label: 'Ort. Sepet', render: (row) => money(row.avg_ticket) },
          ]} />
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <Panel title="Son Siparişler" subtitle="Sipariş akışındaki en yeni kayıtlar." to="/admin/orders">
            <WorkList items={stats?.recent_orders} empty="Sipariş kaydı yok." render={(order) => (
              <WorkItem key={order.id} title={order.item_title || 'Ürün bilgisi yok'} meta={`${order.buyer || 'Alıcı yok'} → ${order.seller || 'Satıcı yok'} · ${dateTime(order.created_at)}`} value={money(order.amount)} badge={LABELS.order[order.status] || order.status} badgeTone={toneFor(order.status)} />
            )} />
          </Panel>
          <Panel title="Yeni İlanlar" subtitle="Pazara eklenen son ilanlar." to="/admin/listings">
            <WorkList items={stats?.recent_listings} empty="Yeni ilan yok." render={(listing) => (
              <WorkItem key={listing.id} title={listing.title || 'İlan başlığı yok'} meta={`${listing.seller || 'Satıcı yok'} · ${dateTime(listing.created_at)}`} value={money(listing.price)} badge={LABELS.listing[listing.status] || listing.status} badgeTone={toneFor(listing.status)} />
            )} />
          </Panel>
          <Panel title="Yeni Kullanıcılar" subtitle="Son kayıtlar ve hesap durumu." to="/admin/users">
            <WorkList items={stats?.recent_users} empty="Yeni kullanıcı yok." render={(user) => (
              <WorkItem key={user.id} avatar={user.avatar} title={user.username || 'Kullanıcı'} meta={`${user.email || 'E-posta yok'} · ${dateTime(user.created_at)}`} badge={Number(user.is_banned) === 1 ? 'Banlı' : 'Aktif'} badgeTone={Number(user.is_banned) === 1 ? toneFor('rejected') : toneFor('approved')} />
            )} />
          </Panel>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Stat title="Toplam Kullanıcı" value={count(stats?.total_users)} helper={`${count(derived.weeklyUsers)} yeni kayıt son 7 günde geldi.`} icon={Users} to="/admin/users" tone="from-cyan-500 to-blue-500" />
          <Stat title="Banlı Kullanıcı" value={count(stats?.banned_users)} helper="Moderasyon tarafından tamamen kısıtlanan hesaplar." icon={ShieldCheck} to="/admin/users" tone="from-rose-500 to-red-500" />
          <Stat title="XP Hareketi" value={count(stats?.xp_events_today)} helper={`${count(stats?.xp_awarded_week)} XP son 7 günde kullanıcılara dağıtıldı.`} icon={Sparkles} to="/admin/xp-management" tone="from-violet-500 to-purple-500" />
          <Stat title="Toplam Yorum" value={count(stats?.total_reviews)} helper={`${count(stats?.total_messages)} mesaj kaydıyla birlikte topluluk aktivitesi.`} icon={Star} to="/admin/reviews" tone="from-amber-500 to-yellow-500" />
        </section>
      </div>
    </AdminLayout>
  );
}

function HeroMini({ title, value, text }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <div className="mt-1 text-xs font-semibold text-slate-300">{text}</div>
    </div>
  );
}

function Info({ title, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400"><Icon size={14} /> {title}</div>
      <div className="mt-2 text-xl font-black text-slate-950 dark:text-white">{value}</div>
    </div>
  );
}

function WorkList({ items, empty, render }) {
  if (!items?.length) return <Empty text={empty} />;
  return <div className="space-y-2">{items.map(render)}</div>;
}
