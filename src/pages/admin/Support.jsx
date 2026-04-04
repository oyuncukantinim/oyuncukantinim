import { useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  LifeBuoy,
  MessageSquare,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  UserCircle2,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetSupportTicket,
  adminGetSupportTickets,
  adminReplySupportTicket,
  adminUpdateSupportTicket,
} from '../../lib/adminApi';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Açık', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
  { value: 'in_review', label: 'İnceleniyor', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { value: 'waiting_user', label: 'Kullanıcı Yanıtı Bekleniyor', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  { value: 'resolved', label: 'Çözüldü', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  { value: 'closed', label: 'Kapalı', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Düşük' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Yüksek' },
  { value: 'critical', label: 'Kritik' },
];

function formatDateTime(value) {
  if (!value) return 'Tarih yok';
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusMeta(status) {
  return STATUS_OPTIONS.find((item) => item.value === status) || STATUS_OPTIONS[0];
}

function StatusBadge({ status, compact = false }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center rounded-full font-extrabold ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'} ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function SummaryCard({ title, value, tone, compact = false }) {
  return (
    <div className={`rounded-[22px] border border-slate-200 bg-white shadow-sm ${compact ? 'p-2.5' : 'p-4'}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{title}</div>
      <div className={`${compact ? 'mt-1 text-[17px]' : 'mt-2 text-2xl'} font-black ${tone}`}>{value}</div>
    </div>
  );
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}

function orderStatusLabel(status, deliveryStatus) {
  if (status === 'refunded') return 'İade';
  if (status === 'cancelled') return 'İptal';
  if (Number(deliveryStatus) === 3) return 'Anlaşmazlık';
  if (Number(deliveryStatus) === 2) return 'Tamamlandı';
  if (Number(deliveryStatus) === 1) return 'Teslim Edildi';
  if (Number(deliveryStatus) === 0) return 'Teslimat Bekleniyor';
  if (status === 'pending') return 'Bekliyor';
  return 'Bekliyor';
}

function listingLifecycleMeta(item) {
  const status = item?.status;
  const expiresAt = item?.expires_at ? new Date(item.expires_at).getTime() : null;

  if ((status === 'active' || !status) && expiresAt && expiresAt < Date.now()) {
    return ['İlan Süresi Doldu', 'bg-slate-100 text-slate-700 border border-slate-200'];
  }
  if (status === 'expired') return ['İlan Süresi Doldu', 'bg-slate-100 text-slate-700 border border-slate-200'];
  if (status === 'passive') return ['İlan Pasifleştirildi', 'bg-amber-50 text-amber-700 border border-amber-200'];
  if (status === 'active') return ['İlan Aktif', 'bg-emerald-50 text-emerald-700 border border-emerald-200'];
  if (status === 'pending') return ['Onay Bekliyor', 'bg-blue-50 text-blue-700 border border-blue-200'];
  if (status === 'draft') return ['Taslak', 'bg-slate-100 text-slate-600 border border-slate-200'];
  if (status === 'rejected') return ['Reddedildi', 'bg-rose-50 text-rose-700 border border-rose-200'];
  if (status === 'sold') return ['İlan Aktif Değil', 'bg-slate-100 text-slate-700 border border-slate-200'];
  return ['Durum Belirsiz', 'bg-slate-100 text-slate-600 border border-slate-200'];
}

function ListingLifecycleBadge({ item }) {
  const [label, className] = listingLifecycleMeta(item);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${className}`}>
      {label}
    </span>
  );
}

function TicketMessage({ message }) {
  const isAdmin = message.author_role === 'admin';
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${isAdmin ? 'bg-violet-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
        <div className={`mb-1 flex items-center gap-2 text-[11px] font-bold ${isAdmin ? 'text-white/80' : 'text-slate-500'}`}>
          {isAdmin ? <ShieldCheck size={12} /> : <UserCircle2 size={12} />}
          <span>{message.author_name || (isAdmin ? 'Admin' : 'Kullanıcı')}</span>
          <span className={isAdmin ? 'text-white/60' : 'text-slate-400'}>•</span>
          <span className={isAdmin ? 'text-white/60' : 'text-slate-400'}>{formatDateTime(message.created_at)}</span>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{message.message}</p>
      </div>
    </div>
  );
}

function RelatedListingsTable({ rows, scope }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
        Bu talebe bağlı ilan bulunmuyor.
      </div>
    );
  }

  const scopeLabel = {
    purchased: 'Satın Alınan',
    sold: 'Satılan',
    mine: 'İlanlarım',
  }[scope] || 'Seçili İlanlar';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <div className="text-sm font-black text-slate-900">Bağlı İlanlar</div>
          <div className="text-xs text-slate-500">{scopeLabel} grubundan seçilen kayıtlar</div>
        </div>
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-extrabold text-violet-700">{rows.length} ilan</span>
      </div>
      <div className="overflow-x-auto">
        {scope === 'purchased' ? (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Sipariş No</th>
                <th className="px-4 py-3">Görsel</th>
                <th className="px-4 py-3">İlan Adı</th>
                <th className="px-4 py-3">Satıcı</th>
                <th className="px-4 py-3">Fiyat</th>
                <th className="px-4 py-3">Sipariş Durumu</th>
                <th className="px-4 py-3">Sipariş Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={`${item.id}-${item.order_id || 'listing'}`} className="border-t border-slate-200/80">
                  <td className="px-4 py-3 font-black text-slate-500">{item.order_id || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-200">
                      {item.item_image ? <img src={item.item_image} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><ShoppingBag size={18} /></div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">{item.title || `İlan ${item.id}`}</td>
                  <td className="px-4 py-3 text-slate-600">{item.seller_name || '-'}</td>
                  <td className="px-4 py-3 font-extrabold text-emerald-600">{formatMoney(item.price)}</td>
                  <td className="px-4 py-3 text-slate-600">{orderStatusLabel(item.order_status, item.delivery_status)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(item.order_created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {scope === 'sold' ? (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Sipariş No</th>
                <th className="px-4 py-3">Görsel</th>
                <th className="px-4 py-3">İlan Adı</th>
                <th className="px-4 py-3">Alıcı</th>
                <th className="px-4 py-3">Fiyat</th>
                <th className="px-4 py-3">Sipariş Durumu</th>
                <th className="px-4 py-3">Sipariş Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={`${item.id}-${item.order_id || 'listing'}`} className="border-t border-slate-200/80">
                  <td className="px-4 py-3 font-black text-slate-500">{item.order_id || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-200">
                      {item.item_image ? <img src={item.item_image} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><ShoppingBag size={18} /></div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">{item.title || `İlan ${item.id}`}</td>
                  <td className="px-4 py-3 text-slate-600">{item.buyer_name || '-'}</td>
                  <td className="px-4 py-3 font-extrabold text-emerald-600">{formatMoney(item.price)}</td>
                  <td className="px-4 py-3 text-slate-600">{orderStatusLabel(item.order_status, item.delivery_status)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(item.order_created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {scope === 'mine' ? (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">İlan No</th>
                <th className="px-4 py-3">Görsel</th>
                <th className="px-4 py-3">İlan Adı</th>
                <th className="px-4 py-3">Fiyat</th>
                <th className="px-4 py-3">İlan Durumu</th>
                <th className="px-4 py-3">Son Güncelleme</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-t border-slate-200/80">
                  <td className="px-4 py-3 font-black text-slate-500">{item.id || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-200">
                      {item.item_image ? <img src={item.item_image} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><ShoppingBag size={18} /></div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">{item.title || `İlan ${item.id}`}</td>
                  <td className="px-4 py-3 font-extrabold text-emerald-600">{formatMoney(item.price)}</td>
                  <td className="px-4 py-3"><ListingLifecycleBadge item={item} /></td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(item.last_updated_at || item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    assigned_admin_id: '',
  });
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({ all: 0, open: 0, in_review: 0, waiting_user: 0, resolved: 0, closed: 0 });
  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [selectedListings, setSelectedListings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [replying, setReplying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [metaDraft, setMetaDraft] = useState({
    status: 'open',
    priority: 'normal',
    assigned_admin_id: '',
    internal_note: '',
  });
  const [replyMessage, setReplyMessage] = useState('');

  const loadTickets = async (preferredId = null) => {
    setLoadingList(true);
    try {
      const response = await adminGetSupportTickets(filters);
      const rows = response.data?.tickets || [];
      setTickets(rows);
      setSummary(response.data?.summary || { all: 0, open: 0, in_review: 0, waiting_user: 0, resolved: 0, closed: 0 });
      setCategories(response.data?.categories || []);
      setAdmins(response.data?.admins || []);
      const nextId = preferredId || selectedId;
      const stillExists = rows.find((ticket) => String(ticket.id) === String(nextId));
      const fallback = rows[0]?.id || null;
      setSelectedId(stillExists ? stillExists.id : fallback);
    } catch {
      setTickets([]);
    } finally {
      setLoadingList(false);
    }
  };

  const loadDetail = async (ticketId) => {
    if (!ticketId) {
      setDetail(null);
      setSelectedListings([]);
      setMessages([]);
      return;
    }

    setLoadingDetail(true);
    try {
      const response = await adminGetSupportTicket(ticketId);
      const ticket = response.data?.ticket || null;
      setDetail(ticket);
      setSelectedListings(response.data?.selected_listings || []);
      setMessages(response.data?.messages || []);
      setAdmins(response.data?.admins || []);
      setMetaDraft({
        status: ticket?.status || 'open',
        priority: ticket?.priority || 'normal',
        assigned_admin_id: ticket?.assigned_admin_id ? String(ticket.assigned_admin_id) : '',
        internal_note: ticket?.internal_note || '',
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filters.status, filters.category, filters.assigned_admin_id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets();
    }, 250);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setSelectedListings([]);
      setMessages([]);
      setSettingsOpen(false);
      return;
    }
    loadDetail(selectedId);
  }, [selectedId]);

  const relatedListingRows = useMemo(() => {
    if (selectedListings.length) return selectedListings;
    if (!detail?.related_listing_id) return [];
    return [{
      id: detail.related_listing_id,
      title: detail.related_listing_title || `İlan ${detail.related_listing_id}`,
      price: detail.related_listing_price || 0,
      status: detail.related_listing_status || '-',
      updated_at: detail.updated_at,
      last_updated_at: detail.updated_at,
      item_image: detail.related_listing_image || '',
    }];
  }, [detail, selectedListings]);

  const categoryLabels = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.value, category.label])),
    [categories],
  );

  const filteredStatusChips = useMemo(() => (
    [
      { id: '', label: 'Tümü', count: summary.all || 0 },
      { id: 'open', label: 'Açık', count: summary.open || 0 },
      { id: 'in_review', label: 'İnceleniyor', count: summary.in_review || 0 },
      { id: 'waiting_user', label: 'Bekleyen', count: summary.waiting_user || 0 },
      { id: 'resolved', label: 'Çözüldü', count: summary.resolved || 0 },
      { id: 'closed', label: 'Kapalı', count: summary.closed || 0 },
    ]
  ), [summary]);

  const handleSaveMeta = async () => {
    if (!detail) return;
    setSavingMeta(true);
    try {
      await adminUpdateSupportTicket({
        ticket_id: detail.id,
        status: metaDraft.status,
        priority: metaDraft.priority,
        assigned_admin_id: metaDraft.assigned_admin_id || null,
        internal_note: metaDraft.internal_note,
      });
      await loadTickets(detail.id);
      await loadDetail(detail.id);
    } finally {
      setSavingMeta(false);
    }
  };

  const handleReply = async (event) => {
    event.preventDefault();
    if (!detail || !replyMessage.trim()) return;
    setReplying(true);
    try {
      await adminReplySupportTicket({ ticket_id: detail.id, message: replyMessage.trim() });
      setReplyMessage('');
      await loadTickets(detail.id);
      await loadDetail(detail.id);
    } finally {
      setReplying(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <section className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6 text-white shadow-xl shadow-slate-900/10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-100">
                <LifeBuoy size={13} />
                Destek Sistemi
              </div>
              <h1 className="text-3xl font-black tracking-tight">İlan odaklı destek taleplerini tek akışta yönet</h1>
              <p className="mt-2 text-sm leading-6 text-violet-100/80">
                Kullanıcı cevapları, seçilmiş ilanlar ve iç notlar tek panelde. Durum değişimlerinde bildirim gitmez; yalnızca yeni talep ve yeni yanıt için bildirim üretilir.
              </p>
            </div>
            <div className="grid min-w-[280px] grid-cols-3 gap-3">
              <SummaryCard title="Toplam" value={summary.all || 0} tone="text-slate-900" />
              <SummaryCard title="Açık" value={(summary.open || 0) + (summary.in_review || 0)} tone="text-rose-600" />
              <SummaryCard title="Yanıt Bekleyen" value={summary.waiting_user || 0} tone="text-blue-600" />
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Talep Listesi</h2>
                <p className="text-xs text-slate-500">Kullanıcı, bilet no veya konuya göre filtrele.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-500">{tickets.length} kayıt</span>
            </div>

            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Ara..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
              />
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {filteredStatusChips.map((item) => (
                <button
                  key={item.id || 'all'}
                  onClick={() => setFilters((prev) => ({ ...prev, status: item.id }))}
                  className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors ${filters.status === item.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {item.label} {item.count ? `(${item.count})` : ''}
                </button>
              ))}
            </div>

            <div className="mb-3 grid gap-2">
              <select
                value={filters.category}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
              >
                <option value="">Tüm kategoriler</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>

              <select
                value={filters.assigned_admin_id}
                onChange={(event) => setFilters((prev) => ({ ...prev, assigned_admin_id: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
              >
                <option value="">Tüm atamalar</option>
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>{admin.username}</option>
                ))}
              </select>
            </div>

            <div className="max-h-[760px] space-y-2 overflow-y-auto pr-1">
              {loadingList ? (
                <div className="py-10 text-center text-sm font-semibold text-slate-400">Talepler yükleniyor...</div>
              ) : tickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                  Bu filtrede destek talebi bulunamadı.
                </div>
              ) : tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${String(selectedId) === String(ticket.id) ? 'border-violet-300 bg-violet-50 shadow-sm' : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50'}`}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{ticket.ticket_no}</div>
                      <div className="mt-1 truncate text-[13px] font-black text-slate-900">{ticket.subject}</div>
                    </div>
                    <StatusBadge status={ticket.status} compact />
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-500">{ticket.username}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-500">{categoryLabels[ticket.category] || 'Destek'}</span>
                    {ticket.selected_listing_count ? <span className="rounded-full bg-violet-50 px-2 py-1 font-bold text-violet-700">{ticket.selected_listing_count} ilan</span> : null}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>{formatDateTime(ticket.last_reply_at || ticket.created_at)}</span>
                    {ticket.assigned_admin_name ? <span>{ticket.assigned_admin_name}</span> : <span>Atanmadı</span>}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            {!selectedId ? (
              <div className="flex min-h-[720px] flex-col items-center justify-center gap-4 text-center text-slate-400">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
                  <LifeBuoy size={28} className="text-slate-300" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-500">Bir bilet seç</h2>
                  <p className="mt-1 text-sm">Soldaki listeden bir destek talebi açarak ayrıntıya geçebilirsin.</p>
                </div>
              </div>
            ) : loadingDetail || !detail ? (
              <div className="flex min-h-[720px] items-center justify-center text-sm font-semibold text-slate-400">
                Destek talebi yükleniyor...
              </div>
            ) : (
              <div className="flex min-h-[720px] flex-col">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                          {detail.ticket_no}
                        </span>
                        <StatusBadge status={detail.status} />
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-500">
                          {PRIORITY_OPTIONS.find((item) => item.value === detail.priority)?.label || 'Normal'}
                        </span>
                      </div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950">{detail.subject}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <UserCircle2 size={14} />
                          {detail.username}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={14} />
                          {formatDateTime(detail.created_at)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare size={14} />
                          {messages.length} mesaj
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-1.5 sm:grid-cols-2 xl:min-w-[330px]">
                      <SummaryCard title="Kullanıcı" value={detail.username || '-'} tone="text-slate-900" compact />
                      <div className="flex items-stretch gap-1.5">
                        <div className="min-w-0 flex-1 rounded-[22px] border border-slate-200 bg-white p-2.5 shadow-sm">
                          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Atanan</div>
                          <div className="mt-1 truncate text-[17px] font-black text-violet-600">{detail.assigned_admin_name || 'Atanmadı'}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettingsOpen(true)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-[18px] border border-violet-200 bg-violet-50 px-2.5 py-2 text-[12px] font-black text-violet-700 transition-colors hover:bg-violet-100"
                        >
                          <Settings2 size={14} />
                          Ayarlar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="min-w-0">
                      <RelatedListingsTable rows={relatedListingRows} scope={detail.related_scope} />
                    </div>
                  </div>
                </div>

                <div className="py-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900">Yazışma Geçmişi</h3>
                    <span className="text-xs font-semibold text-slate-400">{messages.length} mesaj</span>
                  </div>
                  <div className="h-[360px] space-y-3 overflow-y-auto rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                    {messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Bu destekte henüz mesaj yok.
                      </div>
                    ) : messages.map((message) => (
                      <TicketMessage key={message.id} message={message} />
                    ))}
                  </div>
                </div>

                <form onSubmit={handleReply} className="border-t border-slate-100 pt-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                    <textarea
                      rows={4}
                      value={replyMessage}
                      onChange={(event) => setReplyMessage(event.target.value)}
                      placeholder="Kullanıcıya yazılacak yanıtı gir..."
                      className="w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-200"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-400">
                        Bu yanıt kullanıcıya bildirim üretir. Durum değişiklikleri ve kapanış için bildirim gönderilmez.
                      </div>
                      <button
                        type="submit"
                        disabled={replying || !replyMessage.trim()}
                        className="inline-flex flex-shrink-0 items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send size={15} />
                        {replying ? 'Gönderiliyor...' : 'Yanıt Gönder'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
      {settingsOpen && detail ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Yönetim ayarlarını kapat"
            onClick={() => setSettingsOpen(false)}
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <div className="text-sm font-black text-slate-900">Yönetim Ayarları</div>
                <div className="text-xs text-slate-500">{detail.ticket_no} için moderasyon ve atama alanı</div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Durum</label>
                <select
                  value={metaDraft.status}
                  onChange={(event) => setMetaDraft((prev) => ({ ...prev, status: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Öncelik</label>
                <select
                  value={metaDraft.priority}
                  onChange={(event) => setMetaDraft((prev) => ({ ...prev, priority: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Atanan Admin</label>
                <select
                  value={metaDraft.assigned_admin_id}
                  onChange={(event) => setMetaDraft((prev) => ({ ...prev, assigned_admin_id: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
                >
                  <option value="">Atama yok</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>{admin.username}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">İç Not</label>
                <textarea
                  rows={8}
                  value={metaDraft.internal_note}
                  onChange={(event) => setMetaDraft((prev) => ({ ...prev, internal_note: event.target.value }))}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
                  placeholder="Yalnızca admin panelinde görünür."
                />
              </div>

              <button
                type="button"
                onClick={handleSaveMeta}
                disabled={savingMeta}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Settings2 size={15} />
                {savingMeta ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </AdminLayout>
  );
}
