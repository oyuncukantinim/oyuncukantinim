import { useState, useEffect, useCallback } from 'react';
import { Search, Ban, ShieldCheck, Wallet, Key, ChevronLeft, ChevronRight, X, Eye } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetUsers, adminUpdateUser, adminGetUser } from '../../lib/adminApi';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterBanned, setFilterBanned] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [modalType, setModalType] = useState(''); // 'ban'|'balance'|'password'|'detail'

  const [banReason, setBanReason] = useState('');
  const [balanceAction, setBalanceAction] = useState('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    adminGetUsers({ page, search, is_banned: filterBanned })
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filterBanned]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (user) => {
    setSelectedUser(user);
    setModalType('detail');
    const res = await adminGetUser(user.id).catch(() => null);
    if (res) setDetailUser(res.data);
  };

  const handleBan = async () => {
    setSaving(true);
    try {
      const isBanned = Number(selectedUser.is_banned) !== 1;
      await adminUpdateUser({ user_id: selectedUser.id, is_banned: isBanned ? 1 : 0, ban_reason: banReason });
      showToast(isBanned ? 'Kullanıcı banlandı.' : 'Ban kaldırıldı.');
      setModalType(''); load();
    } catch (e) { showToast(e.message); }
    finally { setSaving(false); }
  };

  const handleBalance = async () => {
    if (!balanceAmount || isNaN(balanceAmount)) { showToast('Geçerli tutar girin.'); return; }
    setSaving(true);
    try {
      const body = { user_id: selectedUser.id };
      if (balanceAction === 'add') body.balance_add = parseFloat(balanceAmount);
      else body.balance_set = parseFloat(balanceAmount);
      await adminUpdateUser(body);
      showToast('Bakiye güncellendi.');
      setModalType(''); setBalanceAmount(''); load();
    } catch (e) { showToast(e.message); }
    finally { setSaving(false); }
  };

  const handlePassword = async () => {
    if (!newPassword) { showToast('Şifre girin.'); return; }
    setSaving(true);
    try {
      await adminUpdateUser({ user_id: selectedUser.id, new_password: newPassword });
      showToast('Şifre sıfırlandı.');
      setModalType(''); setNewPassword('');
    } catch (e) { showToast(e.message); }
    finally { setSaving(false); }
  };

  const handleToggleAdmin = async (user) => {
    if (!confirm(`${user.username} kullanıcısının admin yetkisini ${user.is_admin ? 'kaldır' : 'ver'}?`)) return;
    try {
      await adminUpdateUser({ user_id: user.id, is_admin: user.is_admin ? 0 : 1 });
      showToast('Güncellendi.'); load();
    } catch (e) { showToast(e.message); }
  };

  const fmtMoney = (n) => Number(n || 0).toFixed(2) + ' ₺';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR') : '—';

  return (
    <AdminLayout>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>
      )}

      <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Kullanıcı adı veya e-posta ara..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
            />
          </div>
          <select
            value={filterBanned} onChange={e => { setFilterBanned(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
          >
            <option value="">Tüm Kullanıcılar</option>
            <option value="0">Aktif</option>
            <option value="1">Banlı</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-extrabold text-gray-800">Kullanıcılar</h3>
            <span className="text-sm text-gray-500">{total} kullanıcı</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Kullanıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden md:table-cell">E-posta</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden sm:table-cell">Bakiye</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">İlan</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Sipariş</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Kullanıcı bulunamadı.</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{u.avatar || '👤'}</span>
                        <div>
                          <div className="font-bold text-gray-800 flex items-center gap-1">
                            {u.username}
                            {Number(u.is_admin) === 1 && <span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded-full">Admin</span>}
                          </div>
                          <div className="text-xs text-gray-400">#{u.id} · Lv.{u.level}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 hidden sm:table-cell">{fmtMoney(u.balance)}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{u.listing_count}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{u.order_count}</td>
                    <td className="px-4 py-3">
                      {Number(u.is_banned) === 1
                        ? <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Banlı</span>
                        : <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Aktif</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(u)} title="Detay" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"><Eye size={15} /></button>
                        <button onClick={() => { setSelectedUser(u); setModalType('balance'); }} title="Bakiye" className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600"><Wallet size={15} /></button>
                        <button onClick={() => { setSelectedUser(u); setModalType('password'); }} title="Şifre" className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600"><Key size={15} /></button>
                        <button onClick={() => handleToggleAdmin(u)} title={Number(u.is_admin) === 1 ? 'Admin Kaldır' : 'Admin Yap'} className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-500 hover:text-violet-600"><ShieldCheck size={15} /></button>
                        <button onClick={() => { setSelectedUser(u); setBanReason(u.ban_reason || ''); setModalType('ban'); }} title={Number(u.is_banned) === 1 ? 'Ban Kaldır' : 'Banla'} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"><Ban size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

      {/* Ban Modal */}
      {modalType === 'ban' && selectedUser && (
        <Modal title={Number(selectedUser.is_banned) === 1 ? 'Ban Kaldır' : `${selectedUser.username} Kullanıcısını Banla`} onClose={() => setModalType('')}>
          {Number(selectedUser.is_banned) !== 1 && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Ban Sebebi</label>
              <input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Kural ihlali, spam vb." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
            </div>
          )}
          <p className="text-sm text-gray-600 mb-5">
            {Number(selectedUser.is_banned) === 1
              ? `${selectedUser.username} kullanıcısının banı kaldırılacak.`
              : `${selectedUser.username} kullanıcısı banlanacak ve giriş yapamayacak.`
            }
          </p>
          <button onClick={handleBan} disabled={saving} className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 text-white ${Number(selectedUser.is_banned) === 1 ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>
            {saving ? 'Kaydediliyor...' : (Number(selectedUser.is_banned) === 1 ? 'Banı Kaldır' : 'Banla')}
          </button>
        </Modal>
      )}

      {/* Balance Modal */}
      {modalType === 'balance' && selectedUser && (
        <Modal title={`${selectedUser.username} - Bakiye Düzenle`} onClose={() => setModalType('')}>
          <div className="mb-4 bg-gray-50 rounded-xl p-3 text-sm">
            Mevcut Bakiye: <span className="font-extrabold text-emerald-600">{fmtMoney(selectedUser.balance)}</span>
          </div>
          <div className="flex gap-2 mb-4">
            {['add','set'].map(a => (
              <button key={a} onClick={() => setBalanceAction(a)} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${balanceAction === a ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {a === 'add' ? 'Ekle' : 'Ayarla'}
              </button>
            ))}
          </div>
          <input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} placeholder="Tutar (₺)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:border-violet-400" />
          <button onClick={handleBalance} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : 'Güncelle'}
          </button>
        </Modal>
      )}

      {/* Password Modal */}
      {modalType === 'password' && selectedUser && (
        <Modal title={`${selectedUser.username} - Şifre Sıfırla`} onClose={() => setModalType('')}>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Yeni şifre" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:border-violet-400" />
          <button onClick={handlePassword} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : 'Şifreyi Sıfırla'}
          </button>
        </Modal>
      )}

      {/* Detail Modal */}
      {modalType === 'detail' && selectedUser && (
        <Modal title={`${selectedUser.username} - Detay`} onClose={() => { setModalType(''); setDetailUser(null); }}>
          {!detailUser ? (
            <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <span className="text-3xl">{detailUser.avatar}</span>
                <div>
                  <div className="font-extrabold text-gray-900">{detailUser.username}</div>
                  <div className="text-gray-500">{detailUser.email}</div>
                  <div className="text-xs text-gray-400">#{detailUser.id} · Seviye {detailUser.level} · {fmtDate(detailUser.created_at)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center"><div className="font-extrabold text-emerald-700">{fmtMoney(detailUser.balance)}</div><div className="text-xs text-gray-500">Bakiye</div></div>
                <div className="bg-violet-50 rounded-xl p-3 text-center"><div className="font-extrabold text-violet-700">{detailUser.listings?.length || 0}</div><div className="text-xs text-gray-500">İlan</div></div>
              </div>
              {detailUser.listings?.length > 0 && (
                <div>
                  <div className="font-bold text-gray-700 mb-2">Son İlanlar</div>
                  <div className="space-y-1.5">
                    {detailUser.listings.slice(0,5).map(l => (
                      <div key={l.id} className="flex justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                        <span className="truncate flex-1 text-gray-700">{l.title}</span>
                        <span className="font-bold text-emerald-600 ml-2">{fmtMoney(l.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </AdminLayout>
  );
}
