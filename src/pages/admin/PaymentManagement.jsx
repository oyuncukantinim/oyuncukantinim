import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Landmark,
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
  adminSaveSettings,
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
  const [activeTab, setActiveTab] = useState('withdrawals');
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [data, setData] = useState({ withdrawals: [], accounts: [], summary: {} });
  const [withdrawalStatus, setWithdrawalStatus] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [notes, setNotes] = useState({});
  const [references, setReferences] = useState({});
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
    })
      .then((response) => setData(response.data || { withdrawals: [], accounts: [], summary: {} }))
      .catch((error) => showToast(error.message))
      .finally(() => setLoading(false));
  }, [withdrawalStatus, accountStatus, showToast]);

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

  const updateAccount = async (accountId, status) => {
    setSaving(true);
    try {
      await adminUpdatePaymentAccount({
        account_id: accountId,
        status,
        admin_note: (notes[`account-${accountId}`] || '').trim(),
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
      loadData();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateWithdrawal = async (withdrawalId, status) => {
    const paymentReference = (references[`withdrawal-${withdrawalId}`] || '').trim();
    if (status === 'completed' && !paymentReference) {
      showToast('Tamamlamak için dekont girin.');
      return;
    }

    setSaving(true);
    try {
      await adminUpdateWithdrawal({
        withdrawal_id: withdrawalId,
        status,
        admin_note: (notes[`withdrawal-${withdrawalId}`] || '').trim(),
        payment_reference: paymentReference,
      });
      showToast('Çekim talebi güncellendi.');
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

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Bekleyen Çekim', value: summary.pending_withdrawals || 0, icon: Clock, tone: 'text-amber-600 bg-amber-50' },
            { label: 'İşleme Alınan', value: summary.processing_withdrawals || 0, icon: RefreshCw, tone: 'text-blue-600 bg-blue-50' },
            { label: 'Banka Hesabı Onayı', value: summary.pending_accounts || 0, icon: CreditCard, tone: 'text-violet-600 bg-violet-50' },
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
          <div className="grid gap-2 md:grid-cols-3">
            {[
              { id: 'withdrawals', label: 'Çekim Talepleri', count: withdrawals.length },
              { id: 'accounts', label: 'Çekim Talebi Hesapları', count: accounts.length },
              { id: 'settings', label: 'Ayarlar', count: settingsForm.banks.length },
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
                {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

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
              <div className="divide-y divide-gray-100">
                {filteredWithdrawals.map((request) => (
                  <div key={request.id} className="p-4">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-black text-gray-900">#{request.id}</p>
                          <StatusPill status={request.status} map={WITHDRAWAL_STATUS} />
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[11px] font-black uppercase text-gray-400">Kullanıcı</p>
                            <p className="mt-1 font-extrabold text-gray-800">{request.username || '-'}</p>
                            <p className="mt-1 text-xs font-semibold text-gray-500">{request.email || '-'}</p>
                            <p className="mt-1 text-xs font-semibold text-gray-500">Güncel bakiye: {fmtMoney(request.user_balance)}</p>
                          </div>
                          <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[11px] font-black uppercase text-gray-400">Banka Hesabı</p>
                            <p className="mt-1 text-sm font-extrabold text-gray-800">{request.bank_name || request.account_label || '-'}</p>
                            <p className="mt-1 text-xs font-semibold text-gray-500">{request.account_holder || '-'}</p>
                            <p className="mt-1 break-all text-xs font-semibold text-gray-500">{request.iban || '-'}</p>
                          </div>
                          <div className="rounded-2xl bg-gray-50 p-3">
                            <p className="text-[11px] font-black uppercase text-gray-400">Tutar Özeti</p>
                            <p className="mt-1 text-sm font-extrabold text-gray-900">Çekim: {fmtMoney(request.amount)}</p>
                            <p className="mt-1 text-xs font-semibold text-rose-500">Masraf: {fmtMoney(request.fee_amount)}</p>
                            <p className="mt-1 text-xs font-semibold text-emerald-600">Toplam düşülen: {fmtMoney(request.total_amount || (Number(request.amount || 0) + Number(request.fee_amount || 0)))}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs font-semibold text-gray-500">
                          <span>Talep: {fmtDate(request.created_at)}</span>
                          <span>Güncelleme: {fmtDate(request.updated_at)}</span>
                          {request.processed_at ? <span>Son işlem: {fmtDate(request.processed_at)}</span> : null}
                        </div>

                        {request.user_note ? (
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                            Kullanıcı notu: {request.user_note}
                          </div>
                        ) : null}

                        {request.payment_reference ? (
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                            Dekont: {request.payment_reference}
                          </div>
                        ) : null}

                        {request.admin_note ? (
                          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
                            Admin notu: {request.admin_note}
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        {['pending', 'processing'].includes(request.status) ? (
                          <>
                            <input
                              value={references[`withdrawal-${request.id}`] || ''}
                              onChange={(event) => setReferences((prev) => ({ ...prev, [`withdrawal-${request.id}`]: event.target.value }))}
                              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                              placeholder="Dekont / işlem referansı"
                            />
                            <textarea
                              value={notes[`withdrawal-${request.id}`] || ''}
                              onChange={(event) => setNotes((prev) => ({ ...prev, [`withdrawal-${request.id}`]: event.target.value }))}
                              rows={3}
                              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none"
                              placeholder="Admin notu, opsiyonel"
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
                          </>
                        ) : (
                          <div className="rounded-2xl bg-gray-50 p-4 text-center text-xs font-bold text-gray-400">
                            Bu talep sonuçlandı.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
                                <input
                                  value={notes[`account-${account.id}`] || ''}
                                  onChange={(event) => setNotes((prev) => ({ ...prev, [`account-${account.id}`]: event.target.value }))}
                                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold focus:border-violet-400 focus:outline-none"
                                  placeholder="Admin notu, opsiyonel"
                                />
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
                                {account.admin_note ? (
                                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                                    {account.admin_note}
                                  </div>
                                ) : null}
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
