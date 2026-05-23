import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  History,
  Loader2,
  Package,
  Search,
  ShieldCheck,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetProductOrderLogs, adminGetProductOrders, adminUpdateProductOrder } from '../../lib/adminApi';
import useSiteBrand from '../../hooks/useSiteBrand';
import { DELIVERY_STATUS as DELIVERY_STATUS_MAP, ORDER_STATUS_OPTIONS } from '../../lib/orderStatus';

function DeliveryBadge({ status }) {
  const meta = DELIVERY_STATUS_MAP[status] || DELIVERY_STATUS_MAP[0];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black ${meta.badge}`}>
      <Icon size={11} /> {meta.label}
    </span>
  );
}

function ProductOrderDetailModal({ order, onClose, onRefresh, showToast }) {
  const { defaultListingImage } = useSiteBrand();
  const [deliveryStatus, setDeliveryStatus] = useState(Number(order.delivery_status ?? 0));
  const [deliveryNote, setDeliveryNote] = useState(order.delivery_note || '');
  const [deliveryContent, setDeliveryContent] = useState(order.delivery_content || '');
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    adminGetProductOrderLogs(order.id)
      .then((response) => {
        setLogs(response.data.logs || []);
      })
      .catch(() => {
        setLogs([]);
      })
      .finally(() => setLogsLoading(false));
  }, [order.id]);

  const productImage = order.product_cover_image || order.product_image || defaultListingImage;

  const save = async () => {
    setLoading(true);
    try {
      await adminUpdateProductOrder({
        order_item_id: order.id,
        delivery_status: deliveryStatus,
        delivery_note: deliveryNote,
        delivery_content: deliveryContent,
      });
      showToast('Urun siparisi guncellendi.');
      onRefresh();
      onClose();
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (value) => (value ? new Date(value).toLocaleString('tr-TR') : '—');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Urun Siparisi #{order.id}</h2>
            <p className="mt-1 text-xs font-semibold text-gray-400">{fmtDate(order.order_created_at)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={order.product_title}
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                    <Package size={24} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold text-gray-900">{order.product_title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500">
                    <span>{order.buyer_name || 'Alici yok'}</span>
                    <span>•</span>
                    <span>{order.product_type}</span>
                    <span>•</span>
                    <span>{order.delivery_type === 'automatic' ? 'Otomatik Teslim' : 'Manuel Teslim'}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <DeliveryBadge status={deliveryStatus} />
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black text-white">
                      Site Urunu
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white px-3 py-2">
                  <div className="text-xs font-bold text-gray-400">Tutar</div>
                  <div className="text-lg font-black text-emerald-600">{Number(order.amount || 0).toFixed(2)} ₺</div>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <div className="text-xs font-bold text-gray-400">Siparis Durumu</div>
                  <div className="text-sm font-black text-slate-700">{order.order_status || 'pending'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-600">Teslimat Durumu</label>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(Number(e.target.value))}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                >
                  {Object.entries(DELIVERY_STATUS_MAP).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-600">Teslimat Notu</label>
                <textarea
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none resize-y"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-600">Teslimat Icerigi</label>
                <textarea
                  value={deliveryContent}
                  onChange={(e) => setDeliveryContent(e.target.value)}
                  rows={7}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-2.5 font-mono text-sm focus:border-violet-400 focus:outline-none resize-y"
                />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="mb-3 flex items-center gap-2">
                <History size={15} className="text-gray-400" />
                <h3 className="font-extrabold text-gray-800">Teslimat Gecmisi</h3>
              </div>
              {logsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-violet-500" />
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm text-gray-400">
                  Henuz urun siparisi logu yok.
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log, index) => (
                    <div key={`${log.created_at || 'log'}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                      <div className="text-sm font-extrabold text-gray-800">{log.action}</div>
                      {log.note ? <p className="mt-1 text-xs font-semibold text-gray-500">{log.note}</p> : null}
                      <div className="mt-2 text-[11px] font-bold text-gray-400">{fmtDate(log.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
                <ShieldCheck size={13} /> Resmi Islem
              </div>
              <p className="mt-3 text-sm font-semibold text-white/70">
                Bu alan kullanici ilan siparislerinden ayridir. Teslimat ve not guncellemesi sadece site urununu etkiler.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-black text-gray-600 hover:bg-gray-50">
            Kapat
          </button>
          <button type="button" onClick={save} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-500 disabled:opacity-60">
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    adminGetProductOrders({ page, search, status: statusFilter, delivery_status: deliveryFilter })
      .then((response) => {
        setOrders(response.data.orders || []);
        setTotal(Number(response.data.total || 0));
        setPages(Number(response.data.pages || 1));
      })
      .catch((error) => {
        showToast(error.message);
        setOrders([]);
        setTotal(0);
        setPages(1);
      })
      .finally(() => setLoading(false));
  }, [deliveryFilter, page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const fmtDate = (value) => (value ? new Date(value).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

  return (
    <AdminLayout>
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-2xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Site Urunu Siparisleri</h1>
              <p className="mt-1 text-sm font-semibold text-gray-400">
                Resmi urun siparislerini kullanıcı ilan siparislerinden ayrı yonetin.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">{total} siparis</div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Alici veya urun ara..."
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-violet-400 focus:outline-none"
              />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none">
              <option value="">Tum siparis durumlari</option>
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select value={deliveryFilter} onChange={(e) => { setDeliveryFilter(e.target.value); setPage(1); }} className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none">
              <option value="">Tum teslimat durumlari</option>
              {Object.entries(DELIVERY_STATUS_MAP).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500">Urun</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500 hidden md:table-cell">Alici</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500 hidden md:table-cell">Siparis</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500">Tutar</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500 hidden lg:table-cell">Teslimat</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-500 hidden xl:table-cell">Tarih</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-gray-500">Islem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">Yukleniyor...</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">Urun siparisi bulunamadi.</td>
                  </tr>
                ) : orders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">#{order.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-800">{order.product_title}</div>
                      <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                        Site Urunu
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">{order.buyer_name || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs font-bold text-gray-400">{order.order_status || 'pending'}</td>
                    <td className="px-4 py-3 font-black text-emerald-600">{Number(order.amount || 0).toFixed(2)} ₺</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <DeliveryBadge status={Number(order.delivery_status ?? 0)} />
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-400">{fmtDate(order.order_created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setSelectedOrder(order)} className="rounded-xl p-2 text-gray-400 hover:bg-violet-50 hover:text-violet-600">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {pages > 1 ? (
          <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <span className="text-sm font-semibold text-gray-400">Sayfa {page} / {pages}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Geri
              </button>
              <button type="button" disabled={page >= pages} onClick={() => setPage((prev) => Math.min(pages, prev + 1))} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Ileri
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {selectedOrder ? (
        <ProductOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={load}
          showToast={showToast}
        />
      ) : null}
    </AdminLayout>
  );
}
