import { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, ShoppingCart, ShoppingBag, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetAllTransactions } from '../../lib/adminApi';

const DELIVERY_LABELS = ['Bekliyor', 'Teslim Edildi', 'Tamamlandı', 'Anlaşmazlık', 'İptal'];
const DELIVERY_COLORS = ['text-gray-400', 'text-blue-500', 'text-emerald-600', 'text-red-500', 'text-gray-300'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SummaryCard({ label, value, color, Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-gray-800">{Number(value || 0).toFixed(2)} ₺</div>
    </div>
  );
}

export default function AdminFinance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [username, setUsername] = useState('');
  const [date, setDate] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    adminGetAllTransactions({ page, username, date })
      .then(r => setData(r.data))
      .catch(e => showToast(e.message))
      .finally(() => setLoading(false));
  }, [page, username, date]);

  useEffect(() => { load(); }, [load]);

  const transactions = data?.transactions || [];
  const summary = data?.summary || {};
  const pages = data?.pages || 1;

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="space-y-5">
        {/* Özet */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Toplam Hacim"      value={summary.total_volume}    color="bg-violet-500" Icon={Wallet} />
          <SummaryCard label="Toplam Komisyon"   value={summary.total_commission} color="bg-emerald-500" Icon={TrendingUp} />
          <SummaryCard label="Ödenen Satıcılar"  value={summary.total_paid_out}  color="bg-blue-500"   Icon={ShoppingBag} />
          <SummaryCard label="Bekleyen Ödeme"    value={summary.pending_payout}  color="bg-yellow-500" Icon={ShoppingCart} />
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setPage(1); }}
              placeholder="Kullanıcı adı..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
            />
          </div>
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
          />
          <button onClick={() => { setUsername(''); setDate(''); setPage(1); }}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-bold">
            Temizle
          </button>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-extrabold text-gray-800">İşlemler</h3>
            <span className="text-sm text-gray-400">{data?.total || 0} kayıt</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ürün</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Alıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Satıcı</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Tutar</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Komisyon</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Oran</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Satıcı Net</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Teslimat</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ödendi</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">Yükleniyor...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">Kayıt bulunamadı.</td></tr>
                ) : transactions.map(tx => {
                  const comm = tx.amount - (tx.seller_amount ?? tx.amount);
                  const rate = tx.amount > 0 && comm > 0 ? ((comm / tx.amount) * 100).toFixed(1) + '%' : '—';
                  const isRefunded = tx.status === 'refunded';
                  return (
                    <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50/50 text-xs">
                      <td className="px-4 py-3 text-gray-400 font-mono">{tx.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-700 max-w-[140px] truncate">{tx.item_title || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-semibold">{tx.buyer_username || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 font-semibold">{tx.seller_username || '—'}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-gray-800">{Number(tx.amount).toFixed(2)} ₺</td>
                      <td className="px-4 py-3 text-right font-bold text-violet-600">{comm > 0 ? comm.toFixed(2) + ' ₺' : '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-400">{rate}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{tx.seller_amount != null ? Number(tx.seller_amount).toFixed(2) + ' ₺' : '—'}</td>
                      <td className={`px-4 py-3 font-bold ${DELIVERY_COLORS[tx.delivery_status] || 'text-gray-400'}`}>
                        {DELIVERY_LABELS[tx.delivery_status] || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {isRefunded ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">İade Edildi</span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.seller_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'}`}>
                            {tx.seller_paid ? 'Ödendi' : 'Bekliyor'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(tx.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-violet-600 disabled:opacity-30">
                <ChevronLeft size={16}/> Önceki
              </button>
              <span className="text-sm text-gray-500">{page} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}
                className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-violet-600 disabled:opacity-30">
                Sonraki <ChevronRight size={16}/>
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
