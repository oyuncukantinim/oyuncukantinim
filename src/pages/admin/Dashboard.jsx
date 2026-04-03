import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShoppingBag,
  Package,
  TrendingUp,
  DollarSign,
  Star,
  ArrowUpRight,
  Activity,
  UserCheck,
  ShieldAlert,
  Siren,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminDashboardPlus, adminStats } from '../../lib/adminApi';

function StatCard({ label, value, sub, icon: Icon, color, to }) {
  const content = (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {to && <ArrowUpRight size={16} className="text-gray-400" />}
      </div>
      <div className="text-2xl font-extrabold text-gray-900">{value}</div>
      <div className="text-sm font-semibold text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function MiniTable({ title, rows, cols }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-extrabold text-gray-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              {cols.map((col) => (
                <th key={col.key} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length} className="px-4 py-6 text-center text-gray-400 text-xs">Veri yok</td></tr>
            ) : rows.map((row, index) => (
              <tr key={index} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                {cols.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [plus, setPlus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([adminStats(), adminDashboardPlus()])
      .then(([statsRes, plusRes]) => {
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (plusRes.status === 'fulfilled') setPlus(plusRes.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('tr-TR');
  const fmtMoney = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Toplam Kullanıcı" value={fmt(stats?.total_users)} sub={`+${fmt(stats?.new_users_today)} bugün`} icon={Users} color="bg-violet-500" to="/admin/users" />
          <StatCard label="Aktif İlan" value={fmt(stats?.active_listings)} sub={`${fmt(stats?.sold_listings)} satıldı`} icon={ShoppingBag} color="bg-cyan-500" to="/admin/listings" />
          <StatCard label="Toplam Sipariş" value={fmt(stats?.total_orders)} sub={`${fmt(stats?.orders_today)} bugün`} icon={Package} color="bg-emerald-500" to="/admin/orders" />
          <StatCard label="Toplam Ciro" value={fmtMoney(stats?.revenue_total)} sub={`${fmtMoney(stats?.revenue_today)} bugün`} icon={DollarSign} color="bg-orange-500" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Bu Hafta Kayıt" value={fmt(stats?.new_users_week)} icon={UserCheck} color="bg-pink-500" />
          <StatCard label="Bu Hafta Ciro" value={fmtMoney(stats?.revenue_week)} icon={TrendingUp} color="bg-indigo-500" />
          <StatCard label="Toplam Yorum" value={fmt(stats?.total_reviews)} icon={Star} color="bg-yellow-500" to="/admin/reviews" />
          <StatCard label="Banlı Kullanıcı" value={fmt(stats?.banned_users)} icon={Activity} color="bg-red-500" to="/admin/users" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Açık Anlaşmazlık" value={fmt(plus?.urgent?.open_disputes)} icon={ShieldAlert} color="bg-red-500" to="/admin/orders" />
          <StatCard label="Moderasyon Kuyruğu" value={fmt(plus?.urgent?.pending_moderation)} icon={Siren} color="bg-orange-500" to="/admin/listings" />
          <StatCard label="Kısıtlı Kullanıcı" value={fmt(plus?.urgent?.restricted_users)} icon={LockKeyhole} color="bg-slate-500" to="/admin/users" />
          <StatCard label="Aktif Flag" value={fmt(plus?.urgent?.active_feature_flags)} icon={Sparkles} color="bg-cyan-500" to="/admin/access-control" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MiniTable
            title="Operasyon Hunisi"
            rows={[
              { label: 'Aktif ilan', value: plus?.funnel?.active_listings ?? 0 },
              { label: 'Bekleyen sipariş', value: plus?.funnel?.pending_orders ?? 0 },
              { label: 'Tamamlanan sipariş', value: plus?.funnel?.completed_orders ?? 0 },
              { label: 'İade sipariş', value: plus?.funnel?.refunded_orders ?? 0 },
            ]}
            cols={[
              { key: 'label', label: 'Metrik' },
              { key: 'value', label: 'Değer', render: (row) => <span className="font-bold text-gray-900">{fmt(row.value)}</span> },
            ]}
          />

          <MiniTable
            title="Özellik Bayrakları"
            rows={Object.entries(plus?.feature_flags || {}).map(([key, value]) => ({ key, value }))}
            cols={[
              { key: 'key', label: 'Flag', render: (row) => <span className="font-bold text-gray-800">{row.key}</span> },
              {
                key: 'value',
                label: 'Durum',
                render: (row) => (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.value ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {row.value ? 'Aktif' : 'Pasif'}
                  </span>
                ),
              },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MiniTable
            title="Son Kayıt Olan Kullanıcılar"
            rows={stats?.recent_users || []}
            cols={[
              { key: 'avatar', label: '', render: (row) => <span className="text-lg">{row.avatar}</span> },
              { key: 'username', label: 'Kullanıcı', render: (row) => <Link to="/admin/users" className="font-bold text-gray-800 hover:text-violet-600">{row.username}</Link> },
              { key: 'email', label: 'E-posta', render: (row) => <span className="text-gray-500 text-xs">{row.email}</span> },
              {
                key: 'is_banned',
                label: 'Durum',
                render: (row) => Number(row.is_banned) === 1
                  ? <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Banlı</span>
                  : <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Aktif</span>,
              },
            ]}
          />

          <MiniTable
            title="Son Siparişler"
            rows={stats?.recent_orders || []}
            cols={[
              { key: 'item_title', label: 'Ürün', render: (row) => <span className="font-semibold text-gray-800 truncate block max-w-[140px]">{row.item_title || '-'}</span> },
              { key: 'buyer', label: 'Alıcı', render: (row) => <span className="text-gray-500 text-xs">{row.buyer}</span> },
              { key: 'amount', label: 'Tutar', render: (row) => <span className="font-bold text-emerald-600">{fmtMoney(row.amount)}</span> },
              {
                key: 'status',
                label: 'Durum',
                render: (row) => {
                  const map = { completed: ['Tamamlandı', 'emerald'], pending: ['Bekliyor', 'yellow'], refunded: ['İade', 'red'] };
                  const [label, color] = map[row.status] || [row.status, 'gray'];
                  return <span className={`text-xs font-bold text-${color}-600 bg-${color}-50 px-2 py-0.5 rounded-full`}>{label}</span>;
                },
              },
            ]}
          />
        </div>

        <MiniTable
          title="Son Eklenen İlanlar"
          rows={stats?.recent_listings || []}
          cols={[
            { key: 'title', label: 'Başlık', render: (row) => <span className="font-semibold text-gray-800 truncate block max-w-[200px]">{row.title}</span> },
            { key: 'seller', label: 'Satıcı', render: (row) => <span className="text-gray-500 text-xs">{row.seller}</span> },
            { key: 'price', label: 'Fiyat', render: (row) => <span className="font-bold text-emerald-600">{fmtMoney(row.price)}</span> },
            {
              key: 'status',
              label: 'Durum',
              render: (row) => {
                const map = { active: ['Aktif', 'emerald'], sold: ['Satıldı', 'gray'], pending: ['Bekliyor', 'yellow'], removed: ['Kaldırıldı', 'red'] };
                const [label, color] = map[row.status] || [row.status, 'gray'];
                return <span className={`text-xs font-bold text-${color}-600 bg-${color}-50 px-2 py-0.5 rounded-full`}>{label}</span>;
              },
            },
          ]}
        />
      </div>
    </AdminLayout>
  );
}

