import { useEffect, useState } from 'react';
import { Download, TrendingUp, Wallet, ShoppingBag, AlertTriangle, Calculator } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetAllTransactions, adminGetFinanceOverview } from '../../lib/adminApi';

const DELIVERY_LABELS = ['Bekliyor', 'Teslim Edildi', 'Tamamlandı', 'Anlaşmazlık', 'İptal'];

function SummaryCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-gray-800">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminFinance() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      adminGetAllTransactions({ page: 1 }),
      adminGetFinanceOverview({ days: 14 }),
    ])
      .then(([txRes, overviewRes]) => {
        if (txRes.status === 'fulfilled') {
          setTransactions(txRes.value.data.transactions || []);
          setSummary(txRes.value.data.summary || {});
        }
        if (overviewRes.status === 'fulfilled') {
          setOverview(overviewRes.value.data);
        }
      })
      .catch((e) => showToast(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const fmtMoney = (n) => Number(n || 0).toFixed(2) + ' ₺';

  const exportCsv = () => {
    const rows = [
      ['ID', 'Ürün', 'Alıcı', 'Satıcı', 'Tutar', 'Satıcı Net', 'Durum', 'Teslimat', 'Tarih'],
      ...transactions.map((tx) => [
        tx.id,
        tx.item_title || '',
        tx.buyer_username || '',
        tx.seller_username || '',
        Number(tx.amount || 0).toFixed(2),
        Number(tx.seller_amount || 0).toFixed(2),
        tx.status || '',
        DELIVERY_LABELS[tx.delivery_status] || '',
        tx.created_at || '',
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-finance-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Toplam Hacim" value={fmtMoney(summary.total_volume)} color="bg-violet-500" icon={Wallet} />
          <SummaryCard label="Toplam Komisyon" value={fmtMoney(summary.total_commission)} color="bg-emerald-500" icon={TrendingUp} />
          <SummaryCard label="Ödenen Satıcılar" value={fmtMoney(summary.total_paid_out)} color="bg-blue-500" icon={ShoppingBag} />
          <SummaryCard label="Bekleyen Ödeme" value={fmtMoney(summary.pending_payout)} color="bg-yellow-500" icon={AlertTriangle} sub={`${overview?.pending_payout_orders || 0} sipariş`} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-gray-900">14 Günlük Akış</h3>
                <p className="text-xs text-gray-500 mt-1">Günlük hacim ve komisyon görünümü.</p>
              </div>
              <button onClick={load} className="text-xs font-bold text-violet-600 hover:text-violet-500">Yenile</button>
            </div>
            <div className="space-y-3">
              {(overview?.daily || []).map((row) => {
                const gross = Number(row.gross_volume || 0);
                const width = Math.min(100, gross / 50);
                return (
                  <div key={row.day}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700">{row.day}</span>
                      <span className="text-gray-400">{fmtMoney(gross)} · {row.order_count} sipariş</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" style={{ width: `${Math.max(6, width)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calculator size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900">Komisyon Simülasyonu</h3>
                <p className="text-xs text-gray-500 mt-1">Varsayılan oran üzerinden hızlı net kazanç görünümü.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Brüt</div>
                <div className="font-extrabold text-gray-900">{fmtMoney(overview?.simulation?.gross_amount)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Komisyon</div>
                <div className="font-extrabold text-violet-700">%{Number(overview?.simulation?.commission_rate || 0).toFixed(1)}</div>
                <div className="text-xs text-gray-400 mt-1">{fmtMoney(overview?.simulation?.commission_amount)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Satıcı Net</div>
                <div className="font-extrabold text-emerald-600">{fmtMoney(overview?.simulation?.seller_net)}</div>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="font-bold text-gray-900 mb-2">Son 30 Gün En Çok Kazanan Satıcılar</h4>
              <div className="space-y-2">
                {(overview?.top_sellers || []).map((seller, index) => (
                  <div key={`${seller.username}-${index}`} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <div>
                      <div className="font-semibold text-gray-800">{seller.username}</div>
                      <div className="text-xs text-gray-400">{seller.order_count} sipariş</div>
                    </div>
                    <div className="font-extrabold text-emerald-600">{fmtMoney(seller.seller_net)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-gray-900">İşlem Kaydı</h3>
              <p className="text-xs text-gray-500 mt-1">Son finansal hareketler, komisyon ve ödeme akışı.</p>
            </div>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800">
              <Download size={14} /> CSV Dışa Aktar
            </button>
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
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Satıcı Net</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Teslimat</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Kayıt bulunamadı.</td></tr>
                ) : transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{tx.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800 max-w-[160px] truncate">{tx.item_title || '—'}</div>
                      <div className="text-xs text-gray-400">{tx.item_type}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{tx.buyer_username || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{tx.seller_username || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{fmtMoney(tx.amount)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmtMoney(tx.seller_amount)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-500">{DELIVERY_LABELS[tx.delivery_status] || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(tx.created_at).toLocaleString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
