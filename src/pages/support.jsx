import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  LifeBuoy,
  Package,
  Plus,
  Search,
  Send,
  ShoppingBag,
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

const STATUS = {
  open: ['Açık', 'bg-rose-50 text-rose-700 border border-rose-200'],
  in_review: ['İnceleniyor', 'bg-amber-50 text-amber-700 border border-amber-200'],
  waiting_user: ['Yanıt Bekliyor', 'bg-blue-50 text-blue-700 border border-blue-200'],
  resolved: ['Çözüldü', 'bg-emerald-50 text-emerald-700 border border-emerald-200'],
  closed: ['Kapalı', 'bg-slate-100 text-slate-700 border border-slate-200'],
};

const LISTING_SCOPE_OPTIONS = [
  { value: 'purchased', label: 'Satın Alınan' },
  { value: 'sold', label: 'Satılan' },
  { value: 'mine', label: 'İlanlarım' },
];

const ORDER_CATEGORIES = new Set(['order', 'delivery', 'refund']);
const STEP_TITLES = ['Kategori', 'İlgili Kayıt', 'Detay'];

const fmtDate = (value) => (value ? new Date(value).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Tarih yok');
const fmtMoney = (value) => `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

function StatusBadge({ value }) {
  const [label, style] = STATUS[value] || STATUS.open;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${style}`}>{label}</span>;
}

function SummaryCard({ title, value, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{title}</div>
      <div className={`mt-2 text-2xl font-black ${tone}`}>{value}</div>
    </div>
  );
}

