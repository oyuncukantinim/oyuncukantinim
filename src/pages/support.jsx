import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock3,
  LifeBuoy,
  Plus,
  Search,
  Send,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  closeSupportTicket,
  createSupportTicket,
  getMySupportTickets,
  getSupportMeta,
  getSupportTicket,
  replySupportTicket,
} from '../lib/api';

const STATUS_CONFIG = {
  open: { label: 'Açık', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
  in_review: { label: 'İnceleniyor', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  waiting_user: { label: 'Yanıt Bekliyor', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  resolved: { label: 'Çözüldü', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  closed: { label: 'Kapalı', className: 'bg-slate-100 text-slate-700 border border-slate-200' },
};

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
  return STATUS_CONFIG[status] || STATUS_CONFIG.open;
}

function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function SummaryCard({ title, value, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{title}</div>
      <div className={`mt-2 text-2xl font-black ${tone}`}>{value}</div>
    </div>
  );
}

function TicketMessage({ message }) {
  const isAdmin = message.author_role === 'admin';
  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${isAdmin ? 'bg-white border border-slate-200 text-slate-700' : 'bg-violet-600 text-white'}`}>
        <div className={`mb-1 flex items-center gap-2 text-[11px] font-bold ${isAdmin ? 'text-slate-500' : 'text-white/80'}`}>
          {isAdmin ? <LifeBuoy size={12} /> : <UserCircle2 size={12} />}
          <span>{message.author_name || (isAdmin ? 'Destek Ekibi' : 'Siz')}</span>
          <span className={`${isAdmin ? 'text-slate-400' : 'text-white/70'}`}>•</span>
          <span className={`${isAdmin ? 'text-slate-400' : 'text-white/70'}`}>{formatDateTime(message.created_at)}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">{message.message}</p>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useCart();

  const [meta, setMeta] = useState({ categories: [], orders: [], listings: [] });
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({ all: 0, open: 0, in_review: 0, waiting_user: 0, resolved: 0, closed: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creating, setCreating] = useState(false);
  const [replying, setReplying] = useState(false);
  const [closing, setClosing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [form, setForm] = useState({
    subject: '',
    category: 'order',
    related_order_id: '',
    related_listing_id: '',
    message: '',
  });

  useEffect(() => {
    if (!user) navigate('/login');
  }, [navigate, user]);

  const loadMeta = async () => {
    setLoadingMeta(true);
    try {
      const response = await getSupportMeta();
      setMeta(response.data || { categories: [], orders: [], listings: [] });
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoadingMeta(false);
    }
  };

  const loadTickets = async (preferredId = null) => {
    setLoadingTickets(true);
    try {
      const response = await getMySupportTickets();
      const rows = response.data?.tickets || [];
      setTickets(rows);
      setSummary(response.data?.summary || { all: 0, open: 0, in_review: 0, waiting_user: 0, resolved: 0, closed: 0 });
      const nextId = preferredId || selectedId;
      const stillExists = rows.find((ticket) => String(ticket.id) === String(nextId));
      const fallback = rows[0]?.id || null;
      setSelectedId(stillExists ? stillExists.id : fallback);
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadTicketDetail = async (ticketId) => {
    if (!ticketId) {
      setSelectedTicket(null);
      setMessages([]);
      return;
    }

    setLoadingDetail(true);
    try {
      const response = await getSupportTicket(ticketId);
      setSelectedTicket(response.data?.ticket || null);
      setMessages(response.data?.messages || []);
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadMeta();
    loadTickets();
  }, [user]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedTicket(null);
      setMessages([]);
      return;
    }
    loadTicketDetail(selectedId);
  }, [selectedId]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
      const keyword = search.trim().toLowerCase();
      const matchesSearch = !keyword
        || ticket.ticket_no?.toLowerCase().includes(keyword)
        || ticket.subject?.toLowerCase().includes(keyword)
        || ticket.last_message?.toLowerCase().includes(keyword);
      return matchesStatus && matchesSearch;
    });
  }, [tickets, filterStatus, search]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await createSupportTicket({
        ...form,
        related_order_id: form.related_order_id || null,
        related_listing_id: form.related_listing_id || null,
      });
      showToast('Destek talebin oluşturuldu.');
      setForm({
        subject: '',
        category: meta.categories?.[0]?.value || 'order',
        related_order_id: '',
        related_listing_id: '',
        message: '',
      });
      await loadTickets(response.data?.id || null);
    } catch (error) {
      showToast(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async (event) => {
    event.preventDefault();
    if (!selectedTicket) return;
    setReplying(true);
    try {
      await replySupportTicket({ ticket_id: selectedTicket.id, message: replyMessage });
      setReplyMessage('');
      await loadTickets(selectedTicket.id);
      await loadTicketDetail(selectedTicket.id);
      showToast('Yanıtın gönderildi.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setReplying(false);
    }
  };

  const handleClose = async () => {
    if (!selectedTicket) return;
    setClosing(true);
    try {
      await closeSupportTicket(selectedTicket.id);
      showToast('Destek talebi kapatıldı.');
      await loadTickets(selectedTicket.id);
      await loadTicketDetail(selectedTicket.id);
    } catch (error) {
      showToast(error.message);
    } finally {
      setClosing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="rounded-[28px] bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-6 text-white shadow-xl shadow-violet-950/20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-100">
              <LifeBuoy size={13} />
              Destek Merkezi
            </div>
            <h1 className="text-3xl font-black tracking-tight">Sipariş, ilan veya hesap sorunların için hızlı destek</h1>
            <p className="mt-2 text-sm leading-6 text-violet-100/80">
              Talebini oluştur, bilet numarasıyla takip et ve destek ekibiyle aynı ekranda yazış.
            </p>
          </div>
          <div className="grid min-w-[280px] grid-cols-3 gap-3">
            <SummaryCard title="Toplam" value={summary.all || 0} tone="text-slate-900" />
            <SummaryCard title="Açık" value={(summary.open || 0) + (summary.in_review || 0)} tone="text-rose-600" />
            <SummaryCard title="Bekleyen" value={summary.waiting_user || 0} tone="text-blue-600" />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Plus size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Yeni Destek Talebi</h2>
                <p className="text-xs text-slate-500">Öncelik otomatik yönetilir, sana ekstra seçim açmıyoruz.</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Konu</label>
                <input
                  required
                  value={form.subject}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                  placeholder="Kısa bir konu yaz"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Kategori</label>
                <select
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
                >
                  {(meta.categories || []).map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-500">İlgili Sipariş</label>
                  <select
                    value={form.related_order_id}
                    onChange={(event) => setForm((prev) => ({ ...prev, related_order_id: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
                  >
                    <option value="">Sipariş seçmeden devam et</option>
                    {(meta.orders || []).map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.id} • {order.item_title || 'Sipariş'} • {Number(order.amount || 0).toFixed(2)} ₺
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-500">İlgili İlan</label>
                  <select
                    value={form.related_listing_id}
                    onChange={(event) => setForm((prev) => ({ ...prev, related_listing_id: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
                  >
                    <option value="">İlan seçmeden devam et</option>
                    {(meta.listings || []).map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-500">Detay</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="Sorunu olabildiğince net anlat. Gerekirse sipariş akışını da yaz."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={creating || loadingMeta}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                {creating ? 'Oluşturuluyor...' : 'Destek Talebi Oluştur'}
              </button>
            </form>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Biletlerim</h2>
                <p className="text-xs text-slate-500">Tüm destek taleplerini tek listede takip et.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-500">
                {tickets.length} adet
              </span>
            </div>

            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Bilet no veya konu ara"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white"
              />
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Tümü' },
                { id: 'open', label: 'Açık' },
                { id: 'waiting_user', label: 'Bekleyen' },
                { id: 'resolved', label: 'Çözüldü' },
                { id: 'closed', label: 'Kapalı' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilterStatus(item.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${filterStatus === item.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {loadingTickets ? (
                <div className="py-10 text-center text-sm font-semibold text-slate-400">Biletler yükleniyor...</div>
              ) : filteredTickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                  Bu filtrede destek talebi bulunamadı.
                </div>
              ) : filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${String(selectedId) === String(ticket.id) ? 'border-violet-300 bg-violet-50 shadow-sm' : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50'}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{ticket.ticket_no}</div>
                      <div className="mt-1 truncate text-sm font-black text-slate-900">{ticket.subject}</div>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="line-clamp-2 text-xs leading-5 text-slate-500">{ticket.last_message || 'Henüz mesaj yok.'}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>{formatDateTime(ticket.last_reply_at || ticket.created_at)}</span>
                    {ticket.related_title ? <span className="truncate pl-3 text-right">{ticket.related_title}</span> : null}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          {!selectedId ? (
            <div className="flex h-full min-h-[640px] flex-col items-center justify-center gap-4 text-center text-slate-400">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
                <LifeBuoy size={28} className="text-slate-300" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-500">Bir destek talebi seç</h2>
                <p className="mt-1 text-sm">Soldaki listeden bir bilet açarak yazışma detayını görebilirsin.</p>
              </div>
            </div>
          ) : loadingDetail || !selectedTicket ? (
            <div className="flex min-h-[640px] items-center justify-center text-sm font-semibold text-slate-400">
              Destek talebi yükleniyor...
            </div>
          ) : (
            <div className="flex min-h-[640px] flex-col">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                        {selectedTicket.ticket_no}
                      </span>
                      <StatusBadge status={selectedTicket.status} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">{selectedTicket.subject}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={14} />
                        {formatDateTime(selectedTicket.created_at)}
                      </span>
                      {selectedTicket.assigned_admin_name ? (
                        <span className="inline-flex items-center gap-1.5">
                          <LifeBuoy size={14} />
                          {selectedTicket.assigned_admin_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <LifeBuoy size={14} />
                          Atama bekliyor
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedTicket.status !== 'closed' ? (
                    <button
                      onClick={handleClose}
                      disabled={closing}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      {closing ? 'Kapatılıyor...' : 'Talebi Kapat'}
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">İlgili Sipariş</div>
                    {selectedTicket.related_order_id ? (
                      <div>
                        <div className="font-bold text-slate-800">Sipariş {selectedTicket.related_order_id}</div>
                        <div className="mt-1 text-sm text-slate-500">{selectedTicket.related_order_title || 'Sipariş başlığı yok'}</div>
                        {selectedTicket.related_order_amount ? (
                          <div className="mt-2 text-xs font-semibold text-emerald-600">{Number(selectedTicket.related_order_amount).toFixed(2)} ₺</div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">Bu bilet belirli bir siparişe bağlanmadı.</div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">İlgili İlan</div>
                    {selectedTicket.related_listing_id ? (
                      <div>
                        <div className="font-bold text-slate-800">{selectedTicket.related_listing_title || 'İlan'}</div>
                        {selectedTicket.related_listing_price ? (
                          <div className="mt-2 text-xs font-semibold text-emerald-600">{Number(selectedTicket.related_listing_price).toFixed(2)} ₺</div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">Bu bilet belirli bir ilana bağlanmadı.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto py-5">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                    Bu bilette henüz yazışma yok.
                  </div>
                ) : messages.map((message) => (
                  <TicketMessage key={message.id} message={message} />
                ))}
              </div>

              <form onSubmit={handleReply} className="border-t border-slate-100 pt-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <textarea
                    rows={4}
                    value={replyMessage}
                    onChange={(event) => setReplyMessage(event.target.value)}
                    disabled={selectedTicket.status === 'closed'}
                    placeholder={selectedTicket.status === 'closed' ? 'Bu bilet kapalı olduğu için yeni yanıt gönderilemez.' : 'Destek ekibine yanıt yaz...'}
                    className="w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      Durum değişikliklerinde bildirim göndermiyoruz; yalnızca yeni yanıtlar için bilgilendirme yapılır.
                    </div>
                    <button
                      type="submit"
                      disabled={replying || selectedTicket.status === 'closed' || !replyMessage.trim()}
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
  );
}
