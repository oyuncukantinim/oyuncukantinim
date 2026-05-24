import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Edit3,
  ExternalLink,
  Landmark,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Wallet,
  XCircle,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminDeletePaymentAccount,
  adminGetPaymentManagement,
  adminGetSettings,
  adminSaveBalanceTopupPackage,
  adminSaveSettings,
  adminDeleteBalanceTopupPackage,
  adminUpdateBalanceTopupRequest,
  adminUpdatePaymentAccount,
  adminUpdateWithdrawal,
} from '../../lib/adminApi';

const ACCOUNT_STATUS = {
  pending: { label: 'Onay bekliyor', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  approved: { label: 'Onaylandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected: { label: 'Reddedildi', className: 'bg-rose-50 text-rose-700 border-rose-100' },
};

const WITHDRAWAL_STATUS = {
  pending: { label: 'Beklemede', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  processing: { label: 'İşleniyor', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  completed: { label: 'Tamamlandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected: { label: 'Reddedildi', className: 'bg-rose-50 text-rose-700 border-rose-100' },
  cancelled: { label: 'İptal edildi', className: 'bg-slate-50 text-slate-600 border-slate-100' },
};

const TOPUP_STATUS = {
  pending: { label: 'Onay bekliyor', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  approved: { label: 'Onaylandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected: { label: 'Reddedildi', className: 'bg-rose-50 text-rose-700 border-rose-100' },
};

const EMPTY_TOPUP_PACKAGE = {
  id: 0,
  code: '',
  title: '',
  description: '',
  balance_amount: '',
  payable_amount: '',
  shopier_url: '',
  is_active: true,
  sort_order: '0',
};

function fmtMoney(value) {
  return `${Number(value || 0).toFixed(2)} ₺`;
}

function fmtDate(value) {
  return value ? new Date(value).toLocaleString('tr-TR') : '—';
}

function StatusPill({ status, map }) {
  const meta = map[status] || { label: status || 'Belirsiz', className: 'bg-slate-50 text-slate-600 border-slate-100' };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${meta.className}`}>{meta.label}</span>;
}

function normalizeBankList(rawValue) {
  if (!rawValue) return [];
  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item || '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export default function PaymentManagement() {
  const [activeTab, setActiveTab] = useState('topups');
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [data, setData] = useState({ withdrawals: [], accounts: [], topup_requests: [], topup_packages: [], summary: {} });
  const [withdrawalStatus, setWithdrawalStatus] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [topupStatus, setTopupStatus] = useState('pending');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [topupSearch, setTopupSearch] = useState('');
  const [expandedWithdrawalId, setExpandedWithdrawalId] = useState(null);
  const [references, setReferences] = useState({});
  const [topupNotes, setTopupNotes] = useState({});
  const [packageForm, setPackageForm] = useState(EMPTY_TOPUP_PACKAGE);
  const [settingsForm, setSettingsForm] = useState({
    withdrawal_enabled: true,
    withdrawal_min_amount: '50',
    withdrawal_fee_type: 'fixed',
    withdrawal_fee_value: '0',
    banks: [],
  });
  const [newBankName, setNewBankName] = useState('');

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    adminGetPaymentManagement({
      withdrawal_status: withdrawalStatus,
      account_status: accountStatus,
      topup_status: topupStatus,
    })
      .then((response) => setData(response.data || { withdrawals: [], accounts: [], topup_requests: [], topup_packages: [], summary: {} }))
      .catch((error) => showToast(error.message))
      .finally(() => setLoading(false));
  }, [withdrawalStatus, accountStatus, topupStatus, showToast]);

  const loadSettings = useCallback(() => {
    setSettingsLoading(true);
    adminGetSettings()
      .then((response) => {
        const settings = response.data || {};
        setSettingsForm({
          withdrawal_enabled: String(settings.withdrawal_enabled ?? '1') !== '0',
          withdrawal_min_amount: String(settings.withdrawal_min_amount ?? '50'),
          withdrawal_fee_type: ['fixed', 'percent'].includes(settings.withdrawal_fee_type) ? settings.withdrawal_fee_type : 'fixed',
          withdrawal_fee_value: String(settings.withdrawal_fee_value ?? '0'),
          banks: normalizeBankList(settings.withdrawal_bank_options),
        });
      })
      .catch((error) => showToast(error.message))
      .finally(() => setSettingsLoading(false));
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const withdrawals = useMemo(() => data.withdrawals || [], [data.withdrawals]);
  const accounts = useMemo(() => data.accounts || [], [data.accounts]);
  const topupRequests = useMemo(() => data.topup_requests || [], [data.topup_requests]);
  const topupPackages = useMemo(() => data.topup_packages || [], [data.topup_packages]);
  const summary = data.summary || {};

  const filteredWithdrawals = useMemo(() => {
    const query = withdrawalSearch.trim().toLocaleLowerCase('tr-TR');
    if (!query) return withdrawals;
    return withdrawals.filter((request) => {
      const haystack = [
        request.id,
        request.username,
        request.email,
        request.bank_name,
        request.account_holder,
        request.iban,
      ].join(' ').toLocaleLowerCase('tr-TR');
      return haystack.includes(query);
    });
  }, [withdrawals, withdrawalSearch]);

  const filteredAccounts = useMemo(() => {
    const query = accountSearch.trim().toLocaleLowerCase('tr-TR');
    if (!query) return accounts;
    return accounts.filter((account) => {
      const haystack = [
        account.id,
        account.username,
        account.email,
        account.bank_name,
        account.account_holder,
        account.iban,
        account.label,
      ].join(' ').toLocaleLowerCase('tr-TR');
      return haystack.includes(query);
    });
  }, [accounts, accountSearch]);

  const filteredTopupRequests = useMemo(() => {
    const query = topupSearch.trim().toLocaleLowerCase('tr-TR');
    if (!query) return topupRequests;
    return topupRequests.filter((request) => {
      const haystack = [
        request.id,
        request.username,
        request.email,
        request.package_code,
        request.package_title,
        request.shopier_order_no,
        request.payer_name,
      ].join(' ').toLocaleLowerCase('tr-TR');
      return haystack.includes(query);
    });
  }, [topupRequests, topupSearch]);

  const updateAccount = async (accountId, status) => {
    setSaving(true);
    try {
      await adminUpdatePaymentAccount({
        account_id: accountId,
        status,
      });
      showToast('Hesap durumu güncellendi.');
      loadData();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async (accountId) => {
    if (!confirm('Bu banka hesabını silmek istiyor musun?')) return;
    setSaving(true);
    try {
      await adminDeletePaymentAccount(accountId);
      showToast('Banka hesabı silindi.');
      setExpandedWithdrawalId(null);
      loadData();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateWithdrawal = async (withdrawalId, status) => {
    const paymentReference = (references[`withdrawal-${withdrawalId}`] || '').trim();

    setSaving(true);
    try {
      await adminUpdateWithdrawal({
        withdrawal_id: withdrawalId,
        status,
        payment_reference: paymentReference,
      });
      showToast('Çekim talebi güncellendi.');
      setExpandedWithdrawalId(null);
      loadData();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const editPackage = (pkg) => {
    setPackageForm({
      id: pkg.id || 0,
      code: pkg.code || '',
      title: pkg.title || '',
      description: pkg.description || '',
      balance_amount: String(pkg.balance_amount ?? ''),
      payable_amount: String(pkg.payable_amount ?? ''),
      shopier_url: pkg.shopier_url || '',
      is_active: String(pkg.is_active ?? '1') !== '0',
      sort_order: String(pkg.sort_order ?? '0'),
    });
    setActiveTab('topup-packages');
  };

  const resetPackageForm = () => {
    setPackageForm(EMPTY_TOPUP_PACKAGE);
  };

  const saveTopupPackage = async () => {
    setSaving(true);
    try {
      await adminSaveBalanceTopupPackage({
        ...packageForm,
        is_active: packageForm.is_active ? '1' : '0',
      });
      showToast('Bakiye paketi kaydedildi.');
      resetPackageForm();
      loadData();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteTopupPackage = async (packageId) => {
    if (!confirm('Bu bakiye paketini silmek istiyor musun?')) return;
    setSaving(true);
    try {
      await adminDeleteBalanceTopupPackage(packageId);
      showToast('Bakiye paketi silindi.');
      if (Number(packageForm.id) === Number(packageId)) resetPackageForm();
      loadData();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateTopupRequest = async (requestId, status) => {
    setSaving(true);
    try {
      await adminUpdateBalanceTopupRequest({
        request_id: requestId,
        status,
        admin_note: topupNotes[`topup-${requestId}`] || '',
      });
      showToast(status === 'approved' ? 'Bakiye bildirimi onaylandı.' : 'Bakiye bildirimi reddedildi.');
      loadData();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const addBank = () => {
    const nextBank = newBankName.trim();
    if (!nextBank) return;
    if (settingsForm.banks.some((item) => item.toLocaleLowerCase('tr-TR') === nextBank.toLocaleLowerCase('tr-TR'))) {
      showToast('Bu banka zaten ekli.');
      return;
    }
    setSettingsForm((prev) => ({ ...prev, banks: [...prev.banks, nextBank] }));
    setNewBankName('');
  };

  const removeBank = (bankName) => {
    setSettingsForm((prev) => ({ ...prev, banks: prev.banks.filter((item) => item !== bankName) }));
  };

  const saveSettings = async () => {
    if (settingsForm.banks.length === 0) {
      showToast('En az bir banka eklemelisin.');
      return;
    }

    setSaving(true);
    try {
      await adminSaveSettings({
        withdrawal_enabled: settingsForm.withdrawal_enabled ? '1' : '0',
        withdrawal_min_amount: settingsForm.withdrawal_min_amount || '0',
        withdrawal_fee_type: settingsForm.withdrawal_fee_type,
        withdrawal_fee_value: settingsForm.withdrawal_fee_value || '0',
        withdrawal_bank_options: JSON.stringify(settingsForm.banks),
      });
      showToast('Çekim ayarları kaydedildi.');
      loadSettings();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="space-y-5">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-sm">
          <div className="relative px-6 py-6">
            <div className="absolute right-8 top-0 h-28 w-28 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
                  <ShieldCheck size={13} /> Banka odaklı manuel ödeme operasyonu
                </div>
                <h1 className="text-2xl font-black">Ödeme Yönetimi</h1>
                <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-300">
                  Çekim taleplerini, kullanıcı banka hesaplarını ve çekim ayarlarını tek ekrandan yönet.
                </p>
              </div>
              <button
                onClick={() => {
                  loadData();
                  loadSettings();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/15"
              >
                <RefreshCw size={15} /> Yenile
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: 'Bekleyen Çekim', value: summary.pending_withdrawals || 0, icon: Clock, tone: 'text-amber-600 bg-amber-50' },
            { label: 'İşleme Alınan', value: summary.processing_withdrawals || 0, icon: RefreshCw, tone: 'text-blue-600 bg-blue-50' },
            { label: 'Banka Hesabı Onayı', value: summary.pending_accounts || 0, icon: CreditCard, tone: 'text-violet-600 bg-violet-50' },
            { label: 'Bakiye Bildirimi', value: summary.pending_topup_requests || 0, icon: Wallet, tone: 'text-cyan-600 bg-cyan-50' },
            { label: 'Bekleyen Toplam', value: fmtMoney(summary.pending_amount), icon: Wallet, tone: 'text-rose-600 bg-rose-50' },
            { label: 'Bugün Tamamlanan', value: fmtMoney(summary.completed_amount_today), icon: CheckCircle, tone: 'text-emerald-600 bg-emerald-50' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-gray-400">{item.label}</p>
                  <p className="mt-1 text-xl font-black text-gray-900">{item.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="grid gap-2 md:grid-cols-5">
            {[
              { id: 'topups', label: 'Bakiye Bildirimleri', count: summary.pending_topup_requests || 0 },
              { id: 'topup-packages', label: 'Bakiye Paketleri', count: topupPackages.length },
              { id: 'withdrawals', label: 'Çekim Talepleri', count: Number(summary.pending_withdrawals || 0) + Number(summary.processing_withdrawals || 0) },
              { id: 'accounts', label: 'Çekim Talebi Hesapları', count: summary.pending_accounts || 0 },
              { id: 'settings', label: 'Ayarlar' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition-all ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                {tab.count !== undefined ? <span className="ml-1 opacity-70">({tab.count})</span> : null}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'topups' && (
          <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">Bakiye Ödeme Bildirimleri</h2>
                <p className="text-xs font-semibold text-gray-400">Kullanıcının Shopier sipariş numarasını panelden kontrol edip onayla.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input
                    value={topupSearch}
                    onChange={(event) => setTopupSearch(event.target.value)}
                    placeholder="Kullanıcı, paket, sipariş no ara"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm font-semibold focus:border-violet-400 focus:outline-none sm:w-72"
                  />
                </label>
                <select
                  value={topupStatus}
                  onChange={(event) => setTopupStatus(event.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                >
                  <option value="">Tüm durumlar</option>
                  {Object.entries(TOPUP_STATUS).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm font-semibold text-gray-400">Yükleniyor...</div>
            ) : filteredTopupRequests.length === 0 ? (
              <div className="py-12 text-center text-sm font-semibold text-gray-400">Ödeme bildirimi bulunamadı.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50/80 text-[11px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-black">Bildirim</th>
                      <th className="px-4 py-3 font-black">Kullanıcı</th>
                      <th className="px-4 py-3 font-black">Paket</th>
                      <th className="px-4 py-3 font-black">Shopier Sipariş</th>
                      <th className="px-4 py-3 font-black">Tutar</th>
                      <th className="px-4 py-3 font-black">Durum</th>
                      <th className="px-4 py-3 font-black">Tarih</th>
                      <th className="px-4 py-3 text-right font-black">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTopupRequests.map((request) => {
                      const canProcess = request.status === 'pending';
                      return (
                        <tr key={request.id} className="align-top hover:bg-slate-50/70">
                          <td className="px-4 py-3">
                            <p className="font-black text-gray-900">#{request.id}</p>
                            <p className="mt-0.5 text-[11px] font-bold text-gray-400">{request.payer_name || 'Ad soyad yok'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="max-w-[150px] truncate font-extrabold text-gray-800">{request.username || '-'}</p>
                            <p className="mt-0.5 max-w-[190px] truncate text-xs font-semibold text-gray-400">{request.email || '-'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-black text-violet-700">{request.package_code || '-'}</p>
                            <p className="mt-0.5 max-w-[220px] truncate text-xs font-semibold text-gray-500">{request.package_title || '-'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs font-black text-gray-800">{request.shopier_order_no || '-'}</p>
                            {request.user_note ? <p className="mt-1 max-w-[260px] text-xs font-semibold text-gray-400">{request.user_note}</p> : null}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-black text-gray-900">{fmtMoney(request.balance_amount)}</p>
                            <p className="mt-0.5 text-[11px] font-bold text-gray-400">Ödeme: {fmtMoney(request.payable_amount)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill status={request.status} map={TOPUP_STATUS} />
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-500">
                            {fmtDate(request.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canProcess ? (
                              <div className="ml-auto flex min-w-[260px] flex-col gap-2">
                                <input
                                  value={topupNotes[`topup-${request.id}`] || ''}
                                  onChange={(event) => setTopupNotes((prev) => ({ ...prev, [`topup-${request.id}`]: event.target.value }))}
                                  placeholder="Admin notu"
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold focus:border-violet-400 focus:outline-none"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    disabled={saving}
                                    onClick={() => updateTopupRequest(request.id, 'approved')}
                                    className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                  >
                                    Onayla
                                  </button>
                                  <button
                                    disabled={saving}
                                    onClick={() => updateTopupRequest(request.id, 'rejected')}
                                    className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                  >
                                    Reddet
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs font-bold text-gray-400">
                                {request.processed_by_username ? `İşleyen: ${request.processed_by_username}` : 'Sonuçlandı'}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'topup-packages' && (
          <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900">{packageForm.id ? 'Paketi Düzenle' : 'Yeni Bakiye Paketi'}</h2>
                  <p className="text-xs font-semibold text-gray-400">Shopier ürün linkini pakete bağla.</p>
                </div>
                <button type="button" onClick={resetPackageForm} className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  value={packageForm.code}
                  onChange={(event) => setPackageForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                  placeholder="Paket kodu: OK250"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold focus:border-violet-400 focus:outline-none"
                />
                <input
                  value={packageForm.title}
                  onChange={(event) => setPackageForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Paket adı: 250 TL Bakiye"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold focus:border-violet-400 focus:outline-none"
                />
                <textarea
                  value={packageForm.description}
                  onChange={(event) => setPackageForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Kısa açıklama"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={packageForm.balance_amount}
                    onChange={(event) => setPackageForm((prev) => ({ ...prev, balance_amount: event.target.value }))}
                    placeholder="Eklenecek bakiye"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold focus:border-violet-400 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={packageForm.payable_amount}
                    onChange={(event) => setPackageForm((prev) => ({ ...prev, payable_amount: event.target.value }))}
                    placeholder="Shopier ödeme"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold focus:border-violet-400 focus:outline-none"
                  />
                </div>
                <input
                  value={packageForm.shopier_url}
                  onChange={(event) => setPackageForm((prev) => ({ ...prev, shopier_url: event.target.value }))}
                  placeholder="https://www.shopier.com/..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={packageForm.sort_order}
                    onChange={(event) => setPackageForm((prev) => ({ ...prev, sort_order: event.target.value }))}
                    placeholder="Sıra"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold focus:border-violet-400 focus:outline-none"
                  />
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700">
                    Aktif
                    <input
                      type="checkbox"
                      checked={packageForm.is_active}
                      onChange={(event) => setPackageForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={saveTopupPackage}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  <Save size={15} /> Paketi Kaydet
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-4">
                <h2 className="text-lg font-black text-gray-900">Shopier Bakiye Paketleri</h2>
                <p className="text-xs font-semibold text-gray-400">Kullanıcı tarafında aktif paketler görünecek.</p>
              </div>
              {loading ? (
                <div className="py-12 text-center text-sm font-semibold text-gray-400">Yükleniyor...</div>
              ) : topupPackages.length === 0 ? (
                <div className="py-12 text-center text-sm font-semibold text-gray-400">Henüz paket yok.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {topupPackages.map((pkg) => (
                    <div key={pkg.id} className="grid gap-3 p-4 md:grid-cols-[1fr_180px_150px] md:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-700">{pkg.code}</span>
                          <StatusPill status={pkg.is_active ? 'approved' : 'rejected'} map={{ approved: { label: 'Aktif', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' }, rejected: { label: 'Pasif', className: 'bg-slate-50 text-slate-500 border-slate-100' } }} />
                        </div>
                        <p className="mt-2 font-black text-gray-900">{pkg.title}</p>
                        <p className="mt-0.5 text-xs font-semibold text-gray-400">{pkg.description || 'Açıklama yok'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{fmtMoney(pkg.balance_amount)}</p>
                        <p className="text-xs font-bold text-gray-400">Ödeme: {fmtMoney(pkg.payable_amount)}</p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <a href={pkg.shopier_url} target="_blank" rel="noreferrer" className="rounded-xl bg-cyan-50 p-2 text-cyan-700 hover:bg-cyan-100">
                          <ExternalLink size={15} />
                        </a>
                        <button type="button" onClick={() => editPackage(pkg)} className="rounded-xl bg-violet-50 p-2 text-violet-700 hover:bg-violet-100">
                          <Edit3 size={15} />
                        </button>
                        <button type="button" onClick={() => deleteTopupPackage(pkg.id)} className="rounded-xl bg-rose-50 p-2 text-rose-700 hover:bg-rose-100">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">Çekim Talepleri</h2>
                <p className="text-xs font-semibold text-gray-400">Dekont alanı sadece admin tarafında görünür.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input
                    value={withdrawalSearch}
                    onChange={(event) => setWithdrawalSearch(event.target.value)}
                    placeholder="Kullanıcı, banka, IBAN ara"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm font-semibold focus:border-violet-400 focus:outline-none sm:w-64"
                  />
                </label>
                <select
                  value={withdrawalStatus}
                  onChange={(event) => setWithdrawalStatus(event.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                >
                  <option value="">Tüm durumlar</option>
                  {Object.entries(WITHDRAWAL_STATUS).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm font-semibold text-gray-400">Yükleniyor...</div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="py-12 text-center text-sm font-semibold text-gray-400">Çekim talebi bulunamadı.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50/80 text-[11px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-black">Talep</th>
                      <th className="px-4 py-3 font-black">Kullanıcı</th>
                      <th className="px-4 py-3 font-black">Banka / IBAN</th>
                      <th className="px-4 py-3 font-black">Tutar</th>
                      <th className="px-4 py-3 font-black">Masraf</th>
                      <th className="px-4 py-3 font-black">Durum</th>
                      <th className="px-4 py-3 font-black">Tarih</th>
                      <th className="px-4 py-3 text-right font-black">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredWithdrawals.map((request) => {
                      const isExpanded = expandedWithdrawalId === request.id;
                      const canProcess = ['pending', 'processing'].includes(request.status);
                      const totalAmount = request.total_amount || (Number(request.amount || 0) + Number(request.fee_amount || 0));

                      return (
                        <Fragment key={request.id}>
                          <tr className={`align-middle transition-colors ${isExpanded ? 'bg-violet-50/40' : 'hover:bg-slate-50/70'}`}>
                            <td className="px-4 py-3">
                              <p className="font-black text-gray-900">#{request.id}</p>
                              <p className="mt-0.5 text-[11px] font-bold text-gray-400">Toplam: {fmtMoney(totalAmount)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="max-w-[150px] truncate font-extrabold text-gray-800">{request.username || '-'}</p>
                              <p className="mt-0.5 max-w-[190px] truncate text-xs font-semibold text-gray-400">{request.email || '-'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="max-w-[260px] whitespace-normal break-words font-extrabold text-gray-800">{request.bank_name || request.account_label || '-'}</p>
                              <p className="mt-0.5 max-w-[260px] whitespace-normal break-all text-xs font-semibold text-gray-400">{request.iban || '-'}</p>
                            </td>
                            <td className="px-4 py-3 font-black text-gray-900">{fmtMoney(request.amount)}</td>
                            <td className="px-4 py-3 font-bold text-rose-500">{fmtMoney(request.fee_amount)}</td>
                            <td className="px-4 py-3">
                              <StatusPill status={request.status} map={WITHDRAWAL_STATUS} />
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-bold text-gray-600">{fmtDate(request.created_at)}</p>
                              {request.processed_at ? (
                                <p className="mt-0.5 text-[11px] font-semibold text-gray-400">Son işlem: {fmtDate(request.processed_at)}</p>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setExpandedWithdrawalId(isExpanded ? null : request.id)}
                                className={`rounded-xl px-3 py-2 text-xs font-black transition-colors ${
                                  isExpanded
                                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                                    : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                                }`}
                              >
                                {isExpanded ? 'Kapat' : 'İşlem'}
                              </button>
                            </td>
                          </tr>

                          {isExpanded ? (
                            <tr className="bg-slate-50/80">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                                  <div className="space-y-3">
                                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                                      <div className="rounded-2xl border border-white bg-white px-3 py-2 shadow-sm">
                                        <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Kullanıcı</p>
                                        <p className="mt-1 text-sm font-black text-gray-900">{request.username || '-'}</p>
                                        <p className="mt-0.5 truncate text-xs font-semibold text-gray-500">{request.email || '-'}</p>
                                      </div>
                                      <div className="rounded-2xl border border-white bg-white px-3 py-2 shadow-sm">
                                        <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Hesap Sahibi</p>
                                        <p className="mt-1 text-sm font-black text-gray-900">{request.account_holder || '-'}</p>
                                        <p className="mt-0.5 text-xs font-semibold text-gray-500">Bakiye: {fmtMoney(request.user_balance)}</p>
                                      </div>
                                      <div className="rounded-2xl border border-white bg-white px-3 py-2 shadow-sm">
                                        <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Banka</p>
                                        <p className="mt-1 text-sm font-black text-gray-900">{request.bank_name || request.account_label || '-'}</p>
                                        <p className="mt-0.5 text-xs font-semibold text-emerald-600">Toplam düşülen: {fmtMoney(totalAmount)}</p>
                                      </div>
                                      <div className="rounded-2xl border border-white bg-white px-3 py-2 shadow-sm">
                                        <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Güncelleme</p>
                                        <p className="mt-1 text-sm font-black text-gray-900">{fmtDate(request.updated_at)}</p>
                                        <p className="mt-0.5 text-xs font-semibold text-gray-500">Talep: {fmtDate(request.created_at)}</p>
                                      </div>
                                    </div>

                                    <div className="rounded-2xl border border-white bg-white px-3 py-2 shadow-sm">
                                      <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">IBAN</p>
                                      <p className="mt-1 break-all text-sm font-black text-gray-800">{request.iban || '-'}</p>
                                    </div>

                                    <div className="grid gap-2 md:grid-cols-3">
                                      {request.user_note ? (
                                        <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                                          <span className="font-black text-slate-400">Kullanıcı notu:</span> {request.user_note}
                                        </div>
                                      ) : null}
                                      {request.payment_reference ? (
                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                          <span className="font-black">Dekont:</span> {request.payment_reference}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                                    {canProcess ? (
                                      <div className="space-y-2">
                                        <input
                                          value={references[`withdrawal-${request.id}`] || ''}
                                          onChange={(event) => setReferences((prev) => ({ ...prev, [`withdrawal-${request.id}`]: event.target.value }))}
                                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                                          placeholder="Dekont / işlem referansı"
                                        />
                                        <div className="grid grid-cols-3 gap-2">
                                          {request.status === 'pending' ? (
                                            <button
                                              disabled={saving}
                                              onClick={() => updateWithdrawal(request.id, 'processing')}
                                              className="rounded-xl bg-blue-50 px-2 py-2 text-xs font-black text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                            >
                                              İşleme Al
                                            </button>
                                          ) : (
                                            <div />
                                          )}
                                          <button
                                            disabled={saving}
                                            onClick={() => updateWithdrawal(request.id, 'completed')}
                                            className="rounded-xl bg-emerald-50 px-2 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                          >
                                            Tamamla
                                          </button>
                                          <button
                                            disabled={saving}
                                            onClick={() => updateWithdrawal(request.id, 'rejected')}
                                            className="rounded-xl bg-rose-50 px-2 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                          >
                                            Reddet
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex h-full min-h-[116px] items-center justify-center rounded-2xl bg-gray-50 p-4 text-center text-xs font-bold text-gray-400">
                                        Bu talep sonuçlandı.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">Çekim Talebi Hesapları</h2>
                <p className="text-xs font-semibold text-gray-400">Kullanıcıların banka hesaplarını yatay listede yönet.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input
                    value={accountSearch}
                    onChange={(event) => setAccountSearch(event.target.value)}
                    placeholder="Kullanıcı, banka, IBAN ara"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm font-semibold focus:border-violet-400 focus:outline-none sm:w-64"
                  />
                </label>
                <select
                  value={accountStatus}
                  onChange={(event) => setAccountStatus(event.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                >
                  <option value="">Tüm durumlar</option>
                  {Object.entries(ACCOUNT_STATUS).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm font-semibold text-gray-400">Yükleniyor...</div>
            ) : filteredAccounts.length === 0 ? (
              <div className="py-12 text-center text-sm font-semibold text-gray-400">Banka hesabı bulunamadı.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50/80 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-black">Kullanıcı</th>
                      <th className="px-4 py-3 font-black">Banka</th>
                      <th className="px-4 py-3 font-black">Ad Soyad</th>
                      <th className="px-4 py-3 font-black">IBAN</th>
                      <th className="px-4 py-3 font-black">Durum</th>
                      <th className="px-4 py-3 font-black">Tarih</th>
                      <th className="px-4 py-3 font-black">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAccounts.map((account) => (
                      <tr key={account.id} className="align-top">
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-gray-900">{account.username || '-'}</div>
                          <div className="text-xs font-semibold text-gray-500">{account.email || '-'}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">{account.bank_name || account.label || '-'}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700">{account.account_holder || '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{account.iban || '-'}</td>
                        <td className="px-4 py-3"><StatusPill status={account.status} map={ACCOUNT_STATUS} /></td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-500">{fmtDate(account.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-[250px] flex-col gap-2">
                            {account.status === 'pending' ? (
                              <>
                                <div className="flex gap-2">
                                  <button
                                    disabled={saving}
                                    onClick={() => updateAccount(account.id, 'approved')}
                                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                  >
                                    <CheckCircle size={13} /> Onayla
                                  </button>
                                  <button
                                    disabled={saving}
                                    onClick={() => updateAccount(account.id, 'rejected')}
                                    className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                  >
                                    <XCircle size={13} /> Reddet
                                  </button>
                                  <button
                                    disabled={saving}
                                    onClick={() => deleteAccount(account.id)}
                                    className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                                  >
                                    <Trash2 size={13} /> Sil
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  disabled={saving}
                                  onClick={() => deleteAccount(account.id)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                                >
                                  <Trash2 size={13} /> Sil
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            {settingsLoading ? (
              <div className="py-12 text-center text-sm font-semibold text-gray-400">Ayarlar yükleniyor...</div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Çekim Ayarları</h2>
                    <p className="text-sm font-semibold text-gray-400">Banka listesi, minimum çekim ve komisyon tipini buradan yönet.</p>
                  </div>
                  <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                    <Settings2 size={20} />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">Para Çekimi Aktif</div>
                        <div className="mt-1 text-xs text-slate-400">Kapalıysa kullanıcı yeni çekim talebi oluşturamaz.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingsForm.withdrawal_enabled}
                        onChange={(event) => setSettingsForm((prev) => ({ ...prev, withdrawal_enabled: event.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                    </div>
                  </label>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Minimum Çekim Tutarı</div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settingsForm.withdrawal_min_amount}
                      onChange={(event) => setSettingsForm((prev) => ({ ...prev, withdrawal_min_amount: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Komisyon Tipi</div>
                    <select
                      value={settingsForm.withdrawal_fee_type}
                      onChange={(event) => setSettingsForm((prev) => ({ ...prev, withdrawal_fee_type: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                    >
                      <option value="fixed">Sabit TL</option>
                      <option value="percent">Yüzde</option>
                    </select>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Komisyon Değeri</div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settingsForm.withdrawal_fee_value}
                      onChange={(event) => setSettingsForm((prev) => ({ ...prev, withdrawal_fee_value: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                    />
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      {settingsForm.withdrawal_fee_type === 'percent' ? 'Örnek: 2.5 girersen %2.5 kesilir.' : 'Örnek: 15 girersen her talepte 15 TL kesilir.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
                    <Landmark size={16} className="text-violet-500" /> Kullanıcıların seçebileceği bankalar
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={newBankName}
                      onChange={(event) => setNewBankName(event.target.value)}
                      placeholder="Banka adı ekle"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addBank}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      Banka Ekle
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {settingsForm.banks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm font-semibold text-slate-400">
                        Henüz banka eklenmedi.
                      </div>
                    ) : settingsForm.banks.map((bank) => (
                      <div key={bank} className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                        {bank}
                        <button type="button" onClick={() => removeBank(bank)} className="text-rose-500 hover:text-rose-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 disabled:opacity-50"
                  >
                    <Save size={15} /> Ayarları Kaydet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
