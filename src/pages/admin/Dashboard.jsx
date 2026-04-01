import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ShoppingBag, Package, TrendingUp,
  DollarSign, Star, ArrowUpRight, Activity,
  UserCheck, ShoppingCart
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminStats } from '../../lib/adminApi';

function StatCard({ label, value, sub, icon: Icon, color, to }) {
  const content = (
    <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}>
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
              {cols.map(c => (
                <th key={c.key} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length} className="px-4 py-6 text-center text-gray-400 text-xs">Veri yok</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                {cols.map(c => (
                  <td key={c.key} className="px-4 py-3 text-gray-700">{c.render ? c.render(row) : row[c.key]}</td>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminStats()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('tr-TR');
  const fmtMoney = (n) => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺';

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Ana stat kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Toplam Kullanıcı" value={fmt(stats?.total_users)} sub={`+${fmt(stats?.new_users_today)} bugün`} icon={Users} color="bg-violet-500" to="/admin/users" />
          <StatCard label="Aktif İlan" value={fmt(stats?.active_listings)} sub={`${fmt(stats?.sold_listings)} satıldı`} icon={ShoppingBag} color="bg-cyan-500" to="/admin/listings" />
          <StatCard label="Toplam Sipariş" value={fmt(stats?.total_orders)} sub={`${fmt(stats?.orders_today)} bugün`} icon={Package} color="bg-emerald-500" to="/admin/orders" />
          <StatCard label="Toplam Ciro" value={fmtMoney(stats?.revenue_total)} sub={`${fmtMoney(stats?.revenue_today)} bugün`} icon={DollarSign} color="bg-orange-500" />
        </div>

        {/* İkincil kartlar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Bu Hafta Kayıt" value={fmt(stats?.new_users_week)} icon={UserCheck} color="bg-pink-500" />
          <StatCard label="Bu Hafta Ciro" value={fmtMoney(stats?.revenue_week)} icon={TrendingUp} color="bg-indigo-500" />
          <StatCard label="Toplam Yorum" value={fmt(stats?.total_reviews)} icon={Star} color="bg-yellow-500" to="/admin/reviews" />
          <StatCard label="Banlı Kullanıcı" value={fmt(stats?.banned_users)} icon={Activity} color="bg-red-500" to="/admin/users" />
        </div>

        {/* Son aktiviteler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MiniTable
            title="Son Kayıt Olan Kullanıcılar"
            rows={stats?.recent_users || []}
            cols={[
              { key: 'avatar', label: '', render: r => <span className="text-lg">{r.avatar}</span> },
              { key: 'username', label: 'Kullanıcı', render: r => (
                <Link to={`/admin/users`} className="font-bold text-gray-800 hover:text-violet-600">{r.username}</Link>
              )},
              { key: 'email', label: 'E-posta', render: r => <span className="text-gray-500 text-xs">{r.email}</span> },
              { key: 'is_banned', label: 'Durum', render: r => r.is_banned
                ? <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Banlı</span>
                : <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Aktif</span>
              },
            ]}
          />

          <MiniTable
            title="Son Siparişler"
            rows={stats?.recent_orders || []}
            cols={[
              { key: 'item_title', label: 'Ürün', render: r => <span className="font-semibold text-gray-800 truncate block max-w-[140px]">{r.item_title || '—'}</span> },
              { key: 'buyer', label: 'Alıcı', render: r => <span className="text-gray-500 text-xs">{r.buyer}</span> },
              { key: 'amount', label: 'Tutar', render: r => <span className="font-bold text-emerald-600">{fmtMoney(r.amount)}</span> },
              { key: 'status', label: 'Durum', render: r => {
                const map = { completed: ['Tamamlandı','emerald'], pending: ['Bekliyor','yellow'], refunded: ['İade','red'] };
                const [label, color] = map[r.status] || [r.status,'gray'];
                return <span className={`text-xs font-bold text-${color}-600 bg-${color}-50 px-2 py-0.5 rounded-full`}>{label}</span>;
              }},
            ]}
          />
        </div>

        <MiniTable
          title="Son Eklenen İlanlar"
          rows={stats?.recent_listings || []}
          cols={[
            { key: 'title', label: 'Başlık', render: r => <span className="font-semibold text-gray-800 truncate block max-w-[200px]">{r.title}</span> },
            { key: 'seller', label: 'Satıcı', render: r => <span className="text-gray-500 text-xs">{r.seller}</span> },
            { key: 'price', label: 'Fiyat', render: r => <span className="font-bold text-emerald-600">{fmtMoney(r.price)}</span> },
            { key: 'status', label: 'Durum', render: r => {
              const map = { active: ['Aktif','emerald'], sold: ['Satıldı','gray'], pending: ['Bekliyor','yellow'], removed: ['Kaldırıldı','red'] };
              const [label, color] = map[r.status] || [r.status,'gray'];
              return <span className={`text-xs font-bold text-${color}-600 bg-${color}-50 px-2 py-0.5 rounded-full`}>{label}</span>;
            }},
          ]}
        />
      </div>
    </AdminLayout>
  );
}
