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
  User,
  Users,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminStats } from '../../lib/adminApi';

const ORDER_STATUS_STYLES = {
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  refunded: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60',
};

const LISTING_STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  sold: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/60',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  removed: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60',
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
      <div className="space-y-4 animate-pulse">
        <div className="h-56 rounded-3xl bg-slate-200/70" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-32 rounded-3xl bg-slate-200/70" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.6fr_1fr]">
          <div className="h-96 rounded-3xl bg-slate-200/70" />
          <div className="h-96 rounded-3xl bg-slate-200/70" />
        </div>
      </div>
    </AdminLayout>
  );
}

/* ----------  CARD PRIMITIVES  ---------- */

function PanelCard({ children, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, badge, badgeTone = 'slate', action }) {
  const toneMap = {
    slate: 'bg-slate-100 text-slate-600',
    violet: 'bg-violet-100 text-violet-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-[15px] font-black tracking-tight text-slate-950">{title}</h3>
        {subtitle ? <p className="mt-1 text-[12px] leading-5 text-slate-500">{subtitle}</p> : null}
      </div>
      {badge ? (
        <div className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${toneMap[badgeTone] || toneMap.slate}`}>
          {badge}
        </div>
      ) : null}
      {action}
    </div>
  );
}

/* ----------  METRIC CARDS  ---------- */

function MetricCard({ title, value, detail, icon: Icon, gradient, to }) {
  const content = (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2)]">
      {/* glow accent */}
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-slate-900/10 ring-1 ring-white/60`}>
          <Icon size={18} className="text-white" strokeWidth={2.4} />
        </div>
        {to ? (
          <div className="flex items-center gap-1 rounded-full bg-slate-100/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 transition-colors group-hover:bg-slate-900 group-hover:text-white">
            Detay
            <ArrowUpRight size={12} />
          </div>
        ) : null}
      </div>

      <div className="relative mt-4 text-[26px] font-black tracking-tight text-slate-950">{value}</div>
      <div className="relative mt-0.5 text-[12px] font-bold text-slate-600">{title}</div>
      <div className="relative mt-2 text-[11px] leading-5 text-slate-400">{detail}</div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

function ProgressCard({ title, value, helper, progress, gradient }) {
  return (
    <PanelCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-black text-slate-900">{title}</div>
          <div className="mt-1 text-[11px] leading-5 text-slate-500">{helper}</div>
        </div>
        <div className="text-lg font-black tracking-tight text-slate-950">{value}</div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} shadow-[0_0_12px_rgba(139,92,246,0.35)]`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-400">
        <span>{formatPercent(progress)} oran</span>
        <span className="text-slate-300">/ 100%</span>
      </div>
    </PanelCard>
  );
}

/* ----------  CHARTS  ---------- */

function buildChartGeometry(series = []) {
  const width = 320;
  const height = 200;
  const paddingX = 18;
  const paddingTop = 20;
  const paddingBottom = 48;
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
    <PanelCard className="p-4">
      <SectionHeader title={title} subtitle={subtitle} badge="Son 7 Gün" badgeTone="violet" />

      <div className="mt-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/90 via-white to-slate-50/60 p-3">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Güncel</div>
            <div className="mt-1 text-2xl font-black tracking-tight text-slate-950">{formatter(latestPoint?.value || 0)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tepe</div>
            <div className="mt-1 text-sm font-bold text-slate-700">
              {peakPoint ? `${formatter(peakPoint.value)} · ${peakPoint.label}` : '-'}
            </div>
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full overflow-visible">
          <defs>
            <linearGradient id={`${gradientId}-fill`} x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor={tone.fill} stopOpacity="0.45" />
              <stop offset="100%" stopColor={tone.fill} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${gradientId}-stroke`} x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor={tone.stroke} />
              <stop offset="100%" stopColor={tone.strokeEnd || tone.stroke} />
            </linearGradient>
          </defs>

          {[0, 1, 2].map((index) => {
            const y = 24 + (index * 44);
            return (
              <line
                key={index}
                x1="16"
                y1={y}
                x2={width - 16}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="3 6"
                strokeWidth="1"
              />
            );
          })}

          {areaPath ? <path d={areaPath} fill={`url(#${gradientId}-fill)`} /> : null}
          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke={`url(#${gradientId}-stroke)`}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {points.map((point) => (
            <g key={point.day}>
              <circle cx={point.x} cy={point.y} r="6.5" fill="white" stroke={tone.stroke} strokeWidth="2" />
              <circle cx={point.x} cy={point.y} r="2.5" fill={tone.stroke} />
              <text
                x={point.x}
                y={height - 20}
                textAnchor="middle"
                className="fill-slate-700 text-[11px] font-black"
              >
                {formatter(point.value)}
              </text>
              <text
                x={point.x}
                y={height - 6}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-bold uppercase tracking-wider"
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </PanelCard>
  );
}

/* ----------  SIDE PANELS  ---------- */

function InsightCard({ items }) {
  return (
    <PanelCard className="p-4">
      <SectionHeader
        title="Yönetici İçgörüleri"
        subtitle="Karar vermeyi hızlandıran kısa özetler."
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
            <Sparkles size={15} />
          </div>
        }
      />

      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <div key={item.title} className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/60 p-3.5 transition-all hover:border-slate-200 hover:shadow-sm">
            <div className="flex items-start gap-3">
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-md ring-1 ring-white/40`}>
                <item.icon size={15} className="text-white" strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-black text-slate-900">{item.title}</div>
                <p className="mt-1 text-[12px] leading-5 text-slate-500">{item.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function FocusList({ items }) {
  return (
    <PanelCard className="p-4">
      <SectionHeader
        title="Öncelikli Takip"
        subtitle="İlk bakışta ilgilenmen gereken başlıklar."
        badge="Bugün"
        badgeTone="amber"
      />

      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-50/60">
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-md ring-1 ring-white/40`}>
              <item.icon size={15} className="text-white" strokeWidth={2.4} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13px] font-black text-slate-900">{item.title}</div>
                <div className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${item.badgeClass}`}>
                  {item.badge}
                </div>
              </div>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function QuickLinks({ items }) {
  return (
    <PanelCard className="p-4">
      <SectionHeader title="Hızlı Aksiyonlar" subtitle="En sık kullanılan yönetim alanlarına geç." />

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/40 p-3.5 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
          >
            <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${item.gradient} opacity-0 blur-2xl transition-opacity group-hover:opacity-30`} />
            <div className="relative flex items-start justify-between gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-md ring-1 ring-white/40`}>
                <item.icon size={15} className="text-white" strokeWidth={2.4} />
              </div>
              <ArrowRight size={16} className="text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-violet-600" />
            </div>
            <div className="relative mt-3 text-[13px] font-black text-slate-900">{item.title}</div>
            <p className="relative mt-1 text-[12px] leading-5 text-slate-500">{item.text}</p>
          </Link>
        ))}
      </div>
    </PanelCard>
  );
}

