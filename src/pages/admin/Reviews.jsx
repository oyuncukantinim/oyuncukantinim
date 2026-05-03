import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Search, Star, Trash2, XCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminDeleteReview, adminGetReviews, adminUpdateReviewStatus } from '../../lib/adminApi';

const TABS = [
  { key: 'listing', label: 'İlan Pazarı Yorumları' },
  { key: 'product', label: 'Oyuncu Kantinim Yorumları' },
];

const STATUS_META = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABEL = {
  pending: 'Onay Bekliyor',
  approved: 'Yayında',
  rejected: 'Reddedildi',
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('listing');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    adminGetReviews({ page, search, type: activeTab })
      .then((r) => {
        setReviews(r.data?.reviews || []);
        setTotal(Number(r.data?.total || 0));
        setPages(Number(r.data?.pages || 1));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, activeTab]);

  useEffect(() => { load(); }, [load]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yorumu sil?')) return;
    try {
      await adminDeleteReview(id);
      showToast('Yorum silindi.');
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleStatus = async (reviewId, status) => {
    try {
      await adminUpdateReviewStatus({ review_id: reviewId, status });
      showToast('Yorum durumu güncellendi.');
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('tr-TR') : '-');
  const isProductTab = activeTab === 'product';

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">{toast}</div>}

      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex rounded-2xl border border-gray-100 bg-gray-50 p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => switchTab(tab.key)}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                    activeTab === tab.key
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-500 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Yorumcu, ürün, satıcı veya yorum ara..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-violet-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="font-extrabold text-gray-800">{isProductTab ? 'Oyuncu Kantinim Yorumları' : 'İlan Pazarı Yorumları'}</h3>
              <p className="mt-0.5 text-xs font-semibold text-gray-400">
                {isProductTab ? 'Site ürünü yorumları onaydan sonra yayına alınır.' : 'İlan siparişi sonrası satıcı değerlendirmeleri.'}
              </p>
            </div>
            <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-black text-gray-500">{total} yorum</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Yorumcu</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">{isProductTab ? 'Ürün' : 'Satıcı'}</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 sm:table-cell">Puan</th>
                  {isProductTab && <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Durum</th>}
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Yorum</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 lg:table-cell">Tarih</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isProductTab ? 7 : 6} className="px-4 py-8 text-center text-gray-400">Yükleniyor...</td></tr>
                ) : reviews.length === 0 ? (
                  <tr><td colSpan={isProductTab ? 7 : 6} className="px-4 py-8 text-center text-gray-400">Yorum bulunamadı.</td></tr>
                ) : reviews.map((r) => (
                  <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-800">{r.reviewer || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="max-w-[220px] truncate font-semibold">{isProductTab ? (r.item_title || '-') : (r.seller || '-')}</div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < Number(r.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'} />
                        ))}
                        <span className="ml-1 text-xs font-bold text-gray-600">{r.rating}</span>
                      </div>
                    </td>
                    {isProductTab && (
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${STATUS_META[r.status] || STATUS_META.pending}`}>
                          {STATUS_LABEL[r.status] || r.status || 'Onay Bekliyor'}
                        </span>
                      </td>
                    )}
                    <td className="max-w-[260px] px-4 py-3 text-gray-600">
                      <p className="truncate text-xs">{r.comment || '-'}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-gray-400 lg:table-cell">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isProductTab && r.status !== 'approved' ? (
                          <button onClick={() => handleStatus(r.id, 'approved')} className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600" title="Onayla">
                            <CheckCircle2 size={15} />
                          </button>
                        ) : null}
                        {isProductTab && r.status !== 'rejected' ? (
                          <button onClick={() => handleStatus(r.id, 'rejected')} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Reddet">
                            <XCircle size={15} />
                          </button>
                        ) : null}
                        <button onClick={() => handleDelete(r.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Sil">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <span className="text-xs text-gray-500">Sayfa {page} / {pages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