function TicketMessage({ item }) {
  const isAdmin = item.author_role === 'admin';
  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${isAdmin ? 'border border-slate-200 bg-white text-slate-700' : 'bg-violet-600 text-white'}`}>
        <div className={`mb-1 flex items-center gap-2 text-[11px] font-bold ${isAdmin ? 'text-slate-500' : 'text-white/80'}`}>
          {isAdmin ? <LifeBuoy size={12} /> : <UserCircle2 size={12} />}
          <span>{item.author_name || (isAdmin ? 'Destek Ekibi' : 'Siz')}</span>
          <span className={isAdmin ? 'text-slate-400' : 'text-white/70'}>•</span>
          <span className={isAdmin ? 'text-slate-400' : 'text-white/70'}>{fmtDate(item.created_at)}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">{item.message}</p>
      </div>
    </div>
  );
}

function ListingsTable({ rows, title }) {
  if (!rows.length) return null;
  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <div className="text-sm font-black text-slate-900">{title}</div>
          <div className="text-xs text-slate-500">Seçilen ilanlar bu talebe bağlanır.</div>
        </div>
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-extrabold text-violet-700">{rows.length} ilan</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            <tr><th className="px-4 py-3">İlan</th><th className="px-4 py-3">Fiyat</th><th className="px-4 py-3">İlan Durumu</th><th className="px-4 py-3">Son Güncelleme</th></tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
                      {item.item_image ? <img src={item.item_image} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-300"><ShoppingBag size={18} /></div>}
                    </div>
                    <div className="font-bold text-slate-800">{item.title}</div>
                  </div>
                </td>
                <td className="px-4 py-3 font-extrabold text-emerald-600">{fmtMoney(item.price)}</td>
                <td className="px-4 py-3 text-slate-600">{item.status || '-'}</td>
                <td className="px-4 py-3 text-slate-500">{fmtDate(item.last_updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListingCard({ item, selected, onToggle }) {
  return (
    <button type="button" onClick={() => onToggle(item.id)} className={`overflow-hidden rounded-[22px] border text-left transition-all ${selected ? 'border-violet-300 bg-violet-50 shadow-sm' : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50'}`}>
      <div className="relative h-36 overflow-hidden bg-slate-100">
        {item.item_image ? <img src={item.item_image} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-300"><ShoppingBag size={26} /></div>}
        {selected ? <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[11px] font-extrabold text-white"><CheckCircle2 size={12} />Seçildi</span> : null}
      </div>
      <div className="space-y-2 p-3">
        <div className="line-clamp-2 text-sm font-black text-slate-900">{item.title}</div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-extrabold text-emerald-600">{fmtMoney(item.price)}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-500">{item.status || 'Durum yok'}</span>
        </div>
      </div>
    </button>
  );
}

export default function SupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useCart();
  const [meta, setMeta] = useState({ categories: [], orders: [], listing_groups: { purchased: [], sold: [], mine: [] } });
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({ all: 0, open: 0, in_review: 0, waiting_user: 0, resolved: 0, closed: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedListings, setSelectedListings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creating, setCreating] = useState(false);
  const [replying, setReplying] = useState(false);
  const [closing, setClosing] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [form, setForm] = useState({ subject: '', category: 'order', related_order_id: '', related_scope: 'purchased', selected_listing_ids: [], message: '' });

  useEffect(() => { if (!user) navigate('/login'); }, [navigate, user]);

  const showOrderStep = ORDER_CATEGORIES.has(form.category);
  const showListingStep = form.category === 'listing';
  const activeListingPool = meta.listing_groups?.[form.related_scope] || [];
  const selectedListingRows = useMemo(() => {
    const ids = new Set(form.selected_listing_ids.map(Number));
    return activeListingPool.filter((item) => ids.has(Number(item.id)));
  }, [activeListingPool, form.selected_listing_ids]);

  const canAdvance = wizardStep === 0
    ? Boolean(form.category)
    : wizardStep === 1
      ? (showListingStep ? form.selected_listing_ids.length > 0 : true)
      : form.subject.trim().length >= 5 && form.message.trim().length >= 10;

  const loadMeta = async () => {
    setLoadingMeta(true);
    try {
      const response = await getSupportMeta();
      setMeta(response.data || { categories: [], orders: [], listing_groups: { purchased: [], sold: [], mine: [] } });
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
      const found = rows.find((item) => String(item.id) === String(preferredId || selectedId));
      setSelectedId(found ? found.id : (rows[0]?.id || null));
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadTicketDetail = async (ticketId) => {
    if (!ticketId) return setSelectedTicket(null), setSelectedListings([]), setMessages([]);
    setLoadingDetail(true);
    try {
      const response = await getSupportTicket(ticketId);
      setSelectedTicket(response.data?.ticket || null);
      setSelectedListings(response.data?.selected_listings || []);
      setMessages(response.data?.messages || []);
    } catch (error) {
      showToast(error.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => { if (user) { loadMeta(); loadTickets(); } }, [user]);
  useEffect(() => { if (selectedId) loadTicketDetail(selectedId); else { setSelectedTicket(null); setSelectedListings([]); setMessages([]); } }, [selectedId]);

  const filteredTickets = useMemo(() => tickets.filter((item) => {
    const keyword = search.trim().toLowerCase();
    return (filterStatus === 'all' || item.status === filterStatus)
      && (!keyword || item.ticket_no?.toLowerCase().includes(keyword) || item.subject?.toLowerCase().includes(keyword) || item.last_message?.toLowerCase().includes(keyword));
  }), [tickets, filterStatus, search]);

  const setCategory = (value) => {
    setPickerOpen(false);
    setWizardStep(0);
    setForm((prev) => ({ ...prev, category: value, related_order_id: '', related_scope: 'purchased', selected_listing_ids: [] }));
  };

  const toggleListing = (id) => setForm((prev) => {
    const next = new Set(prev.selected_listing_ids.map(Number));
    if (next.has(Number(id))) next.delete(Number(id)); else next.add(Number(id));
    return { ...prev, selected_listing_ids: Array.from(next) };
  });

  const submitTicket = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await createSupportTicket({
        subject: form.subject,
        category: form.category,
        message: form.message,
        related_order_id: showOrderStep ? (form.related_order_id || null) : null,
        related_scope: showListingStep ? form.related_scope : null,
        selected_listing_ids: showListingStep ? form.selected_listing_ids : [],
      });
      showToast('Destek talebin oluşturuldu.');
      setWizardStep(0);
      setPickerOpen(false);
      setForm({ subject: '', category: 'order', related_order_id: '', related_scope: 'purchased', selected_listing_ids: [], message: '' });
      await loadTickets(response.data?.id || null);
    } catch (error) {
      showToast(error.message);
    } finally {
      setCreating(false);
    }
  };

  const sendReply = async (event) => {
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

  const closeTicket = async () => {
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
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-100"><LifeBuoy size={13} />Destek Merkezi</div>
            <h1 className="text-3xl font-black tracking-tight">Yeni talebi adım adım ve daha geniş alanda oluştur</h1>
            <p className="mt-2 text-sm leading-6 text-violet-100/80">Sipariş odaklı kategoriler yalnızca sipariş alanını gösterir. İlan seçimi sadece ilan sorunu akışında açılır.</p>
          </div>
          <div className="grid min-w-[280px] grid-cols-3 gap-3">
            <SummaryCard title="Toplam" value={summary.all || 0} tone="text-slate-900" />
            <SummaryCard title="Açık" value={(summary.open || 0) + (summary.in_review || 0)} tone="text-rose-600" />
            <SummaryCard title="Bekleyen" value={summary.waiting_user || 0} tone="text-blue-600" />
          </div>
        </div>
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Plus size={18} /></div><div><h2 className="text-lg font-black text-slate-900">Yeni Destek Talebi</h2><p className="text-xs text-slate-500">Wizard akışıyla daha rahat seçim yap.</p></div></div>
        <div className="mb-5 grid gap-3 md:grid-cols-3">{STEP_TITLES.map((title, index) => <div key={title} className={`rounded-2xl border px-4 py-3 ${wizardStep === index ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-slate-50'}`}><div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Adım {index + 1}</div><div className="mt-1 text-sm font-black text-slate-900">{title}</div></div>)}</div>
        <form onSubmit={submitTicket} className="space-y-5">
          {wizardStep === 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{meta.categories.map((category) => <button key={category.value} type="button" onClick={() => setCategory(category.value)} className={`rounded-[22px] border p-4 text-left transition-all ${form.category === category.value ? 'border-violet-300 bg-violet-50 shadow-sm' : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50'}`}><div className="text-sm font-black text-slate-900">{category.label}</div><div className="mt-2 text-xs text-slate-500">{category.value === 'listing' ? 'İlan alt kategorisi ve görselli ilan seçimi açılır.' : ORDER_CATEGORIES.has(category.value) ? 'İlgili siparişi seçebilirsin; ilan seçimi açılmaz.' : 'Doğrudan detay adımına geçersin.'}</div></button>)}</div>
          ) : null}

          {wizardStep === 1 ? (
            <div className="space-y-4">
              {showOrderStep ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-500">İlgili Sipariş</label>
                  <select value={form.related_order_id} onChange={(e) => setForm((prev) => ({ ...prev, related_order_id: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white">
                    <option value="">Sipariş seçmeden devam et</option>
                    {meta.orders.map((order) => <option key={order.id} value={order.id}>{order.id} • {order.item_title || 'Sipariş'} • {fmtMoney(order.amount)}</option>)}
                  </select>
                </div>
              ) : null}

              {showListingStep ? (
                <div className="space-y-4">
                  <div className="grid gap-2 md:grid-cols-3">{LISTING_SCOPE_OPTIONS.map((item) => <button key={item.value} type="button" onClick={() => { setPickerOpen(false); setForm((prev) => ({ ...prev, related_scope: item.value, selected_listing_ids: [] })); }} className={`rounded-2xl border px-4 py-3 text-sm font-bold ${form.related_scope === item.value ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{item.label}</button>)}</div>
                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-3">
                    <button type="button" onClick={() => setPickerOpen((prev) => !prev)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left shadow-sm"><div><div className="text-sm font-black text-slate-900">İlan Seç</div><div className="text-xs text-slate-500">{form.selected_listing_ids.length > 0 ? `${form.selected_listing_ids.length} ilan seçildi` : 'Uygun ilanları açıp seç'}</div></div><ChevronDown size={18} className={`text-slate-400 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} /></button>
                    {pickerOpen ? <div className="mt-3 grid gap-3 sm:grid-cols-2">{activeListingPool.length ? activeListingPool.map((item) => <ListingCard key={item.id} item={item} selected={form.selected_listing_ids.includes(Number(item.id))} onToggle={toggleListing} />) : <div className="px-2 py-6 text-sm text-slate-400">Bu alt kategoride seçilebilir ilan bulunamadı.</div>}</div> : null}
                  </div>
                  <ListingsTable rows={selectedListingRows} title="Seçilen İlanlar" />
                </div>
              ) : !showOrderStep ? <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">Bu kategori için ilgili sipariş veya ilan seçimi gerekmiyor.</div> : null}
            </div>
          ) : null}

          {wizardStep === 2 ? (
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div><label className="mb-1.5 block text-xs font-bold text-slate-500">Konu</label><input value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white" placeholder="Kısa bir konu yaz" /></div>
                <div><label className="mb-1.5 block text-xs font-bold text-slate-500">Detay</label><textarea rows={7} value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white" placeholder="Sorunu net şekilde anlat." /></div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Özet</div>
                <div className="mt-3 space-y-3 text-sm">
                  <div><div className="text-slate-400">Kategori</div><div className="font-black text-slate-900">{meta.categories.find((item) => item.value === form.category)?.label || '-'}</div></div>
                  {showOrderStep ? <div><div className="text-slate-400">İlgili Sipariş</div><div className="font-black text-slate-900">{form.related_order_id ? `Sipariş ${form.related_order_id}` : 'Seçilmedi'}</div></div> : null}
                  {showListingStep ? <div><div className="text-slate-400">Seçilen İlan</div><div className="font-black text-slate-900">{selectedListingRows.length ? `${selectedListingRows.length} ilan` : 'Henüz seçilmedi'}</div></div> : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setWizardStep((prev) => Math.max(0, prev - 1))} disabled={wizardStep === 0} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 disabled:opacity-40">Geri</button>
            <div className="flex items-center gap-3">
              {wizardStep < 2 ? <button type="button" disabled={!canAdvance} onClick={() => setWizardStep((prev) => prev + 1)} className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40">Devam Et</button> : <button type="submit" disabled={creating || !canAdvance} className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40">{creating ? 'Oluşturuluyor...' : 'Destek Talebi Oluştur'}</button>}
            </div>
          </div>
        </form>
      </section>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-base font-black text-slate-900">Biletlerim</h2><p className="text-xs text-slate-500">Tüm destek taleplerini tek listede takip et.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-500">{tickets.length} adet</span></div>
          <div className="relative mb-3"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bilet no veya konu ara" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:bg-white" /></div>
          <div className="mb-3 flex flex-wrap gap-2">{[{ id: 'all', label: 'Tümü' }, { id: 'open', label: 'Açık' }, { id: 'waiting_user', label: 'Bekleyen' }, { id: 'resolved', label: 'Çözüldü' }, { id: 'closed', label: 'Kapalı' }].map((item) => <button key={item.id} onClick={() => setFilterStatus(item.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filterStatus === item.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{item.label}</button>)}</div>
          <div className="space-y-2">{loadingTickets ? <div className="py-10 text-center text-sm font-semibold text-slate-400">Biletler yükleniyor...</div> : filteredTickets.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">Bu filtrede destek talebi bulunamadı.</div> : filteredTickets.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-4 text-left ${String(selectedId) === String(item.id) ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white'}`}><div className="mb-2 flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{item.ticket_no}</div><div className="mt-1 truncate text-sm font-black text-slate-900">{item.subject}</div></div><StatusBadge value={item.status} /></div><p className="line-clamp-2 text-xs leading-5 text-slate-500">{item.last_message || 'Henüz mesaj yok.'}</p><div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-400"><span>{fmtDate(item.last_reply_at || item.created_at)}</span>{item.selected_listing_count ? <span>{item.selected_listing_count} ilan bağlı</span> : null}</div></button>)}</div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          {!selectedId ? <div className="flex min-h-[640px] flex-col items-center justify-center gap-4 text-center text-slate-400"><div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100"><LifeBuoy size={28} className="text-slate-300" /></div><div><h2 className="text-lg font-black text-slate-500">Bir destek talebi seç</h2><p className="mt-1 text-sm">Soldaki listeden bir bilet açarak detayını görebilirsin.</p></div></div> : loadingDetail || !selectedTicket ? <div className="flex min-h-[640px] items-center justify-center text-sm font-semibold text-slate-400">Destek talebi yükleniyor...</div> : (
            <div className="flex min-h-[640px] flex-col">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{selectedTicket.ticket_no}</span><StatusBadge value={selectedTicket.status} /></div><h2 className="text-2xl font-black tracking-tight text-slate-950">{selectedTicket.subject}</h2><div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{fmtDate(selectedTicket.created_at)}</span><span className="inline-flex items-center gap-1.5"><Package size={14} />Ticket {selectedTicket.id}</span></div></div>
                  {selectedTicket.status !== 'closed' ? <button onClick={closeTicket} disabled={closing} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-40"><XCircle size={16} />{closing ? 'Kapatılıyor...' : 'Talebi Kapat'}</button> : null}
                </div>
                {selectedTicket.related_order_id && ORDER_CATEGORIES.has(selectedTicket.category) ? <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">İlgili Sipariş</div><div className="font-bold text-slate-800">Sipariş {selectedTicket.related_order_id}</div><div className="mt-1 text-sm text-slate-500">{selectedTicket.related_order_title || 'Sipariş başlığı yok'}</div>{selectedTicket.related_order_amount ? <div className="mt-2 text-xs font-semibold text-emerald-600">{fmtMoney(selectedTicket.related_order_amount)}</div> : null}</div> : null}
                {selectedTicket.category === 'listing' ? <div className="mt-4"><ListingsTable rows={selectedListings} title="Bağlı İlanlar" /></div> : null}
              </div>
              <div className="py-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-black text-slate-900">Yazışma Geçmişi</h3><span className="text-xs font-semibold text-slate-400">{messages.length} mesaj</span></div><div className="h-[360px] space-y-3 overflow-y-auto rounded-[22px] border border-slate-200 bg-slate-50 p-4">{messages.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-slate-400">Bu bilette henüz yazışma yok.</div> : messages.map((item) => <TicketMessage key={item.id} item={item} />)}</div></div>
              <form onSubmit={sendReply} className="border-t border-slate-100 pt-4"><div className="rounded-3xl border border-slate-200 bg-slate-50 p-3"><textarea rows={4} value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} disabled={selectedTicket.status === 'closed'} placeholder={selectedTicket.status === 'closed' ? 'Bu bilet kapalı olduğu için yeni yanıt gönderilemez.' : 'Destek ekibine yanıt yaz...'} className="w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200 disabled:cursor-not-allowed disabled:bg-slate-100" /><div className="mt-3 flex items-center justify-between gap-3"><div className="text-xs text-slate-400">Durum değişikliklerinde bildirim göndermiyoruz; yalnızca yeni yanıtlar için bilgilendirme yapılır.</div><button type="submit" disabled={replying || selectedTicket.status === 'closed' || !replyMessage.trim()} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white disabled:opacity-40"><Send size={15} />{replying ? 'Gönderiliyor...' : 'Yanıt Gönder'}</button></div></div></form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
