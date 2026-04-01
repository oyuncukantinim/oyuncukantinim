import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetConversations } from '../../lib/adminApi';

export default function AdminMessages() {
  const [convs, setConvs] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminGetConversations({ page })
      .then(r => setConvs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (d) => d ? new Date(d).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <AdminLayout>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <MessageSquare size={18} className="text-violet-600" />
          <h3 className="font-extrabold text-gray-800">Konuşmalar (Meta)</h3>
          <span className="text-xs text-gray-400 ml-auto">Gizlilik: Mesaj içerikleri gösterilmez</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">Yükleniyor...</div>
        ) : convs.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Konuşma bulunamadı.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {convs.map((c, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50">
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={16} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <span>{c.user1}</span>
                    <span className="text-gray-300">↔</span>
                    <span>{c.user2}</span>
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{c.last_message}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-400">{fmtDate(c.created_at)}</div>
                  <div className="text-xs font-bold text-gray-500 mt-0.5">{c.message_count} mesaj</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
          <span className="text-xs text-gray-500">Sayfa {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={convs.length < 20} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      </div>
    </AdminLayout>
  );
}
