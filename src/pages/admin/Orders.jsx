import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Eye, X, RefreshCw, CheckCircle, AlertTriangle, Clock, Truck, XCircle, History } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetOrders, adminUpdateOrder, adminGetOrderLogs } from '../../lib/adminApi';

const STATUS_MAP = {
  completed: { label: 'Tamamlandı', color: 'emerald' },
  pending:   { label: 'Bekliyor',   color: 'yellow' },
  refunded:  { label: 'İade',       color: 'red' },
  cancelled: { label: 'İptal',      color: 'gray' },
};

const DELIVERY_STATUS_MAP = {
  0: { label: 'Teslimat Bekleniyor', color: 'orange', icon: Clock },
  1: { label: 'Teslim Edildi',       color: 'blue',   icon: Truck },
  2: { label: 'Tamamlandı',          color: 'emerald',icon: CheckCircle },
  3: { label: 'Anlaşmazlık',         color: 'red',    icon: AlertTriangle },
  4: { label: 'İptal',               color: 'gray',   icon: XCircle },
};

function DeliveryBadge({ status }) {
  const s = DELIVERY_STATUS_MAP[status] ?? DELIVERY_STATUS_MAP[0];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-${s.color}-50 text-${s.color}-700`}>
      <Icon size={11} /> {s.label}
    </span>
  );
}

function OrderDetailModal({ order, onClose, onRefresh, showToast }) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    adminGetOrderLogs(order.id)
      .then(r => setLogs(r.data || []))
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, [order.id]);

  const update = async (fields) => {
    setLoading(true);
    try {
      await adminUpdateOrder({ order_id: order.id, ...fields });
      showToast('Güncellendi.');
      onRefresh();
      onClose();
    } catch (e) { showToast(e.message); }
    finally { setLoading(false); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString('tr-TR') : '—';
  const ds = parseInt(order.delivery_status ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Sipariş #{order.id}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100"><X size={18} /></button>
        </div>

        {/* Detaylar */}
        <div className="space-y-3 mb-5">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ürün</span>
              <span className="font-bold text-gray-800">{order.item_title || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tür</span>
              <span className="font-semibold text-gray-700">{order.item_type === 'epin' ? 'E-Pin' : 'İlan'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Alıcı</span>
              <span className="font-semibold text-gray-700">{order.buyer || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Satıcı</span>
              <span className="font-semibold text-gray-700">{order.seller || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tutar</span>
              <span className="font-extrabold text-emerald-600">{Number(order.amount).toFixed(2)} ₺</span>
            </div>
            {order.seller_amount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Satıcı Alacağı</span>
                <span className="font-semibold text-blue-600">{Number(order.seller_amount).toFixed(2)} ₺</span>
              </div>
            )}
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Genel Durum</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${STATUS_MAP[order.status]?.color || 'gray'}-50 text-${STATUS_MAP[order.status]?.color || 'gray'}-700`}>
                {STATUS_MAP[order.status]?.label || order.status}
              </span>
            </div>
            {order.item_type === 'listing' && (
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500">Teslimat Durumu</span>
                <DeliveryBadge status={ds} />
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Satıcı Ödendi?</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.seller_paid == 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                {order.seller_paid == 1 ? 'Ödendi' : 'Beklemede (Havuz)'}
              </span>
            </div>
            {order.auto_confirm_at && order.status !== 'refunded' && order.status !== 'cancelled' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Otomatik Onay</span>
                <span className="text-gray-600 text-xs">{fmtDate(order.auto_confirm_at)}</span>
              </div>
            )}
          </div>

          {/* Anlaşmazlık notu */}
          {ds === 3 && order.dispute_reason && (
            <div>
              <div className="text-xs font-bold text-red-600 mb-1.5">⚠️ Anlaşmazlık Nedeni</div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800 whitespace-pre-wrap">{order.dispute_reason}</div>
            </div>
          )}
          {ds === 3 && !order.dispute_reason && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">⚠️ Alıcı anlaşmazlık bildirdi. Detay girilmemiş.</div>
          )}

          {/* Teslimat içeriği */}
          {order.delivery_content && (
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1.5">📦 Teslimat İçeriği</div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-mono text-gray-800 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                {order.delivery_content}
              </div>
            </div>
          )}
        </div>

        {/* Aksiyonlar */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase mb-2">Admin İşlemleri</div>

          {/* Teslimat durumu güncelle */}
          {order.item_type === 'listing' && (
            <div>
              <div className="text-xs text-gray-500 mb-1.5">Teslimat Durumunu Değiştir:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(DELIVERY_STATUS_MAP).map(([val, info]) => (
                  <button
                    key={val}
                    disabled={loading || ds === parseInt(val)}
                    onClick={() => update({ delivery_status: parseInt(val) })}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all disabled:opacity-40 ${
                      ds === parseInt(val)
                        ? `bg-${info.color}-100 text-${info.color}-700 border-${info.color}-300`
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'
                    }`}
                  >
                    {info.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Satıcıya öde */}
          {order.seller_id && order.seller_paid == 0 && ds === 2 && (
            <button
              disabled={loading}
              onClick={() => update({ force_pay_seller: true })}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-50 transition-colors"
            >
              <CheckCircle size={15} /> Satıcıya Manuel Ödeme Yap
            </button>
          )}

          {/* Genel durum - iade edilmişse tüm aksiyonlar kilitli */}
          {order.status === 'refunded' ? (
            <div className="text-center text-sm text-red-500 font-semibold bg-red-50 border border-red-100 rounded-xl py-2.5 mt-2">
              Bu sipariş iade edildi. Başka işlem yapılamaz.
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <button
                disabled={loading}
                onClick={() => update({ status: 'refunded' })}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-2 rounded-xl disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={13} /> İade Et
              </button>
              {order.status !== 'cancelled' && (
                <button
                  disabled={loading}
                  onClick={() => update({ status: 'cancelled' })}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold py-2 rounded-xl disabled:opacity-50 transition-colors"
                >
                  <XCircle size={13} /> İptal Et
                </button>
              )}
              {order.status === 'pending' && (
                <button
                  disabled={loading}
                  onClick={() => update({ status: 'completed' })}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold py-2 rounded-xl disabled:opacity-50 transition-colors"
                >
                  <CheckCircle size={13} /> Tamamla
                </button>
              )}
            </div>
          )}
        </div>

        {/* İşlem Geçmişi */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <History size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase">İşlem Geçmişi</span>
          </div>
          {logsLoading ? (
            <div className="text-xs text-gray-400 text-center py-3">Yükleniyor...</div>
          ) : logs.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-3">Henüz işlem yapılmadı.</div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-700 font-semibold">{log.action}</span>
                    <div className="text-gray-400 mt-0.5">
                      {log.admin_name} · {new Date(log.created_at).toLocaleString('tr-TR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDelivery, setFilterDelivery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    adminGetOrders({ page, search, status: filterStatus, delivery_status: filterDelivery })
      .then(r => { setOrders(r.data.orders); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filterStatus, filterDelivery]);

  useEffect(() => { load(); }, [load]);

  const fmtMoney = (n) => Number(n || 0).toFixed(2) + ' ₺';
  const fmtDate = (d) => d ? new Date(d).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Alıcı veya satıcı ara..." className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400" />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400">
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterDelivery} onChange={e => { setFilterDelivery(e.target.value); setPage(1); }} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400">
            <option value="">Tüm Teslimat</option>
            {Object.entries(DELIVERY_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ürün</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Alıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Satıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tutar</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Teslimat</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Tarih</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Sipariş bulunamadı.</td></tr>
                ) : orders.map(o => {
                  const { label, color } = STATUS_MAP[o.status] || { label: o.status, color: 'gray' };
                  const ds = parseInt(o.delivery_status ?? 0);
                  const dInfo = DELIVERY_STATUS_MAP[ds];
                  return (
                    <tr key={o.id} className={`border-t border-gray-50 hover:bg-gray-50/50 ${ds === 3 ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">#{o.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800 max-w-[150px] truncate">{o.item_title || '—'}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{o.item_type === 'epin' ? 'E-Pin' : 'İlan'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell text-sm">{o.buyer || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell text-sm">{o.seller || '—'}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 text-sm">{fmtMoney(o.amount)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full bg-${color}-50 text-${color}-700`}>{label}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {o.item_type === 'listing' && dInfo && (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-${dInfo.color}-50 text-${dInfo.color}-700`}>
                            {dInfo.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{fmtDate(o.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
                          title="Detay"
                        >
                          <Eye size={15} />
                        </button>
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

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={load}
          showToast={showToast}
        />
      )}
    </AdminLayout>
  );
}