function ActivitySection({ title, subtitle, linkTo, linkLabel, children }) {
  return (
    <PanelCard className="p-4">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-[15px] font-black tracking-tight text-slate-950">{title}</h3>
          <p className="mt-1 text-[12px] text-slate-500">{subtitle}</p>
        </div>
        <Link
          to={linkTo}
          className="group flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-violet-700 transition-colors hover:bg-violet-600 hover:text-white"
        >
          {linkLabel}
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mt-2">{children}</div>
    </PanelCard>
  );
}

function LeaderboardCard({ title, subtitle, badge, rows, columns, emptyText }) {
  return (
    <PanelCard className="p-4">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-[15px] font-black tracking-tight text-slate-950">{title}</h3>
          <p className="mt-1 text-[12px] text-slate-500">{subtitle}</p>
        </div>
        {badge ? (
          <div className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-md shadow-violet-500/30">
            {badge}
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        {!rows?.length ? (
          <EmptyRow text={emptyText} />
        ) : (
          <div className="space-y-2.5">
            {rows.map((row, index) => {
              const rankStyle =
                index === 0
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/40'
                  : index === 1
                  ? 'bg-gradient-to-br from-slate-300 to-slate-500 shadow-md shadow-slate-400/40'
                  : index === 2
                  ? 'bg-gradient-to-br from-orange-700 to-amber-800 shadow-md shadow-orange-700/40'
                  : 'bg-slate-900';
              return (
                <div key={`${title}-${index}`} className="rounded-2xl border border-slate-100 p-3 transition-colors hover:bg-slate-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-black text-white ring-1 ring-white/20 ${rankStyle}`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-black text-slate-900">{row.title}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{row.subtitle}</div>
                      </div>
                    </div>
                    {row.trailing ? (
                      <div className="text-right text-[11px] font-bold text-slate-500">
                        {row.trailing}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {columns.map((column) => (
                      <div key={column.key} className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
                        <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                          {column.label}
                        </div>
                        <div className="mt-1 text-[12px] font-black text-slate-900">
                          {column.render(row.raw)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PanelCard>
  );
}

function EmptyRow({ text }) {
  return (
    <div className="px-2 py-8 text-center text-sm text-slate-400">{text}</div>
  );
}

/* ----------  MAIN  ---------- */

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
      gradient: 'from-slate-800 to-slate-950',
    },
    {
      title: 'İlan stoğu dengesi',
      text: `${formatPercent(derived.activeListingRate)} aktif, ${formatPercent(derived.soldListingRate)} satılmış ilan oranı ile pazar yeri ritmi korunuyor.`,
      icon: ShoppingBag,
      gradient: 'from-cyan-400 to-sky-600',
    },
    {
      title: 'Ortalama sipariş değeri',
      text: `Son 7 günde işlem başına yaklaşık ${formatMoney(derived.avgTicket)} değer oluştu. Bu metrik kampanya ve komisyon kararlarında ana referans olabilir.`,
      icon: BadgeDollarSign,
      gradient: 'from-emerald-400 to-teal-600',
    },
    {
      title: 'Komisyon verimi',
      text: `Toplam komisyon geliri ${formatMoney(stats?.commission_total)} seviyesinde. Genel komisyon verimi ${formatPercent(derived.commissionRate)} olarak ilerliyor.`,
      icon: TrendingUp,
      gradient: 'from-amber-400 to-orange-600',
    },
  ], [derived, stats]);

  const focusItems = useMemo(() => [
    {
      title: 'Bekleyen siparişler',
      text: `Son sipariş akışında ${formatNumber(derived.recentPendingOrders)} işlem beklemede görünüyor. Teslimat ve satıcı dönüşü hızını kontrol etmek faydalı olur.`,
      badge: `${formatNumber(derived.recentPendingOrders)} adet`,
      badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
      icon: Clock3,
      gradient: 'from-amber-400 to-orange-500',
    },
    {
      title: 'İade / risk sinyali',
      text: `Yakın dönemde ${formatNumber(derived.recentRefundedOrders)} iade ve ${formatNumber(derived.recentRemovedListings)} kaldırılmış ilan dikkat çekiyor.`,
      badge: derived.recentRefundedOrders > 0 || derived.recentRemovedListings > 0 ? 'İncelenmeli' : 'Stabil',
      badgeClass: derived.recentRefundedOrders > 0 || derived.recentRemovedListings > 0
        ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60'
        : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
      icon: AlertTriangle,
      gradient: 'from-rose-500 to-red-600',
    },
    {
      title: 'Topluluk güvenliği',
      text: `Toplam banlı kullanıcı oranı ${formatPercent(derived.bannedRate)}. Son kullanıcı akışında ${formatNumber(derived.recentBannedUsers)} problemli hesap görünüyor.`,
      badge: formatPercent(derived.bannedRate),
      badgeClass: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/60',
      icon: ShieldAlert,
      gradient: 'from-violet-500 to-fuchsia-600',
    },
  ], [derived]);

  const quickLinks = useMemo(() => [
    {
      title: 'Siparişleri yönet',
      text: 'Bekleyen ve problemli siparişleri hızla filtrele.',
      to: '/admin/orders',
      icon: Package,
      gradient: 'from-emerald-400 to-teal-600',
    },
    {
      title: 'Finans ekranı',
      text: 'Hacim, komisyon ve ödeme bekleyen işlemleri incele.',
      to: '/admin/finance',
      icon: TrendingUp,
      gradient: 'from-cyan-400 to-sky-600',
    },
    {
      title: 'Kullanıcı moderasyonu',
      text: 'Ban, yetki ve profil hareketlerini kontrol et.',
      to: '/admin/users',
      icon: Users,
      gradient: 'from-violet-500 to-fuchsia-600',
    },
    {
      title: 'Mesajlar ve yorumlar',
      text: 'Topluluk hareketini ve destek ihtiyacını gözden geçir.',
      to: '/admin/messages',
      icon: MessageSquare,
      gradient: 'from-amber-400 to-orange-600',
    },
  ], []);

  const topCategoryRows = useMemo(
    () => (stats?.top_categories || []).map((item) => ({
      title: item.category_name || 'Kategorisiz',
      subtitle: `${formatNumber(item.order_count)} sipariş`,
      trailing: `${formatMoney(item.revenue)} ciro`,
      raw: item,
    })),
    [stats?.top_categories],
  );

  const topSellerRows = useMemo(
    () => (stats?.top_sellers || []).map((item) => ({
      title: item.username || 'Bilinmeyen satıcı',
      subtitle: `${formatNumber(item.order_count)} satış`,
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
          <div className="max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30">
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
      <div className="space-y-4">
        {/* ==========  HERO  ========== */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0B1120] via-[#0F172A] to-[#1E1B4B] px-5 py-6 text-white shadow-2xl shadow-slate-900/20 sm:px-7">
          {/* Ambient blobs — AdminLayout ile uyumlu */}
          <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
          {/* Grid pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200 backdrop-blur">
                <BarChart3 size={13} />
                Yönetim Merkezi
                <span className="ml-1 flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>

              <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-[32px]">
                Platformun nabzını <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">tek ekrandan</span> takip et.
              </h2>
              <p className="mt-3 max-w-2xl text-[13px] leading-6 text-slate-300 sm:text-sm">
                Bugün <span className="font-bold text-white">{formatNumber(stats?.orders_today)}</span> sipariş,{' '}
                <span className="font-bold text-white">{formatMoney(stats?.revenue_today)}</span> ciro ve{' '}
                <span className="font-bold text-white">{formatNumber(stats?.new_users_today)}</span> yeni kullanıcı üretildi.
                Aşağıda performans trendi ve kritik operasyon sinyalleri hazır.
              </p>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <HeroStat
                  label="Haftalık Ciro"
                  value={formatCompactMoney(stats?.revenue_week)}
                  sub={`${formatMoney(stats?.revenue_week)} toplam`}
                  accent="from-emerald-400 to-cyan-400"
                />
                <HeroStat
                  label="Haftalık Sipariş"
                  value={formatNumber(derived.weeklyOrders)}
                  sub={`Sepet ort. ${formatMoney(derived.avgTicket)}`}
                  accent="from-cyan-400 to-violet-400"
                />
                <HeroStat
                  label="Yeni Kullanıcı"
                  value={formatNumber(stats?.new_users_week)}
                  sub="7 günlük toplam"
                  accent="from-violet-400 to-fuchsia-400"
                />
                <HeroStat
                  label="Haftalık Komisyon"
                  value={formatCompactMoney(stats?.commission_week)}
                  sub={`${formatPercent(derived.weeklyCommissionRate)} verim`}
                  accent="from-amber-400 to-orange-400"
                />
              </div>
            </div>

            {/* Durum özeti kart */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-white">Durum Özeti</h3>
                  <p className="mt-1 text-[12px] text-slate-300">Anlık karar için kısa görünüm.</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg ring-1 ring-white/20">
                  <Sparkles size={15} />
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-3.5">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Platform Sağlığı</div>
                  <div className="mt-2 text-2xl font-black tracking-tight text-white">{formatPercent(derived.activeListingRate)}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      style={{ width: `${Math.min(100, derived.activeListingRate)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-300">İlan havuzunun aktif kalan bölümü.</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
                      <Star size={10} /> Yorumlar
                    </div>
                    <div className="mt-1.5 text-xl font-black text-white">{formatNumber(stats?.total_reviews)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
                      <MessageSquare size={10} /> Mesajlar
                    </div>
                    <div className="mt-1.5 text-xl font-black text-white">{formatNumber(stats?.total_messages)}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 to-orange-500/5 p-3">
                  <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-amber-200">
                    <Clock3 size={14} />
                    Operasyon Notu
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-amber-50">
                    Son akışta <span className="font-bold">{formatNumber(derived.recentPendingOrders)}</span> bekleyen sipariş ve{' '}
                    <span className="font-bold">{formatNumber(derived.recentRefundedOrders)}</span> iade kaydı öne çıkıyor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========  METRIC CARDS  ========== */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <MetricCard
            title="Toplam Kullanıcı"
            value={formatNumber(stats?.total_users)}
            detail={`${formatNumber(stats?.new_users_today)} kullanıcı bugün katıldı.`}
            icon={Users}
            gradient="from-violet-500 to-fuchsia-600"
            to="/admin/users"
          />
          <MetricCard
            title="Aktif İlan"
            value={formatNumber(stats?.active_listings)}
            detail={`${formatNumber(stats?.sold_listings)} ilan satılmış durumda.`}
            icon={ShoppingBag}
            gradient="from-cyan-400 to-sky-600"
            to="/admin/listings"
          />
          <MetricCard
            title="Toplam Sipariş"
            value={formatNumber(stats?.total_orders)}
            detail={`${formatNumber(stats?.orders_today)} sipariş bugün işlendi.`}
            icon={Package}
            gradient="from-emerald-400 to-teal-600"
            to="/admin/orders"
          />
          <MetricCard
            title="Toplam Ciro"
            value={formatMoney(stats?.revenue_total)}
            detail={`${formatMoney(stats?.revenue_today)} bugünkü tamamlanan ciro.`}
            icon={BadgeDollarSign}
            gradient="from-orange-400 to-red-500"
          />
          <MetricCard
            title="Toplam Komisyon"
            value={formatMoney(stats?.commission_total)}
            detail={`${formatMoney(stats?.commission_today)} bugün kasaya yansıyan komisyon.`}
            icon={TrendingUp}
            gradient="from-amber-400 to-orange-500"
            to="/admin/finance"
          />
        </section>

        {/* ==========  TRENDS + SIDE  ========== */}
        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <TrendCard
                title="Sipariş Akışı"
                subtitle="Gün bazında sipariş yoğunluğu"
                series={orderCountSeries}
                formatter={(value) => formatNumber(value)}
                tone={{ stroke: '#7C3AED', strokeEnd: '#EC4899', fill: '#A78BFA' }}
              />
              <TrendCard
                title="Kullanıcı Kazanımı"
                subtitle="Son 7 günde yeni kayıtlar"
                series={userSeries}
                formatter={(value) => formatNumber(value)}
                tone={{ stroke: '#0891B2', strokeEnd: '#6366F1', fill: '#22D3EE' }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <ProgressCard
                title="Aktif İlan Oranı"
                value={formatNumber(stats?.active_listings)}
                helper="Toplam ilan havuzunun şu anda satışa açık kalan bölümü."
                progress={derived.activeListingRate}
                gradient="from-cyan-500 to-violet-500"
              />
              <ProgressCard
                title="Satılan İlan Oranı"
                value={formatNumber(stats?.sold_listings)}
                helper="Tamamlanmış satışların ilan havuzundaki payı."
                progress={derived.soldListingRate}
                gradient="from-emerald-500 to-cyan-500"
              />
              <ProgressCard
                title="Banlı Kullanıcı Oranı"
                value={formatNumber(stats?.banned_users)}
                helper="Toplam kullanıcılar içinde moderasyon gerektiren pay."
                progress={derived.bannedRate}
                gradient="from-rose-500 to-orange-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <InsightCard items={insightItems} />
            <FocusList items={focusItems} />
          </div>
        </section>

        {/* ==========  QUICK LINKS + REVENUE  ========== */}
        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          <QuickLinks items={quickLinks} />

          <PanelCard className="p-4">
            <SectionHeader title="Gelir Özeti" subtitle="Ciro ve komisyon performansını birlikte izle." badge="Son 7 Gün" badgeTone="violet" />

            <div className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1120] via-[#0F172A] to-[#1E1B4B] p-4 text-white">
              <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />

              <div className="relative">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">İşlem Hacmi</div>
                <div className="mt-2 text-3xl font-black tracking-tight">{formatMoney(derived.weeklyRevenue)}</div>
                <p className="mt-1 text-[13px] text-slate-300">{formatNumber(derived.weeklyOrders)} siparişten oluşan 7 günlük hacim.</p>

                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">Komisyon</div>
                    <div className="mt-2 text-lg font-black">{formatMoney(derived.weeklyCommission)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Komisyon Oranı</div>
                    <div className="mt-2 text-lg font-black">{formatPercent(derived.weeklyCommissionRate)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">Bekleyen Ödeme</div>
                    <div className="mt-2 text-lg font-black">{formatMoney(stats?.pending_payout)}</div>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  {revenueSeries.map((item) => {
                    const maxRevenue = Math.max(...revenueSeries.map((entry) => entry.value), 1);
                    const width = 6 + ((item.value / maxRevenue) * 94);
                    return (
                      <div key={item.day}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-bold text-slate-300">
                          <span className="uppercase tracking-wider">{item.label}</span>
                          <span className="text-white">{formatMoney(item.value)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </PanelCard>
        </section>

        {/* ==========  LEADERBOARDS  ========== */}
        <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <LeaderboardCard
            title="Kategori Bazlı Kazanç"
            subtitle="Yalnızca listing siparişlerinden gelen kategori performansı"
            badge="Top 5"
            rows={topCategoryRows}
            emptyText="Kategori bazlı satış verisi yok."
            columns={[
              { key: 'revenue', label: 'Ciro', render: (row) => formatMoney(row.revenue) },
              { key: 'commission', label: 'Komisyon', render: (row) => formatMoney(row.commission) },
              { key: 'avg_ticket', label: 'Ort. Sepet', render: (row) => formatMoney(row.avg_ticket) },
            ]}
          />

          <LeaderboardCard
            title="Üye Bazlı Kazanç"
            subtitle="En fazla net kazanç üreten satıcılar"
            badge="Top 5"
            rows={topSellerRows}
            emptyText="Satıcı bazlı satış verisi yok."
            columns={[
              { key: 'revenue', label: 'Ciro', render: (row) => formatMoney(row.revenue) },
              { key: 'pending_earnings', label: 'Bekleyen', render: (row) => formatMoney(row.pending_earnings) },
              { key: 'commission', label: 'Komisyon', render: (row) => formatMoney(row.commission) },
            ]}
          />
        </section>

        {/* ==========  ACTIVITY STREAMS  ========== */}
        <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <ActivitySection
            title="Yeni Kullanıcılar"
            subtitle="Son kayıt olan hesaplar ve durum bilgileri"
            linkTo="/admin/users"
            linkLabel="Git"
          >
            {(stats?.recent_users || []).length === 0 ? (
              <EmptyRow text="Yeni kullanıcı kaydı yok." />
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_users.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-base font-black text-white shadow-md ring-1 ring-white/40">
                      {user.avatar ? (
                        <span>{user.avatar}</span>
                      ) : (
                        <User size={16} strokeWidth={2.4} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-black text-slate-900">{user.username}</div>
                      <div className="truncate text-[11px] text-slate-500">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${Number(user.is_banned) === 1 ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60'}`}>
                        {Number(user.is_banned) === 1 ? 'Banlı' : 'Aktif'}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">{formatDateTime(user.created_at)}</div>
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
            linkLabel="Git"
          >
            {(stats?.recent_orders || []).length === 0 ? (
              <EmptyRow text="Yeni sipariş yok." />
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_orders.map((order) => (
                  <div key={order.id} className="py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-black text-slate-900">{order.item_title || 'Ürün bilgisi yok'}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{order.buyer || 'Alıcı yok'} • {order.seller || 'Satıcı yok'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-600">{formatMoney(order.amount)}</div>
                        <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${ORDER_STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/60'}`}>
                          {order.status === 'completed' ? 'Tamamlandı' : order.status === 'pending' ? 'Bekliyor' : order.status === 'refunded' ? 'İade' : order.status}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 text-[10px] text-slate-400">{formatDateTime(order.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </ActivitySection>

          <ActivitySection
            title="Yeni İlanlar"
            subtitle="Pazaryerine eklenen son içerikler"
            linkTo="/admin/listings"
            linkLabel="Git"
          >
            {(stats?.recent_listings || []).length === 0 ? (
              <EmptyRow text="Yeni ilan yok." />
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recent_listings.map((listing) => (
                  <div key={listing.id} className="py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-black text-slate-900">{listing.title}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{listing.seller || 'Satıcı bilgisi yok'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-600">{formatMoney(listing.price)}</div>
                        <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${LISTING_STATUS_STYLES[listing.status] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/60'}`}>
                          {listing.status === 'active' ? 'Aktif' : listing.status === 'sold' ? 'Satıldı' : listing.status === 'pending' ? 'Bekliyor' : listing.status === 'removed' ? 'Kaldırıldı' : listing.status}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1.5 text-[10px] text-slate-400">{formatDateTime(listing.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </ActivitySection>
        </section>

        {/* ==========  SECONDARY METRICS  ========== */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetricCard
            title="Haftalık Kullanıcı"
            value={formatNumber(derived.weeklyUsers)}
            detail="Son 7 gün içinde açılan toplam kullanıcı hesabı."
            icon={Users}
            gradient="from-slate-700 to-slate-950"
          />
          <MetricCard
            title="Toplam Yorum"
            value={formatNumber(stats?.total_reviews)}
            detail="Topluluk etkileşimi ve memnuniyet sinyali."
            icon={Star}
            gradient="from-amber-400 to-orange-500"
            to="/admin/reviews"
          />
          <MetricCard
            title="Toplam Mesaj"
            value={formatNumber(stats?.total_messages)}
            detail="Destek ve kullanıcı iletişim havuzunun genel büyüklüğü."
            icon={MessageSquare}
            gradient="from-violet-500 to-fuchsia-600"
            to="/admin/messages"
          />
        </section>
      </div>
    </AdminLayout>
  );
}

/* ----------  HERO STAT  ---------- */

function HeroStat({ label, value, sub, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/10">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />
      <div className="relative text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className={`relative mt-2 bg-gradient-to-r ${accent} bg-clip-text text-2xl font-black tracking-tight text-transparent`}>
        {value}
      </div>
      <div className="relative mt-0.5 text-[11px] text-slate-300">{sub}</div>
    </div>
  );
}
