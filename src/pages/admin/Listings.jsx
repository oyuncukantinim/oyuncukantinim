import { useEffect, useState } from 'react';
import { Search, Eye, ShieldAlert, History, Tags } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminBulkUpdateListings,
  adminGetListingInsights,
  adminGetListings,
  adminGetModerationQueue,
  adminManageListing,
  adminSaveEntityNote,
} from '../../lib/adminApi';

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

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [queueOnly, setQueueOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailListing, setDetailListing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [moderationStatus, setModerationStatus] = useState('approved');
  const [reason, setReason] = useState('');
  const [newNote, setNewNote] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = () => {
    setLoading(true);
    const request = queueOnly ? adminGetModerationQueue() : adminGetListings({ page: 1, search, status });
    request
      .then((res) => setListings(queueOnly ? (res.data || []) : (res.data.listings || [])))
      .catch((e) => showToast(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [search, status, queueOnly]);

  const openDetail = async (listing) => {
    setDetailListing(listing);
    const res = await adminGetListingInsights(listing.id).catch((e) => {
      showToast(e.message);
      return null;
    });
    if (res) {
      setDetail(res.data);
      setModerationStatus(res.data.listing.moderation_status || 'approved');
      setReason('');
    }
  };

  const saveListing = async (extra = {}) => {
    if (!detailListing) return;
    try {
      await adminManageListing({
        listing_id: detailListing.id,
        moderation_status: moderationStatus,
        reason,
        critical_confirmed: true,
        ...extra,
      });
      showToast('İlan güncellendi.');
      openDetail(detailListing);
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !detailListing) return;
    try {
      await adminSaveEntityNote({
        entity_type: 'listing',
        entity_id: detailListing.id,
        note: newNote,
        color: 'orange',
      });
      setNewNote('');
      openDetail(detailListing);
    } catch (e) {
      showToast(e.message);
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const bulkModerate = async (nextStatus) => {
    if (!selectedIds.length) {
      showToast('Önce ilan seçin.');
      return;
    }
    try {
      await adminBulkUpdateListings({
        listing_ids: selectedIds,
        bulk_action: 'moderate',
        moderation_status: nextStatus,
        critical_confirmed: true,
      });
      setSelectedIds([]);
      showToast('Toplu moderasyon tamamlandı.');
      load();
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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Başlık veya satıcı ara..." className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl">
            <option value="">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="pending">Bekliyor</option>
            <option value="sold">Satıldı</option>
            <option value="removed">Kaldırıldı</option>
          </select>
          <button onClick={() => setQueueOnly((prev) => !prev)} className={`px-3 py-2 rounded-xl text-sm font-bold ${queueOnly ? 'bg-orange-50 text-orange-600' : 'bg-white border border-gray-200 text-gray-600'}`}>
            <ShieldAlert size={14} className="inline mr-2" /> Moderasyon Kuyruğu
          </button>
          <div className="flex gap-2">
            <button onClick={() => bulkModerate('approved')} className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold">Toplu Onay</button>
            <button onClick={() => bulkModerate('flagged')} className="flex-1 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold">Flagle</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Seç</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">İlan</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Satıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fiyat</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Moderasyon</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
                ) : listings.map((listing) => (
                  <tr key={listing.id} className={`border-t border-gray-50 hover:bg-gray-50/50 ${listing.moderation_status === 'flagged' ? 'bg-red-50/20' : ''}`}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(listing.id)} onChange={() => toggleSelected(listing.id)} /></td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900 max-w-[220px] truncate">{listing.title}</div>
                      <div className="text-xs text-gray-400">#{listing.id}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{listing.seller}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{fmtMoney(listing.price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${listing.moderation_status === 'flagged' ? 'bg-red-50 text-red-600' : listing.moderation_status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {listing.moderation_status || 'approved'}
                        </span>
                        {(listing.moderation_flags_list || []).slice(0, 2).map((flag) => (
                          <span key={flag} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{flag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openDetail(listing)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Eye size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {detailListing && detail && (
        <Modal title={`İlan #${detailListing.id} · Moderasyon Merkezi`} onClose={() => { setDetailListing(null); setDetail(null); }}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="font-bold text-gray-900 mb-2">{detail.listing.title}</div>
                <div className="text-sm text-gray-500 mb-2">{detail.listing.description || 'Açıklama yok.'}</div>
                <div className="font-extrabold text-emerald-600">{fmtMoney(detail.listing.price)}</div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={16} className="text-orange-600" />
                  <span className="font-bold text-gray-900">Şablon İhlali ve Anomali</span>
                </div>
                <div className="space-y-2">
                  {(detail.flags || []).map((flag) => (
                    <div key={flag} className="text-sm text-orange-700 bg-orange-50 rounded-xl px-3 py-2">{flag}</div>
                  ))}
                  {detail.anomaly_reason && (
                    <div className="text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2">
                      {detail.anomaly_reason} · %{Number(detail.anomaly_ratio || 0).toFixed(2)}
                    </div>
                  )}
                  {!detail.flags?.length && !detail.anomaly_reason && (
                    <div className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">Ek risk sinyali bulunamadı.</div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tags size={16} className="text-violet-600" />
                  <span className="font-bold text-gray-900">Moderasyon Kararı</span>
                </div>
                <select value={moderationStatus} onChange={(e) => setModerationStatus(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3">
                  <option value="approved">approved</option>
                  <option value="pending">pending</option>
                  <option value="flagged">flagged</option>
                </select>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Karar notu veya revizyon sebebi..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                  <button onClick={() => saveListing()} className="px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold">Kaydet</button>
                  <button onClick={() => saveListing({ status: 'removed' })} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold">Kaldır</button>
                  <button onClick={() => saveListing({ delete: true, critical_confirmed: true })} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">Sil</button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="font-bold text-gray-900 mb-3 flex items-center gap-2"><History size={16} className="text-violet-600" /> Revizyon Geçmişi</div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {(detail.revisions || []).map((revision) => (
                    <div key={revision.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="font-semibold text-gray-800">{revision.reason || 'Admin güncellemesi'}</div>
                      <div className="text-xs text-gray-400 mt-1">{revision.admin_name} · {new Date(revision.created_at).toLocaleString('tr-TR')}</div>
                      <div className="text-xs text-gray-500 mt-2">Eski fiyat: {fmtMoney(revision.snapshot?.price)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="font-bold text-gray-900 mb-3">İç Notlar</div>
                <div className="flex gap-2 mb-3">
                  <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} placeholder="Moderasyon notu..." className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
                  <button onClick={addNote} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold">Ekle</button>
                </div>
                <div className="space-y-2">
                  {(detail.notes || []).map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-400">{note.admin_name} · {new Date(note.created_at).toLocaleString('tr-TR')}</div>
                      <div className="text-sm text-gray-700 mt-1">{note.note}</div>
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
