import { useEffect, useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetAuditLogs } from '../../lib/adminApi';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    setLoading(true);
    adminGetAuditLogs({ search, entity_type: entityType })
      .then((res) => setLogs(res.data.logs || []))
      .catch((e) => showToast(e.message))
      .finally(() => setLoading(false));
  }, [search, entityType]);

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Admin, ozet veya aksiyon ara..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
            />
          </div>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
          >
            <option value="">Tum Varliklar</option>
            <option value="user">Kullanici</option>
            <option value="listing">Ilan</option>
            <option value="order">Siparis</option>
            <option value="settings">Ayar</option>
            <option value="notification">Duyuru</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900">Admin Islem Gecmisi</h3>
              <p className="text-xs text-gray-500">Roller, notlar, toplu islemler ve kritik aksiyonlar burada izlenir.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Aksiyon</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Varlik</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ozet</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Yukleniyor...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Kayit bulunamadi.</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-violet-700">{log.action_key}</td>
                    <td className="px-4 py-3 text-gray-700">{log.admin_name}</td>
                    <td className="px-4 py-3 text-gray-500">{log.entity_type || 'genel'}{log.entity_id ? ` #${log.entity_id}` : ''}</td>
                    <td className="px-4 py-3 text-gray-600">{log.summary || '-'}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString('tr-TR')}</td>
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
