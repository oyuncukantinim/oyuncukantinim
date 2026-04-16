import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Ban,
  ShieldCheck,
  Wallet,
  Key,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  Mail,
  FileText,
  CheckCircle2,
  Globe,
  MapPin,
  Monitor,
  CreditCard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { adminGetUsers, adminUpdateUser, adminGetUser, adminGetUserTransactions } from '../../lib/adminApi';
import { listingSlug } from '../../lib/api';
import { getListingCoverImage } from '../../lib/listingMedia';
import useSiteBrand from '../../hooks/useSiteBrand';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ListingPreviewGrid({ rows, emptyText, fmtMoney, filter, onFilterChange, defaultListingImage }) {
  if (!rows?.length) {
    return <div className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">{emptyText}</div>;
  }

  const summary = rows.reduce(
    (acc, row) => {
      const status = row.status || 'unknown';
      acc.total += 1;
      if (status === 'active') acc.active += 1;
      if (['passive', 'inactive'].includes(status)) acc.passive += 1;
      if (status === 'sold') acc.sold += 1;
      if (status === 'expired') acc.expired += 1;
      if (row.delivery_type === 'stock') acc.stock += 1;
      if (row.delivery_type !== 'stock') acc.manual += 1;
      return acc;
    },
    { total: 0, active: 0, passive: 0, sold: 0, expired: 0, stock: 0, manual: 0 },
  );

  const filterItems = [
    { id: 'all', label: 'Tümü', count: summary.total },
    { id: 'active', label: 'Aktif', count: summary.active },
    { id: 'passive', label: 'Pasif', count: summary.passive },
    { id: 'sold', label: 'Satıldı', count: summary.sold },
    { id: 'stock', label: 'Stoklu', count: summary.stock },
    { id: 'manual', label: 'Manuel', count: summary.manual },
    { id: 'expired', label: 'Süresi Dolan', count: summary.expired },
  ];

  const filteredRows = rows.filter((row) => {
    if (filter === 'active') return row.status === 'active';
    if (filter === 'passive') return ['passive', 'inactive'].includes(row.status);
    if (filter === 'sold') return row.status === 'sold';
    if (filter === 'stock') return row.delivery_type === 'stock';
    if (filter === 'manual') return row.delivery_type !== 'stock';
    if (filter === 'expired') return row.status === 'expired';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2">
        {filterItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilterChange(item.id)}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition-all ${
              filter === item.id
                ? 'bg-white text-violet-700 shadow-sm ring-1 ring-violet-100'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
            }`}
          >
            {item.label} <span className="ml-1 text-slate-400">{item.count}</span>
          </button>
        ))}
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">Bu filtrede ilan bulunmuyor.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredRows.map((row) => {
            const coverImage = getListingCoverImage(row, defaultListingImage);

            return (
              <Link
                key={`listing-${row.id}`}
                to={listingSlug(row.title || row.item_title || 'ilan', row.id)}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {coverImage ? (
                    <img src={coverImage} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl text-slate-300">#</div>
                  )}
                  <div className="absolute left-2 top-2 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur">
                    #{row.id}
                  </div>
                </div>

                <div className="space-y-1.5 p-2.5">
                  <div className="line-clamp-2 min-h-[34px] text-[12px] font-black leading-tight text-slate-900 group-hover:text-violet-700">
                    {row.title || row.item_title || 'İlan'}
                  </div>
                  <div className="truncate text-[10px] font-bold text-slate-400">{row.category_name || 'Kategorisiz'}</div>
                  <div className="text-sm font-black text-emerald-600">{fmtMoney(row.price)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Drawer({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/35" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone}`}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</div>
        <Icon size={16} className="text-slate-400" />
      </div>
      <div className="mt-2 text-xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, multiline = false }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-white p-2 text-slate-500 shadow-sm">
          <Icon size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</div>
          <div className={`mt-1 text-sm font-semibold text-slate-700 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
            {value || 'Belirtilmedi'}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children, span = '' }) {
  return (
    <label className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 ${span}`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-violet-400 focus:outline-none';

const RESTRICTION_FIELDS = [
  { key: 'listing_create', label: 'İlan oluşturma', description: 'Yeni ilan eklemesini engeller.' },
  { key: 'withdrawal', label: 'Para çekimi', description: 'Banka hesabı ekleme ve çekim talebini engeller.' },
  { key: 'message_send', label: 'Mesaj gönderme', description: 'Diğer kullanıcılara mesaj yazmasını engeller.' },
  { key: 'balance_use', label: 'Bakiye kullanımı', description: 'Satın alma ve bakiye ile işlem yapmasını engeller.' },
  { key: 'selling', label: 'Satış yapma', description: 'Kullanıcının ilanlarının satın alınmasını kapatır.' },
  { key: 'balance_topup', label: 'Bakiye yükleme', description: 'Bakiye yükleme ekranını etkiler.' },
  { key: 'listing_edit', label: 'İlan düzenleme', description: 'Mevcut ilanlarını düzenlemesini engeller.' },
  { key: 'review_create', label: 'Yorum gönderme', description: 'Sipariş sonrası yorum bırakmasını engeller.' },
];

export default function AdminUsers() {
  const { defaultListingImage } = useSiteBrand();
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('general');
  const [listingStatusFilter, setListingStatusFilter] = useState('all');
  const [userTxns, setUserTxns] = useState(null);
  const [txLoading, setTxLoading] = useState(false);

  const [modalType, setModalType] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('permanent');
  const [banCustomDate, setBanCustomDate] = useState('');
  const [balanceAction, setBalanceAction] = useState('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [drawerSaving, setDrawerSaving] = useState('');
  const [generalForm, setGeneralForm] = useState({ username: '', email: '', avatar: '', level: '0', xp: '0' });
  const [personalForm, setPersonalForm] = useState({ full_name: '', country: '', city: '', district: '', address: '' });
  const [moderationForm, setModerationForm] = useState({ is_admin: false, is_banned: false, ban_reason: '', new_password: '', restrictions: {} });
  const [financeForm, setFinanceForm] = useState({ amount: '', action: 'add' });
  const [financeSearch, setFinanceSearch] = useState('');
  const [financeTypeFilter, setFinanceTypeFilter] = useState('all');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminGetUsers({ page, search, is_banned: filterBanned });
      setUsers(r.data.users || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterBanned]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!detailUser) return;

    setGeneralForm({
      username: detailUser.username || '',
      email: detailUser.email || '',
      avatar: detailUser.avatar || '',
      level: String(detailUser.level ?? 0),
      xp: String(detailUser.xp ?? 0),
    });
    setPersonalForm({
      full_name: detailUser.full_name || '',
      country: detailUser.country || '',
      city: detailUser.city || '',
      district: detailUser.district || '',
      address: detailUser.address || '',
    });
    setModerationForm({
      is_admin: Number(detailUser.is_admin) === 1,
      is_banned: Number(detailUser.is_banned) === 1,
      ban_reason: detailUser.ban_reason || '',
      restrictions: detailUser.restrictions || {},
      new_password: '',
    });
    setFinanceForm({ amount: '', action: 'add' });
    setFinanceSearch('');
    setFinanceTypeFilter('all');
  }, [detailUser]);

  const openDetail = async (user) => {
    setSelectedUser(user);
    setDrawerOpen(true);
    setDetailTab('general');
    setListingStatusFilter('all');
    setUserTxns(null);
    setDetailUser(null);
    setDetailLoading(true);

    const res = await adminGetUser(user.id).catch(() => null);
    if (res?.data) {
      setDetailUser(res.data);
      setSelectedUser((prev) => ({ ...(prev || {}), ...res.data }));
    }
    setDetailLoading(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedUser(null);
    setDetailUser(null);
    setUserTxns(null);
    setDetailTab('general');
    setListingStatusFilter('all');
    setDetailLoading(false);
    setTxLoading(false);
  };

  const loadUserTxns = async (userId, force = false) => {
    if (!force && (userTxns || txLoading)) return;
    setTxLoading(true);
    const res = await adminGetUserTransactions(userId).catch(() => null);
    setUserTxns(res?.data || []);
    setTxLoading(false);
  };

  const refreshDetail = async (userId, options = {}) => {
    const { reloadTransactions = false } = options;
    const res = await adminGetUser(userId).catch(() => null);
    if (res?.data) {
      setDetailUser(res.data);
      setSelectedUser((prev) => ({ ...(prev || {}), ...res.data }));
    }

    if (reloadTransactions) {
      await loadUserTxns(userId, true);
    }
  };

  const handleSaveGeneral = async () => {
    const username = generalForm.username.trim();
    const email = generalForm.email.trim();
    const level = Number(generalForm.level);
    const xp = Number(generalForm.xp);

    if (!username) {
      showToast('Kullanıcı adı gerekli.');
      return;
    }
    if (!email) {
      showToast('E-posta gerekli.');
      return;
    }
    if (Number.isNaN(level) || level < 0 || Number.isNaN(xp) || xp < 0) {
      showToast('Seviye ve XP için geçerli değer girin.');
      return;
    }

    setDrawerSaving('general');
    try {
      await adminUpdateUser({
        user_id: detailUser.id,
        username,
        email,
        avatar: generalForm.avatar.trim(),
        level,
        xp,
      });
      await refreshDetail(detailUser.id);
      await load();
      showToast('Genel bilgiler güncellendi.');
    } catch (e) {
      showToast(e.message);
    } finally {
      setDrawerSaving('');
    }
  };

  const handleSavePersonal = async () => {
    setDrawerSaving('personal');
    try {
      await adminUpdateUser({
        user_id: detailUser.id,
        full_name: personalForm.full_name.trim(),
        country: personalForm.country.trim(),
        city: personalForm.city.trim(),
        district: personalForm.district.trim(),
        address: personalForm.address.trim(),
      });
      await refreshDetail(detailUser.id);
      await load();
      showToast('Kişisel bilgiler güncellendi.');
    } catch (e) {
      showToast(e.message);
    } finally {
      setDrawerSaving('');
    }
  };

  const handleDrawerBalance = async () => {
    const amount = Number(financeForm.amount);
    if (Number.isNaN(amount) || amount < 0) {
      showToast('Geçerli bir tutar girin.');
      return;
    }

    setDrawerSaving('finance');
    try {
      await adminUpdateUser({
        user_id: detailUser.id,
        [financeForm.action === 'set' ? 'balance_set' : 'balance_add']: amount,
      });
      setFinanceForm((prev) => ({ ...prev, amount: '' }));
      await refreshDetail(detailUser.id, { reloadTransactions: true });
      await load();
      showToast(financeForm.action === 'set' ? 'Bakiye güncellendi.' : 'Bakiye eklendi.');
    } catch (e) {
      showToast(e.message);
    } finally {
      setDrawerSaving('');
    }
  };

  const handleSaveModeration = async () => {
    setDrawerSaving('moderation');
    try {
      const payload = {
        user_id: detailUser.id,
        is_admin: moderationForm.is_admin ? 1 : 0,
        is_banned: moderationForm.is_banned ? 1 : 0,
        ban_reason: moderationForm.is_banned ? moderationForm.ban_reason.trim() : '',
        restrictions_json: moderationForm.restrictions || {},
      };

      if (moderationForm.new_password.trim()) {
        payload.new_password = moderationForm.new_password.trim();
      }

      await adminUpdateUser(payload);
      await refreshDetail(detailUser.id);
      await load();
      setModerationForm((prev) => ({ ...prev, new_password: '' }));
      showToast('Moderasyon bilgileri güncellendi.');
    } catch (e) {
      showToast(e.message);
    } finally {
      setDrawerSaving('');
    }
  };

  const handleBan = async () => {
    setSaving(true);
    try {
      const isBanned = Number(selectedUser.is_banned) !== 1;
      let ban_expires_at = null;
      if (isBanned && banDuration !== 'permanent') {
        if (banDuration === 'custom') {
          ban_expires_at = banCustomDate || null;
        } else {
          const days = parseInt(banDuration, 10);
          const d = new Date();
          d.setDate(d.getDate() + days);
          ban_expires_at = d.toISOString().slice(0, 19).replace('T', ' ');
        }
      }
      await adminUpdateUser({ user_id: selectedUser.id, is_banned: isBanned ? 1 : 0, ban_reason: banReason, ban_expires_at });
      showToast(isBanned ? 'Kullanıcı banlandı.' : 'Ban kaldırıldı.');
      setModalType('');
      await load();
      if (detailUser?.id === selectedUser.id) {
        await refreshDetail(selectedUser.id);
      }
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBalance = async () => {
    if (!balanceAmount || Number.isNaN(Number(balanceAmount))) {
      showToast('Geçerli tutar girin.');
      return;
    }

    setSaving(true);
    try {
      const body = { user_id: selectedUser.id };
      if (balanceAction === 'add') body.balance_add = parseFloat(balanceAmount);
      else body.balance_set = parseFloat(balanceAmount);

      await adminUpdateUser(body);
      showToast('Bakiye güncellendi.');
      setModalType('');
      setBalanceAmount('');
      await load();
      if (detailUser?.id === selectedUser.id) {
        await refreshDetail(selectedUser.id, { reloadTransactions: true });
      }
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async () => {
    if (!newPassword) {
      showToast('Şifre girin.');
      return;
    }

    setSaving(true);
    try {
      await adminUpdateUser({ user_id: selectedUser.id, new_password: newPassword });
      showToast('Şifre sıfırlandı.');
      setModalType('');
      setNewPassword('');
      if (detailUser?.id === selectedUser.id) {
        await refreshDetail(selectedUser.id);
      }
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdmin = async (user) => {
    if (!confirm(`${user.username} kullanıcısının admin yetkisini ${user.is_admin ? 'kaldır' : 'ver'}?`)) return;
    try {
      await adminUpdateUser({ user_id: user.id, is_admin: user.is_admin ? 0 : 1 });
      showToast('Güncellendi.');
      await load();
      if (detailUser?.id === user.id) {
        await refreshDetail(user.id);
      }
    } catch (e) {
      showToast(e.message);
    }
  };

  const transactionSummary = useMemo(() => {
    const rows = userTxns || [];
    return rows.reduce(
      (acc, tx) => {
        const amount = Number(tx.amount || 0);
        const sellerAmount = Number(tx.seller_amount ?? tx.amount ?? 0);
        if (tx.tx_type === 'purchase') acc.total_spent += amount;
        if (tx.tx_type === 'sale' && Number(tx.seller_paid) === 1) acc.total_earned += sellerAmount;
        if (tx.tx_type === 'sale' && Number(tx.seller_paid) !== 1) acc.pending_earn += sellerAmount;
        return acc;
      },
      { total_spent: 0, total_earned: 0, pending_earn: 0 },
    );
  }, [userTxns]);

  const filteredUserTxns = useMemo(() => {
    const rows = userTxns || [];
    return rows.filter((tx) => {
      if (financeTypeFilter !== 'all' && tx.tx_type !== financeTypeFilter) return false;
      const query = financeSearch.trim().toLocaleLowerCase('tr-TR');
      if (!query) return true;
      const haystack = [
        tx.item_title,
        tx.counterparty,
        tx.note,
        tx.status,
      ].join(' ').toLocaleLowerCase('tr-TR');
      return haystack.includes(query);
    });
  }, [userTxns, financeSearch, financeTypeFilter]);

  const fmtMoney = (n) => `${Number(n || 0).toFixed(2)} ₺`;
  const fmtDateTime = (d) =>
    d
      ? new Date(d).toLocaleString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  return (
    <AdminLayout>
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Kullanıcı adı veya e-posta ara..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-violet-400 focus:outline-none"
              />
            </div>
            <select
              value={filterBanned}
              onChange={(e) => {
                setFilterBanned(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
            >
<option value="">Tüm Kullanıcılar</option>
              <option value="0">Aktif</option>
              <option value="1">Banlı</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="text-lg font-extrabold text-gray-800">Kullanıcılar</h3>
              <p className="mt-1 text-sm text-gray-500">{total} kullanıcı listeleniyor</p>
            </div>
            <div className="hidden rounded-2xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 md:block">
              Satıra tıklayarak detay panelini aç
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Kullanıcı</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 md:table-cell">E-posta</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 sm:table-cell">Bakiye</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 lg:table-cell">İlan</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 lg:table-cell">Sipariş</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Durum</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                      Kullanıcı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => openDetail(u)}
                      className="cursor-pointer border-t border-gray-50 transition-colors hover:bg-violet-50/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{u.avatar || '👤'}</span>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-gray-800">
                              <span>{u.username}</span>
                              {Number(u.is_admin) === 1 && (
                                <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">#{u.id} · Lv.{u.level}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-gray-500 md:table-cell">{u.email}</td>
                      <td className="hidden px-4 py-3 font-bold text-emerald-600 sm:table-cell">{fmtMoney(u.balance)}</td>
                      <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">{u.listing_count}</td>
                      <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">{u.order_count}</td>
                      <td className="px-4 py-3">
                        {Number(u.is_banned) === 1 ? (
                          <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-600">Banlı</span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">Aktif</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openDetail(u)}
                            title="Detay"
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType('balance');
                            }}
                            title="Bakiye"
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <Wallet size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType('password');
                            }}
                            title="Şifre"
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Key size={15} />
                          </button>
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            title={Number(u.is_admin) === 1 ? 'Admin Kaldır' : 'Admin Yap'}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-violet-50 hover:text-violet-600"
                          >
                            <ShieldCheck size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setBanReason(u.ban_reason || '');
                              setBanDuration('permanent');
                              setBanCustomDate('');
                              setModalType('ban');
                            }}
                            title={Number(u.is_banned) === 1 ? 'Ban Kaldır' : 'Banla'}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Ban size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
              <span className="text-xs text-gray-500">Sayfa {page} / {pages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Drawer open={drawerOpen} title={selectedUser ? `${selectedUser.username} · Kullanıcı Detayı` : 'Kullanıcı Detayı'} onClose={closeDrawer}>
        {detailLoading || !detailUser ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-violet-50 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-slate-100">
                  {detailUser.avatar || '👤'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-xl font-black text-slate-900">{detailUser.username}</h3>
                    {Number(detailUser.is_admin) === 1 && (
                      <span className="rounded-full bg-violet-100 px-2 py-1 text-[11px] font-bold text-violet-700">Admin</span>
                    )}
                    {Number(detailUser.is_banned) === 1 && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700">Banlı</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span>{detailUser.email}</span>
                    <EmailStatusBadge verified={Boolean(detailUser.email_verified_at)} />
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    #{detailUser.id} · Seviye {detailUser.level} · {fmtDateTime(detailUser.created_at)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <SummaryCard icon={Wallet} label="Bakiye" value={fmtMoney(detailUser.balance)} tone="border-emerald-100 bg-emerald-50/70" />
                <SummaryCard icon={FileText} label="İlan" value={detailUser.listings?.length || 0} tone="border-violet-100 bg-violet-50/70" />
                <SummaryCard icon={Clock} label="Sipariş" value={detailUser.orders?.length || 0} tone="border-cyan-100 bg-cyan-50/70" />
              </div>
            </div>
            
              <div className="rounded-2xl bg-slate-100 p-1">
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { id: 'general', label: 'Genel' },
                  { id: 'personal', label: 'Kişisel' },
                  { id: 'listings', label: 'İlanlar' },
                  { id: 'bank_accounts', label: 'Banka Hesapları' },
                  { id: 'finance', label: 'Finans' },
                  { id: 'moderation', label: 'Moderasyon' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setDetailTab(tab.id);
                      if (tab.id === 'finance') loadUserTxns(detailUser.id);
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                      detailTab === tab.id ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {detailTab === 'general' && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Kullanıcı Adı">
                    <input
                      value={generalForm.username}
                      onChange={(e) => setGeneralForm((prev) => ({ ...prev, username: e.target.value }))}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="E-posta">
                    <input
                      type="email"
                      value={generalForm.email}
                      onChange={(e) => setGeneralForm((prev) => ({ ...prev, email: e.target.value }))}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Avatar / Emoji">
                    <input
                      value={generalForm.avatar}
                      onChange={(e) => setGeneralForm((prev) => ({ ...prev, avatar: e.target.value }))}
                      placeholder="Emoji veya görsel URL"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Seviye">
                    <input
                      type="number"
                      min="0"
                      value={generalForm.level}
                      onChange={(e) => setGeneralForm((prev) => ({ ...prev, level: e.target.value }))}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="XP">
                    <input
                      type="number"
                      min="0"
                      value={generalForm.xp}
                      onChange={(e) => setGeneralForm((prev) => ({ ...prev, xp: e.target.value }))}
                      className={inputClass}
                    />
                  </FormField>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow
                    icon={Mail}
                    label="Mevcut E-posta"
                    value={
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{detailUser.email}</span>
                        <EmailStatusBadge verified={Boolean(detailUser.email_verified_at)} />
                      </div>
                    }
                  />
                  <InfoRow icon={Clock} label="Kayıt Tarihi" value={fmtDateTime(detailUser.created_at)} />
                  <InfoRow icon={Monitor} label="Kayıt IP" value={detailUser.registration_ip || '—'} />
                  <InfoRow icon={Globe} label="Kayıt Ülke" value={detailUser.registration_country || '—'} />
                </div>

                {/* Son Giris IP Loglari */}
                {detailUser.login_logs && detailUser.login_logs.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                      <MapPin className="h-4 w-4 text-violet-500" />
                      Son Giris IP Kayitlari
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 font-semibold text-gray-600">IP</th>
                            <th className="px-3 py-2 font-semibold text-gray-600">Sehir / Ulke</th>
                            <th className="px-3 py-2 font-semibold text-gray-600">Tarih</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {detailUser.login_logs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-gray-800">{log.ip}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                                {[log.city, log.country].filter(Boolean).join(', ') || '—'}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-gray-500">{fmtDateTime(log.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveGeneral}
                    disabled={drawerSaving === 'general'}
                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-500 disabled:opacity-50"
                  >
                    {drawerSaving === 'general' ? 'Kaydediliyor...' : 'Genel Bilgileri Kaydet'}
                  </button>
                </div>
              </div>
            )}

            {detailTab === 'personal' && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Ad Soyad" span="sm:col-span-2">
                    <input
                      value={personalForm.full_name}
                      onChange={(e) => setPersonalForm((prev) => ({ ...prev, full_name: e.target.value }))}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Ülke">
                    <input
                      value={personalForm.country}
                      onChange={(e) => setPersonalForm((prev) => ({ ...prev, country: e.target.value }))}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Şehir">
                    <input
                      value={personalForm.city}
                      onChange={(e) => setPersonalForm((prev) => ({ ...prev, city: e.target.value }))}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="İlçe" span="sm:col-span-2">
                    <input
                      value={personalForm.district}
                      onChange={(e) => setPersonalForm((prev) => ({ ...prev, district: e.target.value }))}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Adres" span="sm:col-span-2">
                    <textarea
                      rows={4}
                      value={personalForm.address}
                      onChange={(e) => setPersonalForm((prev) => ({ ...prev, address: e.target.value }))}
                      className={inputClass}
                    />
                  </FormField>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSavePersonal}
                    disabled={drawerSaving === 'personal'}
                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-500 disabled:opacity-50"
                  >
                    {drawerSaving === 'personal' ? 'Kaydediliyor...' : 'Kişisel Bilgileri Kaydet'}
                  </button>
                </div>
              </div>
            )}

            {detailTab === 'listings' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">İlan Yönetimi</div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">Görsel, ilan no, durum ve stok bilgisiyle hızlı kontrol.</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">
                      {detailUser.listings?.length || 0} kayıt
                    </span>
                  </div>
                  <ListingPreviewGrid
                    rows={detailUser.listings}
                    emptyText="İlan bulunmuyor."
                    fmtMoney={fmtMoney}
                    filter={listingStatusFilter}
                    onFilterChange={setListingStatusFilter}
                    defaultListingImage={defaultListingImage}
                  />
                </div>
              </div>
            )}

            {detailTab === 'bank_accounts' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">Banka Hesapları</div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">Onaylı ve bekleyen çekim hesaplarını kullanıcı özelinde inceleyin.</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">
                      {detailUser.payment_accounts?.length || 0} kayıt
                    </span>
                  </div>

                  {!detailUser.payment_accounts || detailUser.payment_accounts.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">Kayıtlı banka hesabı bulunmuyor.</div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-3 py-2 font-black">Banka</th>
                            <th className="px-3 py-2 font-black">Ad Soyad</th>
                            <th className="px-3 py-2 font-black">IBAN</th>
                            <th className="px-3 py-2 font-black">Durum</th>
                            <th className="px-3 py-2 font-black">Tarih</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailUser.payment_accounts.map((account) => (
                            <tr key={account.id}>
                              <td className="px-3 py-3">
                                <div className="font-semibold text-slate-800">{account.bank_name || account.label || 'Banka'}</div>
                                {account.admin_note ? <div className="mt-1 text-xs font-semibold text-rose-500">{account.admin_note}</div> : null}
                              </td>
                              <td className="px-3 py-3 font-semibold text-slate-700">{account.account_holder || '—'}</td>
                              <td className="px-3 py-3 font-mono text-xs text-slate-600">{account.iban || '—'}</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${
                                  account.status === 'approved'
                                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                    : account.status === 'rejected'
                                      ? 'border-rose-100 bg-rose-50 text-rose-700'
                                      : 'border-amber-100 bg-amber-50 text-amber-700'
                                }`}>
                                  {account.status === 'approved' ? 'Onaylandı' : account.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-xs font-semibold text-slate-500">{fmtDateTime(account.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {detailTab === 'finance' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">Hızlı Bakiye İşlemi</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Drawer içinden ekleme veya doğrudan bakiye ayarlama yapabilirsiniz.
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-100 p-1">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setFinanceForm((prev) => ({ ...prev, action: 'add' }))}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                            financeForm.action === 'add' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          Bakiye Ekle
                        </button>
                        <button
                          onClick={() => setFinanceForm((prev) => ({ ...prev, action: 'set' }))}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                            financeForm.action === 'set' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          Bakiyeyi Ayarla
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={financeForm.amount}
                      onChange={(e) => setFinanceForm((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="Tutar girin"
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={handleDrawerBalance}
                      disabled={drawerSaving === 'finance'}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {drawerSaving === 'finance' ? 'Kaydediliyor...' : financeForm.action === 'set' ? 'Bakiyeyi Kaydet' : 'Bakiye Ekle'}
                    </button>
                  </div>
                </div>

                {txLoading && !userTxns ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <SummaryCard icon={TrendingDown} label="Harcama" value={fmtMoney(transactionSummary.total_spent)} tone="border-red-100 bg-red-50/70" />
                      <SummaryCard icon={TrendingUp} label="Kazanç" value={fmtMoney(transactionSummary.total_earned)} tone="border-emerald-100 bg-emerald-50/70" />
                      <SummaryCard icon={Clock} label="Bekleyen" value={fmtMoney(transactionSummary.pending_earn)} tone="border-amber-100 bg-amber-50/70" />
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-sm font-extrabold text-slate-900">Son Finansal Hareketler</div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            value={financeSearch}
                            onChange={(e) => setFinanceSearch(e.target.value)}
                            placeholder="İşlem ara..."
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-violet-400 focus:outline-none"
                          />
                          <select
                            value={financeTypeFilter}
                            onChange={(e) => setFinanceTypeFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-violet-400 focus:outline-none"
                          >
                            <option value="all">Tüm işlemler</option>
                            <option value="purchase">Alımlar</option>
                            <option value="sale">Satışlar</option>
                            <option value="balance">Bakiye</option>
                            <option value="withdrawal">Çekimler</option>
                          </select>
                        </div>
                      </div>
                      {filteredUserTxns.length === 0 ? (
                        <div className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">İşlem bulunamadı.</div>
                      ) : (
                        <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                          {filteredUserTxns.map((tx, i) => {
                            const isPurchase = tx.tx_type === 'purchase';
                            const isBalance = tx.tx_type === 'balance';
                            const isWithdrawal = tx.tx_type === 'withdrawal';
                            const net = isPurchase
                              ? -Number(tx.amount || 0)
                              : isWithdrawal
                                ? -Number(tx.total_amount ?? tx.amount ?? 0)
                                : Number(tx.seller_amount ?? tx.amount ?? 0);
                            return (
                              <div key={`${tx.tx_type}-${tx.id}-${i}`} className="rounded-xl bg-slate-50 px-3 py-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-bold text-slate-800">{tx.item_title || 'İşlem'}</div>
                                    <div className="mt-1 text-xs text-slate-400">
                                      {isBalance
                                        ? `${tx.counterparty || 'Sistem'}${tx.balance_before != null ? ` · Eski bakiye: ${Number(tx.balance_before).toFixed(2)} ₺` : ''}${tx.balance_after != null ? ` · Yeni bakiye: ${Number(tx.balance_after).toFixed(2)} ₺` : ''} · ${fmtDateTime(tx.created_at)}`
                                        : isWithdrawal
                                          ? `${tx.counterparty || 'Banka'} · ${tx.status || 'Beklemede'} · ${fmtDateTime(tx.created_at)}`
                                          : `${tx.counterparty || '—'} · ${fmtDateTime(tx.created_at)}`}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-sm font-black ${isBalance ? (net < 0 ? 'text-red-500' : 'text-violet-600') : net < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                      {net < 0 ? '' : '+'}
                                      {Number(net).toFixed(2)} ₺
                                    </div>
                                    {isWithdrawal && Number(tx.fee_amount || 0) > 0 ? (
                                      <div className="mt-1 text-[11px] font-bold text-rose-500">Masraf: {Number(tx.fee_amount).toFixed(2)} ₺</div>
                                    ) : null}
                                    <div className={`mt-1 text-[11px] font-bold ${isBalance ? 'text-violet-600' : isWithdrawal ? 'text-amber-600' : isPurchase ? 'text-red-500' : 'text-emerald-600'}`}>
                                      {isBalance ? 'Bakiye' : isWithdrawal ? 'Çekim' : isPurchase ? 'Alım' : 'Satış'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {detailTab === 'moderation' && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">Admin Yetkisi</div>
                        <div className="mt-1 text-xs text-slate-400">Kullanıcının yönetim paneline erişimini belirler.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={moderationForm.is_admin}
                        onChange={(e) => setModerationForm((prev) => ({ ...prev, is_admin: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                    </div>
                  </label>

                  <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">Ban Durumu</div>
                        <div className="mt-1 text-xs text-slate-400">Ban aktifse kullanıcı giriş yapamaz.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={moderationForm.is_banned}
                        onChange={(e) =>
                          setModerationForm((prev) => ({
                            ...prev,
                            is_banned: e.target.checked,
                            ban_reason: e.target.checked ? prev.ban_reason : '',
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                    </div>
                  </label>

                  <FormField label="Ban Sebebi" span="sm:col-span-2">
                    <input
                      value={moderationForm.ban_reason}
                      onChange={(e) => setModerationForm((prev) => ({ ...prev, ban_reason: e.target.value }))}
                      disabled={!moderationForm.is_banned}
                      placeholder="Kural ihlali, sahte işlem, spam vb."
                      className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                    />
                  </FormField>

                  <FormField label="Yeni Şifre" span="sm:col-span-2">
                    <input
                      type="text"
                      value={moderationForm.new_password}
                      onChange={(e) => setModerationForm((prev) => ({ ...prev, new_password: e.target.value }))}
                      placeholder="Boş bırakırsanız şifre değişmez"
                      className={inputClass}
                    />
                  </FormField>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <CreditCard size={16} className="text-violet-500" />
                    Gelişmiş Kısıtlamalar
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {RESTRICTION_FIELDS.map((item) => (
                      <label key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-slate-900">{item.label}</div>
                            <div className="mt-1 text-xs text-slate-400">{item.description}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(moderationForm.restrictions?.[item.key])}
                            onChange={(e) =>
                              setModerationForm((prev) => ({
                                ...prev,
                                restrictions: {
                                  ...(prev.restrictions || {}),
                                  [item.key]: e.target.checked,
                                },
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow icon={Ban} label="Mevcut Ban Sebebi" value={detailUser.ban_reason} />
                  <InfoRow icon={ShieldCheck} label="Rol" value={Number(detailUser.is_admin) === 1 ? 'Admin' : 'Standart Kullanıcı'} />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveModeration}
                    disabled={drawerSaving === 'moderation'}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                  >
                    {drawerSaving === 'moderation' ? 'Kaydediliyor...' : 'Moderasyon Ayarlarını Kaydet'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {modalType === 'ban' && selectedUser && (
        <Modal title={Number(selectedUser.is_banned) === 1 ? 'Ban Kaldır' : `${selectedUser.username} Kullanıcısını Banla`} onClose={() => setModalType('')}>
          {Number(selectedUser.is_banned) !== 1 && (
            <>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-bold text-gray-700">Ban Sebebi</label>
                <input
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Kural ihlali, spam vb."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-bold text-gray-700">Ban Süresi</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    { value: '1', label: '1 Gün' },
                    { value: '3', label: '3 Gün' },
                    { value: '7', label: '7 Gün' },
                    { value: '30', label: '30 Gün' },
                    { value: 'permanent', label: 'Süresiz' },
                    { value: 'custom', label: 'Özel Tarih' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBanDuration(opt.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-all ${
                        banDuration === opt.value
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-red-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {banDuration === 'custom' && (
                  <input
                    type="datetime-local"
                    value={banCustomDate}
                    onChange={(e) => setBanCustomDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                  />
                )}
                {banDuration !== 'permanent' && banDuration !== 'custom' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Ban {banDuration} gün sonra otomatik kaldırılacak.
                  </p>
                )}
              </div>
            </>
          )}
          <p className="mb-5 text-sm text-gray-600">
            {Number(selectedUser.is_banned) === 1
              ? `${selectedUser.username} kullanıcısının banı kaldırılacak.`
              : `${selectedUser.username} kullanıcısı banlanacak ve giriş yapamayacak.`}
          </p>
          <button
            onClick={handleBan}
            disabled={saving}
            className={`w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 ${
              Number(selectedUser.is_banned) === 1 ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {saving ? 'Kaydediliyor...' : Number(selectedUser.is_banned) === 1 ? 'Banı Kaldır' : 'Banla'}
          </button>
        </Modal>
      )}

      {modalType === 'balance' && selectedUser && (
        <Modal title={`${selectedUser.username} · Bakiye Düzenle`} onClose={() => setModalType('')}>
          <div className="mb-4 rounded-xl bg-gray-50 p-3 text-sm">
            Mevcut Bakiye: <span className="font-extrabold text-emerald-600">{fmtMoney(selectedUser.balance)}</span>
          </div>
          <div className="mb-4 flex gap-2">
            {['add', 'set'].map((action) => (
              <button
                key={action}
                onClick={() => setBalanceAction(action)}
                className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${
                  balanceAction === action ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {action === 'add' ? 'Ekle' : 'Ayarla'}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={balanceAmount}
            onChange={(e) => setBalanceAmount(e.target.value)}
            placeholder="Tutar (₺)"
            className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
          />
          <button
            onClick={handleBalance}
            disabled={saving}
            className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Güncelle'}
          </button>
        </Modal>
      )}

      {modalType === 'password' && selectedUser && (
        <Modal title={`${selectedUser.username} · Şifre Sıfırla`} onClose={() => setModalType('')}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Yeni şifre"
            className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
          />
          <button
            onClick={handlePassword}
            disabled={saving}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Şifreyi Sıfırla'}
          </button>
        </Modal>
      )}

    </AdminLayout>
  );
}

function EmailStatusBadge({ verified }) {
  return verified ? (
    <span
      title="Mail doğrulandı"
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
    >
      <CheckCircle2 size={15} />
    </span>
  ) : (
    <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600">
      Mail Doğrulanmadı
    </span>
  );
}

