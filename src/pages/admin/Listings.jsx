import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight, ExternalLink, Eye, X, Pencil } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetListings, adminUpdateListing, adminDeleteListing } from '../../lib/adminApi';
import { listingSlug } from '../../lib/api';

const STATUS_MAP = {
  active:   { label: 'Aktif',        color: 'emerald' },
  sold:     { label: 'Satıldı',      color: 'blue' },
  expired:  { label: 'Süresi Doldu', color: 'orange' },
  pending:  { label: 'Bekliyor',     color: 'yellow' },
  removed:  { label: 'Kaldırıldı',   color: 'red' },
  inactive: { label: 'Pasif',        color: 'gray' },
};

function ListingDetailModal({ listing, onClose, onRefresh, showToast }) {
  const [form, setForm] = useState({
    title: listing.title,
    price: listing.price,
    status: listing.status,
    description: listing.description || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateListing({ listing_id: listing.id, ...form });
      showToast('İlan güncellendi.');
      onRefresh();
      onClose();
    } catch (e) { showToast(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('İlanı kalıcı olarak sil?')) return;
    setSaving(true);
    try {
      await adminDeleteListing(listing.id);
      showToast('İlan silindi.');
      onRefresh();
      onClose();
    } catch (e) { showToast(e.message); }
    finally { setSaving(false); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString('tr-TR') : '—';

  const handleDeleteListingModal = async (listing) => {
    if (!confirm(`"${listing.title}" ilanını kalıcı olarak sil?`)) return;
    try {
      await adminDeleteListing(listing.id);
      if (selectedListing?.id === listing.id) setSelectedListing(null);
      showToast('İlan silindi.');
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleDeleteListing = async (listing) => {
    if (!confirm(`"${listing.title}" ilanını kalıcı olarak sil?`)) return;
    try {
      await adminDeleteListing(listing.id);
      if (selectedListing?.id === listing.id) setSelectedListing(null);
      showToast('İlan silindi.');
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">İlan #{listing.id}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(listing.created_at)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100"><X size={18} /></button>
        </div>

        {/* Görsel */}
        {listing.images?.[0] && (
          <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
            <img src={listing.images[0]} alt="" className="w-full h-40 object-cover" />
          </div>
        )}

        {/* Bilgi */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Satıcı</span>
            <span className="font-bold text-gray-800">{listing.seller}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Kategori</span>
            <span className="font-semibold text-gray-700">{listing.category || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Oyun</span>
            <span className="font-semibold text-gray-700">{listing.game_name || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Teslimat</span>
            <span className="font-semibold text-gray-700">{listing.delivery_type === 'stock' ? `Stoklu (${listing.stock_count} adet)` : 'Manuel'}</span>
          </div>
          {listing.expires_at && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bitiş</span>
              <span className="font-semibold text-gray-700">{fmtDate(listing.expires_at)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Görüntülenme</span>
            <span className="font-semibold text-gray-700">{listing.view_count || 0}</span>
          </div>
        </div>

        {/* Düzenle */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Başlık</label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Fiyat (₺)</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Durum</label>
              <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400">
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Açıklama</label>
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-400" />
          </div>
        </div>

        <div className="flex gap-2">
          <a href={listingSlug(listing.title, listing.id)} target="_blank" rel="noreferrer" className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl hover:border-gray-300 transition-colors">
            <ExternalLink size={13} /> Görüntüle
          </a>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold py-2 rounded-xl disabled:opacity-50 transition-colors">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button onClick={handleDelete} disabled={saving} className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(() => {
    setLoading(true);
    adminGetListings({ page, search, status: filterStatus })
      .then(r => { setListings(r.data.listings); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleQuickStatus = async (id, status) => {
    try { await adminUpdateListing({ listing_id: id, status }); showToast('Durum güncellendi.'); load(); }
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
                          <div className="min-w-0">
                            <div className="font-bold text-gray-800 max-w-[180px] truncate">{l.title}</div>
                            <div className="text-xs text-gray-400">#{l.id} · {l.delivery_type === 'stock' ? `Stok(${l.stock_count})` : 'Manuel'}</div>
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
                          <button onClick={() => setSelectedListing(l)} title="Detay / Düzenle" className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <a href={listingSlug(l.title, l.id)} target="_blank" rel="noreferrer" title="Görüntüle" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                            <ExternalLink size={14} />
                          </a>
                          {l.status !== 'active' && (
                            <button onClick={() => handleQuickStatus(l.id, 'active')} title="Aktifleştir" className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {l.status === 'active' && (
                            <button onClick={() => handleQuickStatus(l.id, 'removed')} title="Kaldır" className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500">
                              <XCircle size={14} />
                            </button>
                          )}
                          <button onClick={() => handleDeleteListing(l)} title="Sil" className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600">
                            <Trash2 size={14} />
                          </button>
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

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onRefresh={load}
          showToast={showToast}
        />
      )}
    </AdminLayout>
  );
}
