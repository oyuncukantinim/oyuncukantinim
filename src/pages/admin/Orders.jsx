import { useEffect, useState } from 'react';
import { Search, Eye, Tags, ShieldAlert } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminBulkUpdateOrders,
  adminGetOrderInsights,
  adminGetOrders,
  adminManageOrder,
  adminSaveEntityNote,
} from '../../lib/adminApi';

const STATUS_MAP = {
  completed: { label: 'Tamamlandı', color: 'emerald' },
  pending: { label: 'Bekliyor', color: 'yellow' },
  refunded: { label: 'İade', color: 'red' },
  cancelled: { label: 'İptal', color: 'gray' },
};

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
          <button onClick={onClose} className="px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-gray-100">Kapat</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [disputesOnly, setDisputesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detail, setDetail] = useState(null);
  const [labelsInput, setLabelsInput] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [newNote, setNewNote] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = () => {
    setLoading(true);
    adminGetOrders({ page: 1, search, status, delivery_status: disputesOnly ? 3 : '' })
      .then((res) => setOrders(res.data.orders || []))
      .catch((e) => showToast(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [search, status, disputesOnly]);

  const openDetail = async (order) => {
    setDetailOrder(order);
    const res = await adminGetOrderInsights(order.id).catch((e) => {
      showToast(e.message);
      return null;
    });
    if (res) {
      setDetail(res.data);
      setLabelsInput((res.data.order.labels || []).join(', '));
      setInternalNote(res.data.order.internal_note || '');
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const saveOrderMeta = async (extra = {}) => {
    if (!detailOrder) return;
    try {
      await adminManageOrder({
        order_id: detailOrder.id,
        labels: labelsInput.split(',').map((item) => item.trim()).filter(Boolean),
        internal_note: internalNote,
        ...extra,
      });
      showToast('Sipariş güncellendi.');
      openDetail(detailOrder);
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !detailOrder) return;
    try {
      await adminSaveEntityNote({
        entity_type: 'order',
        entity_id: detailOrder.id,
        note: newNote,
        color: 'yellow',
      });
      setNewNote('');
      openDetail(detailOrder);
    } catch (e) {
      showToast(e.message);
    }
  };

  const runBulk = async (bulk_action) => {
    if (!selectedIds.length) {
      showToast('Önce sipariş seçin.');
      return;
    }
    try {
      await adminBulkUpdateOrders({
        order_ids: selectedIds,
        bulk_action,
        labels: bulk_action === 'labels' ? ['öncelikli'] : undefined,
        dispute_status: bulk_action === 'dispute_status' ? 'in_review' : undefined,
        critical_confirmed: true,
      });
      setSelectedIds([]);
      load();
      showToast('Toplu işlem tamamlandı.');
    } catch (e) {
      showToast(e.message);
    }
  };

  const fmtMoney = (n) => Number(n || 0).toFixed(2) + ' ₺';

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
          <div className="relative xl:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Alıcı veya satıcı ara..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl">
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_MAP).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
          </select>
          <button onClick={() => setDisputesOnly((prev) => !prev)} className={`px-3 py-2 rounded-xl text-sm font-bold ${disputesOnly ? 'bg-red-50 text-red-600' : 'bg-white border border-gray-200 text-gray-600'}`}>
            <ShieldAlert size={14} className="inline mr-2" /> Anlaşmazlık Merkezi
          </button>
          <div className="flex gap-2">
            <button onClick={() => runBulk('labels')} className="flex-1 px-3 py-2 rounded-xl bg-violet-50 text-violet-700 text-sm font-bold">Toplu Etiket</button>
            <button onClick={() => runBulk('dispute_status')} className="flex-1 px-3 py-2 rounded-xl bg-yellow-50 text-yellow-700 text-sm font-bold">İncelemeye Al</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Seç</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sipariş</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Alıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Satıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tutar</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
                ) : orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'gray' };
                  return (
                    <tr key={order.id} className={`border-t border-gray-50 hover:bg-gray-50/50 ${Number(order.delivery_status) === 3 ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => toggleSelected(order.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">#{order.id}</div>
                        <div className="text-xs text-gray-400 max-w-[180px] truncate">{order.item_title || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.buyer || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{order.seller || '-'}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{fmtMoney(order.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex w-fit text-xs font-bold px-2 py-0.5 rounded-full bg-${statusInfo.color}-50 text-${statusInfo.color}-700`}>
                            {statusInfo.label}
                          </span>
                          {Number(order.delivery_status) === 3 && (
                            <span className="inline-flex w-fit text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">Anlaşmazlık</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openDetail(order)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Eye size={15} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {detailOrder && detail && (
        <Modal title={`Sipariş #${detailOrder.id} · Operasyon Merkezi`} onClose={() => { setDetailOrder(null); setDetail(null); }}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between"><span className="text-gray-500">Ürün</span><span className="font-bold text-gray-900">{detailOrder.item_title || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Alıcı</span><span className="font-semibold text-gray-700">{detailOrder.buyer || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Satıcı</span><span className="font-semibold text-gray-700">{detailOrder.seller || '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tutar</span><span className="font-extrabold text-emerald-600">{fmtMoney(detailOrder.amount)}</span></div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tags size={16} className="text-violet-600" />
                  <span className="font-bold text-gray-900">Sipariş Etiketleri</span>
                </div>
                <input
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder="öncelikli, vip, incelemede"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3"
                />
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={4}
                  placeholder="İç operasyon notu..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => saveOrderMeta()} className="flex-1 px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold">Kaydet</button>
                  <button onClick={() => saveOrderMeta({ dispute_status: 'resolved' })} className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold">Anlaşmazlığı Çöz</button>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="font-bold text-gray-900 mb-3">Kritik İşlemler</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button onClick={() => saveOrderMeta({ status: 'refunded', critical_confirmed: true })} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold">İade Et</button>
                  <button onClick={() => saveOrderMeta({ status: 'cancelled', critical_confirmed: true })} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">İptal Et</button>
                  <button onClick={() => saveOrderMeta({ force_pay_seller: true, critical_confirmed: true })} className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold">Satıcıya Öde</button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="font-bold text-gray-900 mb-3">İç Operasyon Notları</div>
                <div className="flex gap-2 mb-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    placeholder="Kısa bir operasyon notu ekle..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
                  />
                  <button onClick={addNote} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold">Ekle</button>
                </div>
                <div className="space-y-2">
                  {(detail.order.notes || []).map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-400">{item.admin_name} · {new Date(item.created_at).toLocaleString('tr-TR')}</div>
                      <div className="text-sm text-gray-700 mt-1">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="font-bold text-gray-900 mb-3">İşlem Geçmişi</div>
                <div className="space-y-2">
                  {(detail.logs || []).map((log, index) => (
                    <div key={`${log.created_at}-${index}`} className="bg-gray-50 rounded-xl p-3">
                      <div className="font-semibold text-gray-800">{log.action}</div>
                      <div className="text-xs text-gray-400 mt-1">{log.admin_name} · {new Date(log.created_at).toLocaleString('tr-TR')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

