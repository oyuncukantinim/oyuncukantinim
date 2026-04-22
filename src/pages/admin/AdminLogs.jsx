import { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  RefreshCw,
  Star,
  ShoppingBag,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminDeleteLog,
  adminDeleteLogs,
  adminGetLogs,
  adminGetSuspicious,
  adminGetIpBlacklist,
  adminAddIpBlacklist,
  adminRemoveIpBlacklist,
  adminUpdateUser,
} from '../../lib/adminApi';

const TABS = [
  { id: 'logs', label: 'İşlem Logları', icon: Shield },
  { id: 'suspicious', label: 'Şüpheli Hesaplar', icon: AlertTriangle },
  { id: 'blacklist', label: 'IP Kara Liste', icon: Ban },
];

function fmtDate(dt) {
  if (!dt) return '-';
  return new Date(dt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ACTION_LABELS = {
  user_update: 'Kullanıcı güncelleme',
  withdrawal_update: 'Para çekim talebi güncelleme',
  payment_account_update: 'Çekim hesabı güncelleme',
  payment_account_delete: 'Çekim hesabı silme',
  broadcast: 'Bildirim / duyuru gönderimi',
  ip_blacklist_add: 'IP kara listeye ekleme',
  ip_blacklist_remove: 'IP kara listeden kaldırma',
};

const TARGET_LABELS = {
  user: 'Kullanıcı',
  withdrawal: 'Para çekim talebi',
  payment_account: 'Çekim hesabı',
  ip: 'IP adresi',
};

const STATUS_LABELS = {
  pending: 'Onay bekliyor',
  approved: 'Onaylandı',
  processing: 'İşleniyor',
  completed: 'Tamamlandı',
  rejected: 'Reddedildi',
  cancelled: 'İptal edildi',
};

const SEGMENT_LABELS = {
  all: 'Tüm kullanıcılar',
  buyers: 'Alıcılar',
  sellers: 'Satıcılar',
  active: 'Aktif kullanıcılar',
  banned: 'Banlı kullanıcılar',
};

function formatAction(action) {
  if (!action) return 'Bilinmeyen işlem';
  return ACTION_LABELS[action] || action
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1))
    .join(' ');
}

function formatTarget(log) {
  if (!log?.target_type && !log?.target_id) return '-';
  const label = TARGET_LABELS[log.target_type] || formatAction(log.target_type);
  return log.target_id ? `${label} #${log.target_id}` : label;
}

function humanizeLogDetails(log) {
  const details = String(log?.details || '').trim();
  const target = formatTarget(log);

  if (log?.action === 'user_update') {
    return `${target !== '-' ? target : 'Kullanıcı'} bilgileri ve yetkileri güncellendi.`;
  }

  if (log?.action === 'withdrawal_update') {
    const status = details.match(/talebi\s+([^:]+):/i)?.[1]?.trim();
    const statusLabel = STATUS_LABELS[status] || status;
    return statusLabel
      ? `${target !== '-' ? target : 'Para çekim talebi'} durumu "${statusLabel}" olarak güncellendi.`
      : `${target !== '-' ? target : 'Para çekim talebi'} güncellendi.`;
  }

  if (log?.action === 'payment_account_update') {
    const status = details.match(/hesabı\s+([^:]+):/i)?.[1]?.trim();
    const statusLabel = STATUS_LABELS[status] || status;
    return statusLabel
      ? `${target !== '-' ? target : 'Çekim hesabı'} durumu "${statusLabel}" olarak güncellendi.`
      : `${target !== '-' ? target : 'Çekim hesabı'} güncellendi.`;
  }

  if (log?.action === 'payment_account_delete') {
    return `${target !== '-' ? target : 'Çekim talebi hesabı'} silindi.`;
  }

  if (log?.action === 'broadcast') {
    const singleTitle = details.match(/^Tekil bildirim gönderildi:\s*(.+)$/i)?.[1]?.trim();
    if (singleTitle) return `Kullanıcıya bildirim gönderildi: "${singleTitle}".`;

    const bulk = details.match(/^Toplu duyuru gönderildi\s*\(segment:\s*([^)]+)\):\s*(.+)$/i);
    if (bulk) {
      const segment = SEGMENT_LABELS[bulk[1]?.trim()] || bulk[1]?.trim();
      return `Toplu duyuru gönderildi. Hedef: ${segment}. Başlık: "${bulk[2]?.trim()}".`;
    }
  }

  if (log?.action === 'ip_blacklist_add') {
    return details.replace('IP kara listeye eklendi:', 'Kara listeye eklenen IP:') || 'IP kara listeye eklendi.';
  }

  if (log?.action === 'ip_blacklist_remove') {
    return details.replace('IP kara listeden çıkarıldı', 'Kara listeden çıkarılan IP kaydı') || 'IP kara listeden kaldırıldı.';
  }

  return details || '-';
}

