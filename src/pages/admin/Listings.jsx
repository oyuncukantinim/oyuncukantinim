import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetListings, adminUpdateListing, adminDeleteListing } from '../../lib/adminApi';
import { listingSlug } from '../../lib/api';

const STATUS_MAP = {
  active:   { label: 'Aktif',       color: 'emerald' },
  sold:     { label: 'Satıldı',     color: 'gray' },
  pending:  { label: 'Bekliyor',    color: 'yellow' },
  removed:  { label: 'Kaldırıldı', color: 'red' },
};

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    adminGetListings({ page, search, status: filterStatus })
      .then(r => { setListings(r.data.listings); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id, status) => {
    try { await adminUpdateListing({ listing_id: id, status }); showToast('Durum güncellendi.'); load(); }
    catch (e) { showToast(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('İlanı kalıcı olarak sil?')) return;
    try { await adminDeleteListing(id); showToast('İlan silindi.'); load(); }
    catch (e) { showToast(e.message); }
  };

  const fmtMoney = (n) => Number(n || 0).toFixed(2) + ' ₺';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR') : '—';

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Başlık veya satıcı ara..." className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400" />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400">
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-extrabold text-gray-800">İlanlar</h3>
            <span className="text-sm text-gray-500">{total} ilan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">İlan</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Satıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden sm:table-cell">Fiyat</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
                ) : listings.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">İlan bulunamadı.</td></tr>
                ) : listings.map(l => {
                  const { label, color } = STATUS_MAP[l.status] || { label: l.status, color: 'gray' };
                  return (
                    <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {l.images?.[0]
                              ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">—</div>
                            }
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 max-w-[180px] truncate">{l.title}</div>
                            <div className="text-xs text-gray-400">#{l.id} · {l.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{l.seller}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 hidden sm:table-cell">{fmtMoney(l.price)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{fmtDate(l.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold text-${color}-600 bg-${color}-50 px-2 py-1 rounded-full`}>{label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a href={listingSlug(l.title, l.id)} target="_blank" rel="noreferrer" title="Görüntüle" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ExternalLink size={14} /></a>
                          {l.status !== 'active' && <button onClick={() => handleStatus(l.id, 'active')} title="Aktifleştir" className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-500 hover:text-emerald-600"><CheckCircle size={14} /></button>}
                          {l.status === 'active' && <button onClick={() => handleStatus(l.id, 'removed')} title="Kaldır" className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-500 hover:text-orange-500"><XCircle size={14} /></button>}
                          <button onClick={() => handleDelete(l.id)} title="Sil" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
    </AdminLayout>
  );
}
