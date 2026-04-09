import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, ShoppingCart, ShoppingBag, Wallet, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyTransactions } from '../lib/api';

const DELIVERY_LABELS = ['Bekliyor', 'Teslim Edildi', 'Tamamlandı', 'Anlaşmazlık', 'İptal'];
const STATUS_COLORS   = ['text-gray-500', 'text-blue-500', 'text-emerald-600', 'text-red-500', 'text-gray-400'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function FinancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getMyTransactions(typeFilter)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate, typeFilter]);

  const transactions = data?.transactions || [];
  const summary      = data?.summary || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
          <Wallet size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Finansal Hareketler</h1>
          <p className="text-xs text-gray-400">Tüm alım, satış ve bakiye işlemlerin</p>
        </div>
      </div>

      {/* Özet kartları */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center"><TrendingDown size={16} className="text-red-500"/></div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Toplam Harcama</span>
            </div>
            <div className="text-2xl font-extrabold text-red-600">{Number(summary.total_spent || 0).toFixed(2)} ₺</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center"><TrendingUp size={16} className="text-emerald-600"/></div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Toplam Kazanç</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">{Number(summary.total_earned || 0).toFixed(2)} ₺</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center"><Clock size={16} className="text-yellow-600"/></div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bekleyen Ödeme</span>
            </div>
            <div className="text-2xl font-extrabold text-yellow-600">{Number(summary.pending_earn || 0).toFixed(2)} ₺</div>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-400" />
        {[
          { v: 'all',      l: 'Tümü' },
          { v: 'purchase', l: 'Alımlar' },
          { v: 'sale',     l: 'Satışlar' },
        ].map(f => (
          <button key={f.v} onClick={() => { setLoading(true); setTypeFilter(f.v); }}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${typeFilter === f.v ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"/></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Wallet size={40} className="mx-auto mb-3 opacity-20"/>
            <p className="font-semibold">Bu kategoride işlem yok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tür</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ürün</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden sm:table-cell">Karşı Taraf</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Tutar</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => {
                  const isPurchase = tx.tx_type === 'purchase';
                  const delivLabel = DELIVERY_LABELS[tx.delivery_status] || '—';
                  const delivColor = STATUS_COLORS[tx.delivery_status] || 'text-gray-400';
                  const net = isPurchase ? -tx.amount : (tx.seller_amount ?? tx.amount);
                  return (
                    <tr key={`${tx.tx_type}-${tx.id}-${i}`} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isPurchase ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isPurchase ? <ShoppingCart size={11}/> : <ShoppingBag size={11}/>}
                          {isPurchase ? 'Alım' : 'Satış'}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <span className="font-semibold text-gray-700 line-clamp-1">{tx.item_title || '—'}</span>
                        <span className="text-xs text-gray-400"># {tx.id}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{tx.counterparty || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-extrabold ${net < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {net < 0 ? '' : '+'}{Number(net).toFixed(2)} ₺
                        </span>
                      </td>
                      <td className={`px-4 py-3 hidden md:table-cell text-xs font-bold ${delivColor}`}>{delivLabel}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">{fmtDate(tx.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
