import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetOrders, adminUpdateOrder } from '../../lib/adminApi';

const STATUS_MAP = {
  completed: { label: 'Tamamlandı', badge: 'text-emerald-600 bg-emerald-50' },
  pending:   { label: 'Bekliyor',   badge: 'text-amber-600 bg-amber-50' },
  refunded:  { label: 'İade',       badge: 'text-red-600 bg-red-50' },
  cancelled: { label: 'İptal',      badge: 'text-gray-600 bg-gray-100' },
};

function deliveryLabel(o) {
  if (o.item_type !== 'listing' || !o.listing_delivery_type) return null;
  if (o.listing_delivery_type === 'stock') return 'Stoklu';
  const h = o.listing_delivery_hours;
  return h ? `Manuel · ${h} saat` : 'Manuel';
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    adminGetOrders({ page, search, status: filterStatus })
      .then(r => { setOrders(r.data.orders); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id, status) => {
    const label = STATUS_MAP[status]?.label || status;
    if (!confirm(`Sipariş durumu "${label}" olarak güncellensin mi?`)) return;
    try { await adminUpdateOrder({ order_id: id, status }); showToast('Güncellendi.'); load(); }
    catch (e) { showToast(e.message); }
  };

  const fmtMoney = (n) => Number(n || 0).toFixed(2) + ' ₺';
  const fmtDate = (d) => d ? new Date(d).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Alıcı veya satıcı ara..." className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400" />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400">
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-extrabold text-gray-800">Siparişler</h3>
            <span className="text-sm text-gray-500">{total} sipariş</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">#ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ürün</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Alıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Satıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tutar</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden xl:table-cell">Teslimat</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Sipariş bulunamadı.</td></tr>
                ) : orders.map(o => {
                  const st = STATUS_MAP[o.status] || { label: o.status, badge: 'text-gray-600 bg-gray-100' };
                  const d = deliveryLabel(o);
                  return (
                    <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">#{o.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800 max-w-[160px] truncate">{o.item_title || '—'}</div>
                        <div className="text-xs text-gray-400">{o.item_type === 'epin' ? 'E-Pin' : 'İlan'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{o.buyer || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{o.seller || '—'}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{fmtMoney(o.amount)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell">
                        {d ? <span className="font-semibold">{d}</span> : '—'}
                        {o.delivered_content && (
                          <div className="text-[10px] text-gray-400 truncate max-w-[120px] mt-0.5" title={o.delivered_content}>İçerik kayıtlı</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{fmtDate(o.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${st.badge}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {o.status === 'completed' && (
                          <button onClick={() => handleStatus(o.id, 'refunded')} title="İade Et" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                            <RefreshCw size={14} />
                          </button>
                        )}
                        {o.status === 'pending' && (
                          <button onClick={() => handleStatus(o.id, 'completed')} title="Tamamla" className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600">
                            <RefreshCw size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Sayfa {page} / {pages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
