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
import UserAvatar from '../../components/UserAvatar';

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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
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
      <div className="space-y-3 animate-pulse">
        <div className="h-52 rounded-[24px] bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-[24px] bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.6fr_1fr]">
          <div className="h-80 rounded-[24px] bg-slate-200" />
          <div className="h-80 rounded-[24px] bg-slate-200" />
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({ title, value, detail, icon: Icon, accentClass, to }) {
  const content = (
    <div className="group rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accentClass}`}>
          <Icon size={18} className="text-white" />
        </div>
        {to ? (
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors group-hover:text-slate-700">
            Detay
            <ArrowUpRight size={14} />
          </div>
        ) : null}
      </div>

      <div className="mt-4 text-2xl font-black tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 text-[13px] font-semibold text-slate-500">{title}</div>
      <div className="mt-2 text-[11px] leading-5 text-slate-400">{detail}</div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

function ProgressCard({ title, value, helper, progress, toneClass }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-bold text-slate-800">{title}</div>
          <div className="mt-1 text-[11px] leading-5 text-slate-500">{helper}</div>
        </div>
        <div className="text-base font-black text-slate-950">{value}</div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${toneClass}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="mt-2 text-[11px] font-semibold text-slate-400">{formatPercent(progress)} oran</div>
    </div>
  );
}

function buildChartGeometry(series = []) {
  const width = 320;
  const height = 188;
  const paddingX = 18;
  const paddingTop = 18;
  const paddingBottom = 46;
  const chartWidth = width - (paddingX * 2);
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(...series.map((item) => item.value), 1);

  const points = series.map((item, index) => {
    const x = paddingX + ((chartWidth / Math.max(series.length - 1, 1)) * index);
    const y = paddingTop + chartHeight - ((item.value / maxValue) * chartHeight);
    return { ...item, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : '';

  return { width, height, points, linePath, areaPath };
}

function TrendCard({ title, subtitle, series, formatter, tone }) {
  const { width, height, points, linePath, areaPath } = buildChartGeometry(series);
  const peakPoint = points.reduce((best, current) => (current.value > (best?.value ?? -1) ? current : best), null);
  const latestPoint = points[points.length - 1];
  const gradientId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-[12px] text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Son 7 Gün
        </div>
      </div>

      <div className="mt-3 rounded-[22px] border border-slate-100 bg-slate-50/80 p-3">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Güncel</div>
            <div className="mt-1 text-xl font-black text-slate-950">{formatter(latestPoint?.value || 0)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Tepe</div>
            <div className="mt-1 text-sm font-bold text-slate-700">
              {peakPoint ? `${formatter(peakPoint.value)} · ${peakPoint.label}` : '-'}
            </div>
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full overflow-visible">
          <defs>
            <linearGradient id={`${gradientId}-fill`} x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor={tone.fill} stopOpacity="0.3" />
              <stop offset="100%" stopColor={tone.fill} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 1, 2].map((index) => {
            const y = 24 + (index * 42);
            return (
              <line
                key={index}
                x1="16"
                y1={y}
                x2={width - 16}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="4 6"
                strokeWidth="1"
              />
            );
          })}

          {areaPath ? <path d={areaPath} fill={`url(#${gradientId}-fill)`} /> : null}
          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke={tone.stroke}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {points.map((point) => (
            <g key={point.day}>
              <circle cx={point.x} cy={point.y} r="5.5" fill="white" />
              <circle cx={point.x} cy={point.y} r="3.5" fill={tone.stroke} />
              <text
                x={point.x}
                y={height - 18}
                textAnchor="middle"
                className="fill-slate-600 text-[11px] font-bold"
              >
                {formatter(point.value)}
              </text>
              <text
                x={point.x}
                y={height - 4}
                textAnchor="middle"
                className="fill-slate-400 text-[11px] font-semibold"
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}


function InsightCard({ items }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-black text-slate-950">Yönetici İçgörüleri</h3>
          <p className="mt-1 text-[12px] text-slate-500">Karar vermeyi hızlandıran kısa özetler.</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Sparkles size={16} />
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${item.iconClass}`}>
                <item.icon size={15} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-900">{item.title}</div>
                <p className="mt-1 text-[12px] leading-5 text-slate-500">{item.text}</p>
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
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-black text-slate-950">Öncelikli Takip</h3>
          <p className="mt-1 text-[12px] text-slate-500">İlk bakışta ilgilenmen gereken başlıklar.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Bugün
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3.5">
            <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${item.iconClass}`}>
              <item.icon size={16} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13px] font-bold text-slate-900">{item.title}</div>
                <div className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.badgeClass}`}>
                  {item.badge}
                </div>
              </div>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickLinks({ items }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-black text-slate-950">Hızlı Aksiyonlar</h3>
          <p className="mt-1 text-[12px] text-slate-500">En sık kullanılan yönetim alanlarına geç.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="group rounded-2xl border border-slate-100 p-3.5 transition-colors hover:border-slate-200 hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.iconClass}`}>
                <item.icon size={16} className="text-white" />
              </div>
              <ArrowRight size={16} className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </div>
            <div className="mt-3 text-[13px] font-bold text-slate-900">{item.title}</div>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">{item.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ActivitySection({ title, subtitle, linkTo, linkLabel, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-[15px] font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-[12px] text-slate-500">{subtitle}</p>
        </div>
        <Link to={linkTo} className="text-[12px] font-bold text-violet-600 transition-colors hover:text-violet-700">
          {linkLabel}
        </Link>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function LeaderboardCard({ title, subtitle, badge, rows, columns, emptyText }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-[15px] font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-[12px] text-slate-500">{subtitle}</p>
        </div>
        {badge ? (
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {badge}
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        {!rows?.length ? (
          <EmptyRow text={emptyText} />
        ) : (
          <div className="space-y-2.5">
            {rows.map((row, index) => (
              <div key={`${title}-${index}`} className="rounded-2xl border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-black text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-slate-900">{row.title}</div>
                      <div className="mt-1 text-[11px] text-slate-500">{row.subtitle}</div>
                    </div>
                  </div>
                  {row.trailing ? (
                    <div className="text-right text-[11px] font-semibold text-slate-400">
                      {row.trailing}
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {columns.map((column) => (
                    <div key={column.key} className="rounded-xl bg-slate-50 px-2.5 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        {column.label}
                      </div>
                      <div className="mt-1 text-[12px] font-bold text-slate-900">
                        {column.render(row.raw)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
  const commissionSeries = useMemo(
    () => normalizeSeries(stats?.chart_orders, 'commission'),
    [stats?.chart_orders],
  );
  const userSeries = useMemo(
    () => normalizeSeries(stats?.chart_users, 'count'),
    [stats?.chart_users],
  );

  const derived = useMemo(() => {
    const weeklyOrders = orderCountSeries.reduce((sum, item) => sum + item.value, 0);
    const weeklyRevenue = revenueSeries.reduce((sum, item) => sum + item.value, 0);
    const weeklyCommission = commissionSeries.reduce((sum, item) => sum + item.value, 0);
    const weeklyUsers = userSeries.reduce((sum, item) => sum + item.value, 0);
    const avgTicket = weeklyOrders ? weeklyRevenue / weeklyOrders : 0;
    const activeListingRate = percentOf(stats?.active_listings, stats?.total_listings);
    const soldListingRate = percentOf(stats?.sold_listings, stats?.total_listings);
    const bannedRate = percentOf(stats?.banned_users, stats?.total_users);
    const todayShare = percentOf(stats?.orders_today, weeklyOrders);
    const commissionRate = percentOf(stats?.commission_total, stats?.revenue_total);
    const weeklyCommissionRate = percentOf(stats?.commission_week, stats?.revenue_week);
    const recentPendingOrders = (stats?.recent_orders || []).filter((order) => order.status === 'pending').length;
    const recentRefundedOrders = (stats?.recent_orders || []).filter((order) => order.status === 'refunded').length;
    const recentRemovedListings = (stats?.recent_listings || []).filter((listing) => listing.status === 'removed').length;
    const recentBannedUsers = (stats?.recent_users || []).filter((user) => Number(user.is_banned) === 1).length;

    return {
      weeklyOrders,
      weeklyRevenue,
      weeklyCommission,
      weeklyUsers,
      avgTicket,
      activeListingRate,
      soldListingRate,
      bannedRate,
      todayShare,
      commissionRate,
      weeklyCommissionRate,
      recentPendingOrders,
      recentRefundedOrders,
      recentRemovedListings,
      recentBannedUsers,
    };
  }, [commissionSeries, orderCountSeries, revenueSeries, stats, userSeries]);

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
    {
      title: 'Komisyon verimi',
      text: `Toplam komisyon geliri ${formatMoney(stats?.commission_total)} seviyesinde. Genel komisyon verimi ${formatPercent(derived.commissionRate)} olarak ilerliyor.`,
      icon: TrendingUp,
      iconClass: 'bg-amber-500',
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

  const topCategoryRows = useMemo(
    () => (stats?.top_categories || []).map((item) => ({
      title: item.category_name || 'Kategorisiz',
      subtitle: `${formatNumber(item.order_count)} siparis`,
      trailing: `${formatMoney(item.revenue)} ciro`,
      raw: item,
    })),
    [stats?.top_categories],
  );

  const topSellerRows = useMemo(
    () => (stats?.top_sellers || []).map((item) => ({
      title: item.username || 'Bilinmeyen satici',
      subtitle: `${formatNumber(item.order_count)} satis`,
      trailing: `${formatMoney(item.paid_earnings)} net`,
      raw: item,
    })),
    [stats?.top_sellers],
  );

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
      <div className="space-y-3">
        <section className="relative overflow-hidden rounded-[26px] bg-slate-950 px-5 py-5 text-white shadow-2xl shadow-slate-900/10 sm:px-6">
          <div className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

          <div className="relative grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">
                <BarChart3 size={14} />
                Yönetim Merkezi
              </div>

              <h2 className="mt-4 max-w-2xl text-2xl font-black tracking-tight sm:text-3xl">
                Platformın nabzını tek ekrandan takip et.
              </h2>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-300 sm:text-sm">
                Bugün {formatNumber(stats?.orders_today)} sipariş, {formatMoney(stats?.revenue_today)} ciro ve {formatNumber(stats?.new_users_today)} yeni kullanıcı üretildi. Aşağıda performans trendi ve kritik operasyon sinyalleri hazır.
              </p>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Haftalık Ciro</div>
                  <div className="mt-2 text-2xl font-black text-white">{formatCompactMoney(stats?.revenue_week)}</div>
                  <div className="mt-1 text-sm text-slate-300">{formatMoney(stats?.revenue_week)} toplam hacim</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Haftalık Sipariş</div>
                  <div className="mt-2 text-2xl font-black text-white">{formatNumber(derived.weeklyOrders)}</div>
                  <div className="mt-1 text-sm text-slate-300">Ortalama sepet {formatMoney(derived.avgTicket)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Yeni Kullanıcı</div>
                  <div className="mt-2 text-2xl font-black text-white">{formatNumber(stats?.new_users_week)}</div>
                  <div className="mt-1 text-sm text-slate-300">7 günlük toplam kayıt</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Haftalık Komisyon</div>
                  <div className="mt-2 text-2xl font-black text-white">{formatCompactMoney(stats?.commission_week)}</div>
                  <div className="mt-1 text-sm text-slate-300">{formatPercent(derived.weeklyCommissionRate)} komisyon verimi</div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white">Durum Özeti</h3>
                  <p className="mt-1 text-[12px] text-slate-300">Anlık karar vermeyi kolaylaştıran kısa görünüm.</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                  <Sparkles size={16} />
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Platform Sağlığı</div>
                  <div className="mt-2 text-2xl font-black text-white">{formatPercent(derived.activeListingRate)}</div>
                  <p className="mt-1 text-sm text-slate-300">İlan havuzunun aktif kalan bölümü.</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Yorumlar</div>
                    <div className="mt-2 text-xl font-black text-white">{formatNumber(stats?.total_reviews)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Mesajlar</div>
                    <div className="mt-2 text-xl font-black text-white">{formatNumber(stats?.total_messages)}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3">
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

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
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
          <MetricCard
            title="Toplam Komisyon"
            value={formatMoney(stats?.commission_total)}
            detail={`${formatMoney(stats?.commission_today)} bugun kasaya yansiyan komisyon.`}
            icon={TrendingUp}
            accentClass="bg-amber-500"
            to="/admin/finance"
          />
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <TrendCard
                title="Sipariş Akışı"
                subtitle="Gün bazında sipariş yoğunluğu"
                series={orderCountSeries}
                formatter={(value) => formatNumber(value)}
                tone={{ stroke: '#7C3AED', fill: '#A78BFA' }}
              />
              <TrendCard
                title="Kullanıcı Kazanımı"
                subtitle="Son 7 günde yeni kayıtlar"
                series={userSeries}
                formatter={(value) => formatNumber(value)}
                tone={{ stroke: '#0F172A', fill: '#94A3B8' }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
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

          <div className="space-y-3">
            <InsightCard items={insightItems} />
            <FocusList items={focusItems} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          <QuickLinks items={quickLinks} />

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-black text-slate-950">Gelir Özeti</h3>
                <p className="mt-1 text-[12px] text-slate-500">Ciro ve komisyon performansini birlikte izle.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Son 7 Gün
              </div>
            </div>

            <div className="mt-4 rounded-[24px] bg-slate-950 p-4 text-white">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">İşlem Hacmi</div>
              <div className="mt-2 text-3xl font-black">{formatMoney(derived.weeklyRevenue)}</div>
              <p className="mt-1 text-sm text-slate-300">{formatNumber(derived.weeklyOrders)} siparişten oluşan 7 günlük hacim.</p>

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Komisyon</div>
                  <div className="mt-2 text-lg font-black text-white">{formatMoney(derived.weeklyCommission)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Komisyon Orani</div>
                  <div className="mt-2 text-lg font-black text-white">{formatPercent(derived.weeklyCommissionRate)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Bekleyen Odeme</div>
                  <div className="mt-2 text-lg font-black text-white">{formatMoney(stats?.pending_payout)}</div>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
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

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <LeaderboardCard
            title="Kategori Bazli Kazanc"
            subtitle="Yalnizca listing siparislerinden gelen kategori performansi"
            badge="Top 5"
            rows={topCategoryRows}
            emptyText="Kategori bazli satis verisi yok."
            columns={[
              { key: 'revenue', label: 'Ciro', render: (row) => formatMoney(row.revenue) },
              { key: 'commission', label: 'Komisyon', render: (row) => formatMoney(row.commission) },
              { key: 'avg_ticket', label: 'Ort. Sepet', render: (row) => formatMoney(row.avg_ticket) },
            ]}
          />

          <LeaderboardCard
            title="Uye Bazli Kazanc"
            subtitle="En fazla net kazanc ureten saticilar"
            badge="Top 5"
            rows={topSellerRows}
            emptyText="Satici bazli satis verisi yok."
            columns={[
              { key: 'revenue', label: 'Ciro', render: (row) => formatMoney(row.revenue) },
              { key: 'pending_earnings', label: 'Bekleyen', render: (row) => formatMoney(row.pending_earnings) },
              { key: 'commission', label: 'Komisyon', render: (row) => formatMoney(row.commission) },
            ]}
          />
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
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
                  <div key={user.id} className="flex items-center gap-3 py-2.5">
                    <UserAvatar
                      value={user.avatar}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base"
                      iconSize={16}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-slate-900">{user.username}</div>
                      <div className="truncate text-[12px] text-slate-500">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${Number(user.is_banned) === 1 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {Number(user.is_banned) === 1 ? 'Banlı' : 'Aktif'}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">{formatDateTime(user.created_at)}</div>
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
                  <div key={order.id} className="py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold text-slate-900">{order.item_title || 'Ürün bilgisi yok'}</div>
                        <div className="mt-1 text-[12px] text-slate-500">{order.buyer || 'Alıcı yok'} • {order.seller || 'Satıcı yok'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-600">{formatMoney(order.amount)}</div>
                        <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${ORDER_STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-700'}`}>
                          {order.status === 'completed' ? 'Tamamlandı' : order.status === 'pending' ? 'Bekliyor' : order.status === 'refunded' ? 'İade' : order.status}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-400">{formatDateTime(order.created_at)}</div>
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
                  <div key={listing.id} className="py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold text-slate-900">{listing.title}</div>
                        <div className="mt-1 text-[12px] text-slate-500">{listing.seller || 'Satıcı bilgisi yok'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-600">{formatMoney(listing.price)}</div>
                        <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${LISTING_STATUS_STYLES[listing.status] || 'bg-slate-100 text-slate-700'}`}>
                          {listing.status === 'active' ? 'Aktif' : listing.status === 'sold' ? 'Satıldı' : listing.status === 'pending' ? 'Bekliyor' : listing.status === 'removed' ? 'Kaldırıldı' : listing.status}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-400">{formatDateTime(listing.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </ActivitySection>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
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