/* ──────────────────────────── LOGS TAB ──────────────────────────── */
function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminGetLogs({ page });
      setLogs(r.data.logs || []);
      setSelectedIds([]);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleDeleteLog = async (log) => {
    if (!window.confirm(`#${log.id} numaralı işlem logu silinsin mi?`)) return;
    setDeletingId(log.id);
    try {
      await adminDeleteLog(log.id);
      showToast('İşlem logu silindi.');
      if (logs.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        load();
      }
    } catch (e) {
      showToast(e.message || 'İşlem logu silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length} işlem logu silinsin mi?`)) return;
    setDeletingId('bulk');
    try {
      await adminDeleteLogs(selectedIds);
      showToast('Seçili işlem logları silindi.');
      load();
    } catch (e) {
      showToast(e.message || 'Seçili loglar silinemedi.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {toast && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">{toast}</div>}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Toplam {total} işlem kaydı · Sayfa başına 20 kayıt</p>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 ? (
            <button onClick={handleBulkDelete} disabled={deletingId === 'bulk'} className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50">
              <Trash2 size={13} /> Seçili Logları Sil ({selectedIds.length})
            </button>
          ) : null}
          <button onClick={load} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <RefreshCw size={13} /> Yenile
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" /></div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">Henüz işlem kaydı yok.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={logs.length > 0 && selectedIds.length === logs.length}
                    onChange={(event) => setSelectedIds(event.target.checked ? logs.map((log) => log.id) : [])}
                  />
                </th>
                <th className="px-4 py-3 text-left">Admin</th>
                <th className="px-4 py-3 text-left">İşlem</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Kayıt</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Detay</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">IP</th>
                <th className="px-4 py-3 text-left">Tarih</th>
                <th className="px-4 py-3 text-right">Sil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(log.id)}
                      onChange={(event) => setSelectedIds((prev) => event.target.checked ? [...prev, log.id] : prev.filter((id) => id !== log.id))}
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{log.admin_username}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-800">{formatAction(log.action)}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-sm font-semibold text-gray-500 lg:table-cell">{formatTarget(log)}</td>
                  <td className="hidden px-4 py-3 text-gray-500 md:table-cell max-w-md">
                    <div className="line-clamp-2" title={humanizeLogDetails(log)}>
                      {humanizeLogDetails(log)}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-gray-400 xl:table-cell">{log.ip_address || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(log)}
                      disabled={deletingId === log.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Logu sil"
                      aria-label="Logu sil"
                    >
                      {deletingId === log.id ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-300 border-t-transparent" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-gray-700">{page} / {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── SUSPICIOUS TAB ──────────────────────────── */
function SuspiciousTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banning, setBanning] = useState(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminGetSuspicious();
      setData(r.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const quickBan = async (userId) => {
    if (!window.confirm('Bu kullanıcıyı banlamak istediğinizden emin misiniz?')) return;
    setBanning(userId);
    try {
      await adminUpdateUser({ user_id: userId, is_banned: 1, ban_reason: 'Şüpheli hesap aktivitesi' });
      showToast('Kullanıcı banlandı.');
      load();
    } catch (e) {
      showToast(e.message);
    } finally {
      setBanning(null);
    }
  };

  const UserRow = ({ u, metric, metricLabel }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-bold text-gray-800 text-sm">{u.username}</div>
        <div className="text-xs text-gray-400 truncate">{u.email}</div>
      </div>
      <div className="text-center">
        <div className="text-lg font-extrabold text-red-600">{metric}</div>
        <div className="text-[10px] text-gray-400">{metricLabel}</div>
      </div>
      <button
        onClick={() => quickBan(u.id)}
        disabled={banning === u.id}
        className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
      >
        <Ban size={13} /> Banla
      </button>
    </div>
  );

  const Section = ({ title, icon: Icon, iconClass, items, renderRow }) => (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-gray-100 ${iconClass}`}>
        <Icon size={16} />
        <span className="font-extrabold text-sm">{title}</span>
        <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold">{items?.length ?? 0}</span>
      </div>
      <div className="p-3 space-y-2">
        {!items?.length ? (
          <p className="text-center text-sm text-gray-400 py-4">Şüpheli hesap tespit edilmedi.</p>
        ) : items.map(renderRow)}
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      {toast && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">{toast}</div>}
      <div className="flex justify-end">
        <button onClick={load} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          <RefreshCw size={13} /> Yenile
        </button>
      </div>

      <Section
        title="Anlaşmazlık Yaşayan Satıcılar"
        icon={AlertTriangle}
        iconClass="bg-orange-50 text-orange-700"
        items={data?.disputed_sellers}
        renderRow={(u) => <UserRow key={u.id} u={u} metric={u.dispute_count} metricLabel="anlaşmazlık" />}
      />
      <Section
        title="Düşük Puanlı Satıcılar"
        icon={Star}
        iconClass="bg-yellow-50 text-yellow-700"
        items={data?.low_rated_sellers}
        renderRow={(u) => <UserRow key={u.id} u={u} metric={Number(u.avg_rating).toFixed(1)} metricLabel="ort. puan" />}
      />
      <Section
        title="Çok İade Alan Alıcılar"
        icon={ShoppingBag}
        iconClass="bg-red-50 text-red-700"
        items={data?.high_refund_buyers}
        renderRow={(u) => <UserRow key={u.id} u={u} metric={u.refund_count} metricLabel="iade" />}
      />
    </div>
  );
}

/* ──────────────────────────── IP BLACKLIST TAB ──────────────────────────── */
function BlacklistTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminGetIpBlacklist();
      setList(r.data.list || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!ip.trim()) { showToast('IP adresi girin.'); return; }
    setAdding(true);
    try {
      await adminAddIpBlacklist({ ip_address: ip.trim(), reason: reason.trim() });
      showToast('IP kara listeye eklendi.');
      setIp(''); setReason('');
      load();
    } catch (e) {
      showToast(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Bu IP\'yi kara listeden kaldırmak istiyor musunuz?')) return;
    try {
      await adminRemoveIpBlacklist(id);
      showToast('IP kara listeden kaldırıldı.');
      load();
    } catch (e) {
      showToast(e.message);
    }
  };

  return (
    <div className="space-y-4">
      {toast && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">{toast}</div>}

      {/* Add form */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
        <h3 className="font-extrabold text-gray-900 text-sm mb-3">IP Adresi Ekle</h3>
        <div className="flex gap-3 flex-wrap">
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="Örn: 192.168.1.1"
            className="flex-1 min-w-[160px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Sebep (opsiyonel)"
            className="flex-1 min-w-[160px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
          />
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50"
          >
            <Plus size={15} /> {adding ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="h-7 w-7 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" /></div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
          Kara listede IP adresi yok.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">IP Adresi</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Sebep</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Eklenme</th>
                <th className="px-4 py-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">{entry.ip_address}</td>
                  <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{entry.reason || '-'}</td>
                  <td className="hidden px-4 py-3 text-gray-400 md:table-cell">{fmtDate(entry.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Kaldır"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── MAIN PAGE ──────────────────────────── */
export default function AdminLogs() {
  const [tab, setTab] = useState('logs');

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Tab navigation */}
        <div className="flex gap-2 border-b border-gray-200 pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-t-xl px-4 py-2 text-sm font-bold transition-all ${
                tab === t.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'logs' && <LogsTab />}
        {tab === 'suspicious' && <SuspiciousTab />}
        {tab === 'blacklist' && <BlacklistTab />}
      </div>
    </AdminLayout>
  );
}
