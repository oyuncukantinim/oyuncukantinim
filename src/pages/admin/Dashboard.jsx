import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  Clock3,
  MessageSquare,
  Package,
  ShoppingBag,
  ShieldAlert,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminStats } from '../../lib/adminApi';

const ORDER_STATUS_STYLES = {
  completed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  refunded: 'bg-rose-50 text-rose-700',
};

const LISTING_STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700',
  sold: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-50 text-amber-700',
  removed: 'bg-rose-50 text-rose-700',
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString('tr-TR');
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

function formatCompactMoney(value) {
  return new Intl.NumberFormat('tr-TR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

function formatDayLabel(day) {
  if (!day) return '';
  const date = new Date(`${day}T00:00:00`);
  return date.toLocaleDateString('tr-TR', { weekday: 'short' });
}

function formatDateTime(value) {
  if (!value) return 'Tarih yok';
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function percentOf(part, total) {
  if (!total) return 0;
  return (Number(part || 0) / Number(total)) * 100;
}

function getLastNDays(count) {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

function normalizeSeries(rows = [], valueKey) {
  const map = new Map(
    (rows || []).map((row) => [row.day, Number(row[valueKey] || 0)]),
  );

  return getLastNDays(7).map((day) => ({
    day,
    label: formatDayLabel(day),
    value: map.get(day) || 0,
  }));
}

function DashboardSkeleton() {
  return (
    <AdminLayout>
      <div className="space-y-6 animate-pulse">
        <div className="h-64 rounded-[28px] bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 rounded-3xl bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
          <div className="h-96 rounded-3xl bg-slate-200" />
          <div className="h-96 rounded-3xl bg-slate-200" />
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({ title, value, detail, icon: Icon, accentClass, to }) {
  const content = (
    <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accentClass}`}>
          <Icon size={20} className="text-white" />
        </div>
        {to ? (
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors group-hover:text-slate-700">
            Detay
            <ArrowUpRight size={14} />
          </div>
        ) : null}
      </div>

      <div className="mt-5 text-3xl font-black tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-500">{title}</div>
      <div className="mt-3 text-xs leading-5 text-slate-400">{detail}</div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

function ProgressCard({ title, value, helper, progress, toneClass }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-800">{title}</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">{helper}</div>
        </div>
        <div className="text-lg font-black text-slate-950">{value}</div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${toneClass}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="mt-2 text-xs font-semibold text-slate-400">{formatPercent(progress)} oran</div>
    </div>
  );
}

function TrendCard({ title, subtitle, series, formatter, toneClass }) {
  const maxValue = Math.max(...series.map((item) => item.value), 1);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Son 7 Gün
        </div>
      </div>

      <div className="mt-6 flex h-56 items-end gap-3">
        {series.map((item) => {
          const height = 18 + ((item.value / maxValue) * 100);
          return (
            <div key={item.day} className="flex flex-1 flex-col items-center gap-3">
              <div className="text-[11px] font-bold text-slate-400">{formatter(item.value)}</div>
              <div className="flex h-40 w-full items-end">
                <div
                  className={`w-full rounded-t-2xl ${toneClass}`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <div className="text-xs font-semibold text-slate-500">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsightCard({ items }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-950">Yönetici İçgörüleri</h3>
          <p className="mt-1 text-sm text-slate-500">Karar vermeyi hızlandıran kısa özetler.</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <Sparkles size={18} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl ${item.iconClass}`}>
                <item.icon size={17} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900">{item.title}</div>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FocusList({ items }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-950">Öncelikli Takip</h3>
          <p className="mt-1 text-sm text-slate-500">İlk bakışta ilgilenmen gereken başlıklar.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Bugün
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
            <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${item.iconClass}`}>
              <item.icon size={18} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="font-bold text-slate-900">{item.title}</div>
                <div className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.badgeClass}`}>
                  {item.badge}
                </div>
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickLinks({ items }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-950">Hızlı Aksiyonlar</h3>
          <p className="mt-1 text-sm text-slate-500">En sık kullanılan yönetim alanlarına geç.</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="group rounded-2xl border border-slate-100 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.iconClass}`}>
                <item.icon size={18} className="text-white" />
              </div>
              <ArrowRight size={16} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </div>
            <div className="mt-4 font-bold text-slate-900">{item.title}</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ActivitySection({ title, subtitle, linkTo, linkLabel, children }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <Link to={linkTo} className="text-sm font-bold text-violet-600 transition-colors hover:text-violet-700">
          {linkLabel}
        </Link>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function EmptyRow({ text }) {
  return (
    <div className="px-2 py-8 text-center text-sm text-slate-400">{text}</div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminStats()
      .then((response) => {
        setStats(response.data);
        setError('');
      })
      .catch((err) => {
        setError(err.message || 'Dashboard verileri alınamadı.');
      })
      .finally(() => setLoading(false));
  }, []);

  const orderCountSeries = useMemo(
    () => normalizeSeries(stats?.chart_orders, 'count'),
    [stats?.chart_orders],
  );
  const revenueSeries = useMemo(
    () => normalizeSeries(stats?.chart_orders, 'revenue'),
    [stats?.chart_orders],
  );
  const userSeries = useMemo(
    () => normalizeSeries(stats?.chart_users, 'count'),
    [stats?.chart_users],
  );

  const derived = useMemo(() => {
    const weeklyOrders = orderCountSeries.reduce((sum, item) => sum + item.value, 0);
    const weeklyRevenue = revenueSeries.reduce((sum, item) => sum + item.value, 0);
    const weeklyUsers = userSeries.reduce((sum, item) => sum + item.value, 0);
    const avgTicket = weeklyOrders ? weeklyRevenue / weeklyOrders : 0;
    const activeListingRate = percentOf(stats?.active_listings, stats?.total_listings);
    const soldListingRate = percentOf(stats?.sold_listings, stats?.total_listings);
    const bannedRate = percentOf(stats?.banned_users, stats?.total_users);
    const todayShare = percentOf(stats?.orders_today, weeklyOrders);
    const recentPendingOrders = (stats?.recent_orders || []).filter((order) => order.status === 'pending').length;
    const recentRefundedOrders = (stats?.recent_orders || []).filter((order) => order.status === 'refunded').length;
    const recentRemovedListings = (stats?.recent_listings || []).filter((listing) => listing.status === 'removed').length;
    const recentBannedUsers = (stats?.recent_users || []).filter((user) => Number(user.is_banned) === 1).length;

    return {
      weeklyOrders,
      weeklyRevenue,
      weeklyUsers,
      avgTicket,
      activeListingRate,
      soldListingRate,
      bannedRate,
      todayShare,
      recentPendingOrders,
      recentRefundedOrders,
      recentRemovedListings,
      recentBannedUsers,
    };
  }, [orderCountSeries, revenueSeries, stats, userSeries]);

  const insightItems = useMemo(() => [
    {
      title: 'Bugünkü trafik yoğunluğu',
      text: `${formatNumber(stats?.orders_today)} sipariş bugün işlendi. Bu, haftalık akışın ${formatPercent(derived.todayShare)} bölümünü tek günde oluşturuyor.`,
      icon: Activity,
      iconClass: 'bg-slate-900',
    },
    {
      title: 'İlan stoğu dengesi',
      text: `${formatPercent(derived.activeListingRate)} aktif, ${formatPercent(derived.soldListingRate)} satılmış ilan oranı ile pazar yeri ritmi korunuyor.`,
      icon: ShoppingBag,
      iconClass: 'bg-cyan-500',
    },
    {
      title: 'Ortalama sipariş değeri',
      text: `Son 7 günde işlem başına yaklaşık ${formatMoney(derived.avgTicket)} değer oluştu. Bu metrik kampanya ve komisyon kararlarında ana referans olabilir.`,
      icon: BadgeDollarSign,
      iconClass: 'bg-emerald-500',
    },
  ], [derived, stats]);

  const focusItems = useMemo(() => [
    {
      title: 'Bekleyen siparişler',
      text: `Son sipariş akışında ${formatNumber(derived.recentPendingOrders)} işlem beklemede görünüyor. Teslimat ve satıcı dönüşü hızını kontrol etmek faydalı olur.`,
      badge: `${formatNumber(derived.recentPendingOrders)} adet`,
      badgeClass: 'bg-amber-50 text-amber-700',
      icon: Clock3,
      iconClass: 'bg-amber-500',
    },
    {
      title: 'İade / risk sinyali',
      text: `Yakın dönemde ${formatNumber(derived.recentRefundedOrders)} iade ve ${formatNumber(derived.recentRemovedListings)} kaldırılmış ilan dikkat çekiyor.`,
      badge: derived.recentRefundedOrders > 0 || derived.recentRemovedListings > 0 ? 'İncelenmeli' : 'Stabil',
      badgeClass: derived.recentRefundedOrders > 0 || derived.recentRemovedListings > 0
        ? 'bg-rose-50 text-rose-700'
        : 'bg-emerald-50 text-emerald-700',
      icon: AlertTriangle,
      iconClass: 'bg-rose-500',
    },
    {
      title: 'Topluluk güvenliği',
      text: `Toplam banlı kullanıcı oranı ${formatPercent(derived.bannedRate)}. Son kullanıcı akışında ${formatNumber(derived.recentBannedUsers)} problemli hesap görünüyor.`,
      badge: formatPercent(derived.bannedRate),
      badgeClass: 'bg-slate-100 text-slate-700',
      icon: ShieldAlert,
      iconClass: 'bg-violet-500',
    },
  ], [derived]);

  const quickLinks = useMemo(() => [
    {
      title: 'Siparişleri yönet',
      text: 'Bekleyen ve problemli siparişleri hızla filtrele.',
      to: '/admin/orders',
      icon: Package,
      iconClass: 'bg-emerald-500',
    },
    {
      title: 'Finans ekranı',
      text: 'Hacim, komisyon ve ödeme bekleyen işlemleri incele.',
      to: '/admin/finance',
      icon: TrendingUp,
      iconClass: 'bg-cyan-500',
    },
    {
      title: 'Kullanıcı moderasyonu',
      text: 'Ban, yetki ve profil hareketlerini kontrol et.',
      to: '/admin/users',
      icon: Users,
      iconClass: 'bg-violet-500',
    },
    {
      title: 'Mesajlar ve yorumlar',
      text: 'Topluluk hareketini ve destek ihtiyacını gözden geçir.',
      to: '/admin/messages',
      icon: MessageSquare,
      iconClass: 'bg-amber-500',
    },
  ], []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <AdminLayout>
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="max-w-md rounded-[28px] border border-rose-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <AlertTriangle size={24} />
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-950">Dashboard yüklenemedi</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-900/10 sm:px-8">
          <div className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">
                <BarChart3 size={14} />
                Yönetim Merkezi
              </div>

              <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                Platformın nabzını tek ekrandan takip et.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Bugün {formatNumber(stats?.orders_today)} sipariş, {formatMoney(stats?.revenue_today)} ciro ve {formatNumber(stats?.new_users_today)} yeni kullanıcı üretildi. Aşağıda performans trendi ve kritik operasyon sinyalleri hazır.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Haftalık Ciro</div>
                  <div className="mt-2 text-2xl font-black text-white">{formatCompactMoney(stats?.revenue_week)}</div>
                  <div className="mt-1 text-sm text-slate-300">{formatMoney(stats?.revenue_week)} toplam hacim</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Haftalık Sipariş</div>
                  <div className="mt-2 text-2xl font-black text-white">{formatNumber(derived.weeklyOrders)}</div>
                  <div className="mt-1 text-sm text-slate-300">Ortalama sepet {formatMoney(derived.avgTicket)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Yeni Kullanıcı</div>
                  <div className="mt-2 text-2xl font-black text-white">{formatNumber(stats?.new_users_week)}</div>
                  <div className="mt-1 text-sm text-slate-300">7 günlük toplam kayıt</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white">Durum Özeti</h3>
                  <p className="mt-1 text-sm text-slate-300">Anlık karar vermeyi kolaylaştıran kısa görünüm.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                  <Sparkles size={18} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Platform Sağlığı</div>
                  <div className="mt-2 text-2xl font-black text-white">{formatPercent(derived.activeListingRate)}</div>
                  <p className="mt-1 text-sm text-slate-300">İlan havuzunun aktif kalan bölümü.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Yorumlar</div>
                    <div className="mt-2 text-xl font-black text-white">{formatNumber(stats?.total_reviews)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Mesajlar</div>
                    <div className="mt-2 text-xl font-black text-white">{formatNumber(stats?.total_messages)}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
                    <Clock3 size={16} />
                    Operasyon Notu
                  </div>
                  <p className="mt-2 text-sm leading-6 text-amber-50">
                    Son akışta {formatNumber(derived.recentPendingOrders)} bekleyen sipariş ve {formatNumber(derived.recentRefundedOrders)} iade kaydı öne çıkıyor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Toplam Kullanıcı"
            value={formatNumber(stats?.total_users)}
            detail={`${formatNumber(stats?.new_users_today)} kullanıcı bugün katıldı.`}
            icon={Users}
            accentClass="bg-violet-500"
            to="/admin/users"
          />
          <MetricCard
            title="Aktif İlan"
            value={formatNumber(stats?.active_listings)}
            detail={`${formatNumber(stats?.sold_listings)} ilan satılmış durumda.`}
            icon={ShoppingBag}
            accentClass="bg-cyan-500"
            to="/admin/listings"
          />
          <MetricCard
            title="Toplam Sipariş"
            value={formatNumber(stats?.total_orders)}
            detail={`${formatNumber(stats?.orders_today)} sipariş bugün işlendi.`}
            icon={Package}
            accentClass="bg-emerald-500"
            to="/admin/orders"
          />
          <MetricCard
            title="Toplam Ciro"
            value={formatMoney(stats?.revenue_total)}
            detail={`${formatMoney(stats?.revenue_today)} bugünkü tamamlanan ciro.`}
            icon={BadgeDollarSign}
            accentClass="bg-orange-500"
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendCard
                title="Sipariş Akışı"
                subtitle="Gün bazında sipariş yoğunluğu"
                series={orderCountSeries}
                formatter={(value) => formatNumber(value)}
                toneClass="bg-gradient-to-t from-violet-600 to-cyan-400"
              />
              <TrendCard
                title="Kullanıcı Kazanımı"
                subtitle="Son 7 günde yeni kayıtlar"
                series={userSeries}
                formatter={(value) => formatNumber(value)}
                toneClass="bg-gradient-to-t from-slate-900 to-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ProgressCard
                title="Aktif İlan Oranı"
                value={formatNumber(stats?.active_listings)}
                helper="Toplam ilan havuzunun şu anda satışa açık kalan bölümü."
                progress={derived.activeListingRate}
                toneClass="bg-gradient-to-r from-cyan-500 to-violet-500"
              />
              <ProgressCard
                title="Satılan İlan Oranı"
                value={formatNumber(stats?.sold_listings)}
                helper="Tamamlanmış satışların ilan havuzundaki payı."
                progress={derived.soldListingRate}
                toneClass="bg-gradient-to-r from-emerald-500 to-cyan-500"
              />
              <ProgressCard
                title="Banlı Kullanıcı Oranı"
                value={formatNumber(stats?.banned_users)}
                helper="Toplam kullanıcılar içinde moderasyon gerektiren pay."
                progress={derived.bannedRate}
                toneClass="bg-gradient-to-r from-rose-500 to-orange-500"
              />
            </div>
          </div>

          <div className="space-y-6">
            <InsightCard items={insightItems} />
            <FocusList items={focusItems} />
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <QuickLinks items={quickLinks} />

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-950">Gelir Özeti</h3>
                <p className="mt-1 text-sm text-slate-500">Haftalık finans ritmini kompakt görünümde izle.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Son 7 Gün
              </div>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">İşlem Hacmi</div>
              <div className="mt-2 text-3xl font-black">{formatMoney(derived.weeklyRevenue)}</div>
              <p className="mt-1 text-sm text-slate-300">{formatNumber(derived.weeklyOrders)} siparişten oluşan 7 günlük hacim.</p>

              <div className="mt-6 space-y-3">
                {revenueSeries.map((item) => {
                  const maxRevenue = Math.max(...revenueSeries.map((entry) => entry.value), 1);
                  const width = 20 + ((item.value / maxRevenue) * 80);
                  return (
                    <div key={item.day}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-slate-300">
                        <span>{item.label}</span>
                        <span>{formatMoney(item.value)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ActivitySection
            title="Yeni Kullanıcılar"
            subtitle="Son kayıt olan hesaplar ve durum bilgileri"
            linkTo="/admin/users"
            linkLabel="Kullanıcılara git"
          >
            {(stats?.recent_users || []).length === 0 ? (
              <EmptyRow text="Yeni kullanıcı kaydı yok." />
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_users.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-lg">
                      {user.avatar || '👤'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-slate-900">{user.username}</div>
                      <div className="truncate text-sm text-slate-500">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${Number(user.is_banned) === 1 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {Number(user.is_banned) === 1 ? 'Banlı' : 'Aktif'}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{formatDateTime(user.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ActivitySection>

          <ActivitySection
            title="Son Siparişler"
            subtitle="Akışın son hareketleri ve işlem durumları"
            linkTo="/admin/orders"
            linkLabel="Siparişlere git"
          >
            {(stats?.recent_orders || []).length === 0 ? (
              <EmptyRow text="Yeni sipariş yok." />
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_orders.map((order) => (
                  <div key={order.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-900">{order.item_title || 'Ürün bilgisi yok'}</div>
                        <div className="mt-1 text-sm text-slate-500">{order.buyer || 'Alıcı yok'} • {order.seller || 'Satıcı yok'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-600">{formatMoney(order.amount)}</div>
                        <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${ORDER_STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-700'}`}>
                          {order.status === 'completed' ? 'Tamamlandı' : order.status === 'pending' ? 'Bekliyor' : order.status === 'refunded' ? 'İade' : order.status}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">{formatDateTime(order.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </ActivitySection>

          <ActivitySection
            title="Yeni İlanlar"
            subtitle="Pazaryerine eklenen son içerikler"
            linkTo="/admin/listings"
            linkLabel="İlanlara git"
          >
            {(stats?.recent_listings || []).length === 0 ? (
              <EmptyRow text="Yeni ilan yok." />
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_listings.map((listing) => (
                  <div key={listing.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-900">{listing.title}</div>
                        <div className="mt-1 text-sm text-slate-500">{listing.seller || 'Satıcı bilgisi yok'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-600">{formatMoney(listing.price)}</div>
                        <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${LISTING_STATUS_STYLES[listing.status] || 'bg-slate-100 text-slate-700'}`}>
                          {listing.status === 'active' ? 'Aktif' : listing.status === 'sold' ? 'Satıldı' : listing.status === 'pending' ? 'Bekliyor' : listing.status === 'removed' ? 'Kaldırıldı' : listing.status}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">{formatDateTime(listing.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </ActivitySection>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Haftalık Kullanıcı"
            value={formatNumber(derived.weeklyUsers)}
            detail="Son 7 gün içinde açılan toplam kullanıcı hesabı."
            icon={Users}
            accentClass="bg-slate-900"
          />
          <MetricCard
            title="Toplam Yorum"
            value={formatNumber(stats?.total_reviews)}
            detail="Topluluk etkileşimi ve memnuniyet sinyali."
            icon={Star}
            accentClass="bg-amber-500"
            to="/admin/reviews"
          />
          <MetricCard
            title="Toplam Mesaj"
            value={formatNumber(stats?.total_messages)}
            detail="Destek ve kullanıcı iletişim havuzunun genel büyüklüğü."
            icon={MessageSquare}
            accentClass="bg-violet-500"
            to="/admin/messages"
          />
        </section>
      </div>
    </AdminLayout>
  );
}
