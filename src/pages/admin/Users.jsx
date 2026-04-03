import { useEffect, useState } from 'react';
import { Search, Eye, Ban, LockKeyhole, NotebookPen, ShieldCheck } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminBulkUpdateUsers,
  adminDeleteEntityNote,
  adminGetUserInsights,
  adminGetUsers,
  adminSaveEntityNote,
  adminUpdateUser,
} from '../../lib/adminApi';

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
          <button onClick={onClose} className="px-3 py-1.5 text-sm font-semibold rounded-xl hover:bg-gray-100">Kapat</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterBanned, setFilterBanned] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [detail, setDetail] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [note, setNote] = useState('');
  const [restrictionDraft, setRestrictionDraft] = useState({
    listing_create: true,
    messaging: false,
    balance_add: false,
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = () => {
    setLoading(true);
    adminGetUsers({ page: 1, search, is_banned: filterBanned })
      .then((res) => setUsers(res.data.users || []))
      .catch((e) => showToast(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [search, filterBanned]);

  const openDetail = async (user) => {
    setDetailUser(user);
    const res = await adminGetUserInsights(user.id).catch((e) => {
      showToast(e.message);
      return null;
    });
    if (res) {
      setDetail(res.data);
      setRestrictionDraft({
        listing_create: Boolean(res.data.restrictions?.listing_create),
        messaging: Boolean(res.data.restrictions?.messaging),
        balance_add: Boolean(res.data.restrictions?.balance_add),
      });
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const saveRestriction = async () => {
    if (!detailUser) return;
    try {
      await adminBulkUpdateUsers({
        user_ids: [detailUser.id],
        bulk_action: 'restrict',
        restrictions: restrictionDraft,
      });
      showToast('Kısıtlı mod güncellendi.');
      openDetail(detailUser);
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  const clearRestriction = async () => {
    if (!detailUser) return;
    try {
      await adminBulkUpdateUsers({
        user_ids: [detailUser.id],
        bulk_action: 'clear_restrictions',
      });
      showToast('Kısıtlar kaldırıldı.');
      openDetail(detailUser);
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  const saveNote = async () => {
    if (!detailUser || !note.trim()) return;
    try {
      const res = await adminSaveEntityNote({
        entity_type: 'user',
        entity_id: detailUser.id,
        note,
        color: 'blue',
      });
      setDetail((prev) => ({ ...prev, notes: res.data.notes || [] }));
      setNote('');
      showToast('İç not eklendi.');
    } catch (e) {
      showToast(e.message);
    }
  };

  const deleteNote = async (id) => {
    try {
      await adminDeleteEntityNote(id);
      openDetail(detailUser);
    } catch (e) {
      showToast(e.message);
    }
  };

  const bulkAction = async (bulk_action) => {
    if (!selectedIds.length) {
      showToast('Önce kullanıcı seçin.');
      return;
    }
    try {
      await adminBulkUpdateUsers({ user_ids: selectedIds, bulk_action });
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
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kullanıcı adı veya e-posta ara..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
            />
          </div>
          <select
            value={filterBanned}
            onChange={(e) => setFilterBanned(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
          >
            <option value="">Tüm Kullanıcılar</option>
            <option value="0">Aktif</option>
            <option value="1">Banlı</option>
          </select>
          <button onClick={() => bulkAction('ban')} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold">Toplu Ban</button>
          <button onClick={() => bulkAction('unban')} className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold">Ban Kaldır</button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Seç</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Kullanıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">E-posta</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Bakiye</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelected(user.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{user.username}</div>
                      <div className="text-xs text-gray-400">#{user.id}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{fmtMoney(user.balance)}</td>
                    <td className="px-4 py-3">
                      {Number(user.is_banned) === 1
                        ? <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Banlı</span>
                        : <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Aktif</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openDetail(user)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Eye size={15} /></button>
                        <button
                          onClick={async () => {
                            try {
                              await adminUpdateUser({ user_id: user.id, is_banned: Number(user.is_banned) === 1 ? 0 : 1, ban_reason: 'Admin islemi' });
                              load();
                            } catch (e) {
                              showToast(e.message);
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                        >
                          <Ban size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {detailUser && detail && (
        <Modal title={`${detailUser.username} · Güven ve Operasyon`} onClose={() => { setDetailUser(null); setDetail(null); }}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-1 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700">Risk Skoru</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${detail.risk?.level === 'high' ? 'bg-red-50 text-red-600' : detail.risk?.level === 'medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {detail.risk?.level || 'low'}
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{detail.risk?.score || 0}</div>
                <div className="mt-3 space-y-1">
                  {(detail.risk?.reasons || []).map((reason) => (
                    <div key={reason} className="text-xs text-gray-500">{reason}</div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <LockKeyhole size={16} className="text-violet-600" />
                  <span className="font-bold text-gray-900">Kısıtlı Mod</span>
                </div>
                {[
                  ['listing_create', 'İlan açma'],
                  ['messaging', 'Mesajlaşma'],
                  ['balance_add', 'Bakiye yükleme'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between py-2 text-sm text-gray-700">
                    {label}
                    <input
                      type="checkbox"
                      checked={Boolean(restrictionDraft[key])}
                      onChange={(e) => setRestrictionDraft((prev) => ({ ...prev, [key]: e.target.checked }))}
                    />
                  </label>
                ))}
                <div className="flex gap-2 mt-3">
                  <button onClick={saveRestriction} className="flex-1 px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold">Kaydet</button>
                  <button onClick={clearRestriction} className="flex-1 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">Sıfırla</button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-violet-600" />
                  <span className="font-bold text-gray-900">Profil Özeti</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Bakiye</span><span className="font-bold text-emerald-600">{fmtMoney(detail.balance)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Kayıt</span><span className="font-semibold text-gray-700">{new Date(detail.created_at).toLocaleDateString('tr-TR')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Son Görülme</span><span className="font-semibold text-gray-700">{detail.last_seen_at ? new Date(detail.last_seen_at).toLocaleString('tr-TR') : 'Bilinmiyor'}</span></div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-2 space-y-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <NotebookPen size={16} className="text-violet-600" />
                  <span className="font-bold text-gray-900">İç Notlar</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Operasyon ekibi için görünür not..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none"
                  />
                  <button onClick={saveNote} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold">Ekle</button>
                </div>
                <div className="space-y-2">
                  {(detail.notes || []).map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-gray-400">{item.admin_name} · {new Date(item.created_at).toLocaleString('tr-TR')}</div>
                        <button onClick={() => deleteNote(item.id)} className="text-xs font-bold text-red-500">Sil</button>
                      </div>
                      <div className="text-sm text-gray-700 mt-1">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="font-bold text-gray-900 mb-3">Kullanıcı Zaman Çizelgesi</div>
                <div className="space-y-3">
                  {(detail.timeline || []).map((event, index) => (
                    <div key={`${event.type}-${index}`} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-violet-500 mt-2" />
                      <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                        <div className="font-semibold text-gray-800">{event.title}</div>
                        <div className="text-xs text-gray-400 mt-1">{new Date(event.created_at).toLocaleString('tr-TR')}</div>
                        {event.meta?.note && <div className="text-sm text-gray-600 mt-2">{event.meta.note}</div>}
                      </div>
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
