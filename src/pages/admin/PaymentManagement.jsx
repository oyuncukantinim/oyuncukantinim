import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetPaymentManagement,
  adminUpdatePaymentAccount,
  adminUpdateWithdrawal,
} from '../../lib/adminApi';

const ACCOUNT_STATUS = {
  pending: { label: 'Onay Bekliyor', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  approved: { label: 'Onaylandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected: { label: 'Reddedildi', className: 'bg-rose-50 text-rose-700 border-rose-100' },
};

const WITHDRAWAL_STATUS = {
  pending: { label: 'Beklemede', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  processing: { label: 'İşleniyor', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  completed: { label: 'Tamamlandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected: { label: 'Reddedildi', className: 'bg-rose-50 text-rose-700 border-rose-100' },
  cancelled: { label: 'İptal Edildi', className: 'bg-slate-50 text-slate-600 border-slate-100' },
};

function fmtMoney(value) {
  return `${Number(value || 0).toFixed(2)} ₺`;
}

function fmtDate(value) {
  return value ? new Date(value).toLocaleString('tr-TR') : '-';
}

function StatusPill({ status, map }) {
  const meta = map[status] || { label: status || 'Belirsiz', className: 'bg-slate-50 text-slate-600 border-slate-100' };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${meta.className}`}>{meta.label}</span>;
}

function describeAccount(account) {
  if (!account) return '-';
  if (account.method === 'bank' || account.type === 'bank') {
    return `${account.bank_name || 'Banka'} · ${account.account_holder || '-'} · ${account.iban || '-'}`;
  }
  return `${account.crypto_currency || 'Kripto'} · ${account.crypto_network || 'Ağ'} · ${account.wallet_address || '-'}`;
}

export default function PaymentManagement() {
  const [activeTab, setActiveTab] = useState('withdrawals');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [data, setData] = useState({ withdrawals: [], accounts: [], summary: {} });
  const [withdrawalStatus, setWithdrawalStatus] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [notes, setNotes] = useState({});
  const [references, setReferences] = useState({});

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    adminGetPaymentManagement({
      withdrawal_status: withdrawalStatus,
      account_status: accountStatus,
    })
      .then((response) => setData(response.data || { withdrawals: [], accounts: [], summary: {} }))
      .catch((error) => showToast(error.message))
      .finally(() => setLoading(false));
  }, [withdrawalStatus, accountStatus, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const updateAccount = async (accountId, status) => {
    const note = notes[`account-${accountId}`] || '';
    if (status === 'rejected' && !note.trim()) {
      showToast('Reddetmek için admin notu yazın.');
      return;
    }
    setSaving(true);
    try {
      await adminUpdatePaymentAccount({ account_id: accountId, status, admin_note: note });
      showToast('Hesap durumu güncellendi.');
      setNotes((prev) => ({ ...prev, [`account-${accountId}`]: '' }));
      load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateWithdrawal = async (withdrawalId, status) => {
    const note = notes[`withdrawal-${withdrawalId}`] || '';
    const paymentReference = references[`withdrawal-${withdrawalId}`] || '';
    if (status === 'rejected' && !note.trim()) {
      showToast('Reddetmek için admin notu yazın.');
      return;
    }
    if (status === 'completed' && !paymentReference.trim()) {
      showToast('Tamamlamak için dekont, referans veya TX hash girin.');
      return;
    }
    setSaving(true);
    try {
      await adminUpdateWithdrawal({
        withdrawal_id: withdrawalId,
        status,
        admin_note: note,
        payment_reference: paymentReference,
      });
      showToast('Çekim talebi güncellendi.');
      setNotes((prev) => ({ ...prev, [`withdrawal-${withdrawalId}`]: '' }));
      setReferences((prev) => ({ ...prev, [`withdrawal-${withdrawalId}`]: '' }));
      load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const summary = data.summary || {};
  const withdrawals = data.withdrawals || [];
  const accounts = data.accounts || [];

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
                  <ShieldCheck size={13} /> Manuel onaylı ödeme operasyonu
                </div>
                <h1 className="text-2xl font-black">Ödeme Yönetimi</h1>
                <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-300">
                  Çekim taleplerini, banka ve kripto hesap onaylarını tek yerden yönet.
                </p>
              </div>
              <button
                onClick={load}
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
            { label: 'İşlenen Çekim', value: summary.processing_withdrawals || 0, icon: RefreshCw, tone: 'text-blue-600 bg-blue-50' },
            { label: 'Hesap Onayı', value: summary.pending_accounts || 0, icon: CreditCard, tone: 'text-violet-600 bg-violet-50' },
            { label: 'Bekleyen Tutar', value: fmtMoney(summary.pending_amount), icon: Wallet, tone: 'text-rose-600 bg-rose-50' },
            { label: 'Bugün Ödenen', value: fmtMoney(summary.completed_amount_today), icon: CheckCircle, tone: 'text-emerald-600 bg-emerald-50' },
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
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'withdrawals', label: 'Çekim Talepleri', count: withdrawals.length },
              { id: 'accounts', label: 'Hesap Onayları', count: accounts.length },
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

        {activeTab === 'withdrawals' ? (
          <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-black text-gray-900">Çekim Talepleri</h2>
              <select value={withdrawalStatus} onChange={(event) => setWithdrawalStatus(event.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none">
                <option value="">Tüm durumlar</option>
                {Object.entries(WITHDRAWAL_STATUS).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
              </select>
            </div>

            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="py-12 text-center text-sm font-semibold text-gray-400">Yükleniyor...</div>
              ) : withdrawals.length === 0 ? (
                <div className="py-12 text-center text-sm font-semibold text-gray-400">Çekim talebi bulunamadı.</div>
              ) : withdrawals.map((request) => (
                <div key={request.id} className="p-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-gray-900">#{request.id} · {fmtMoney(request.amount)}</p>
                        <StatusPill status={request.status} map={WITHDRAWAL_STATUS} />
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-black text-gray-500">{request.method === 'bank' ? 'Banka' : 'Kripto'}</span>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-[11px] font-black uppercase text-gray-400">Kullanıcı</p>
                          <p className="mt-1 font-extrabold text-gray-800">{request.username || '-'} · {request.email || '-'}</p>
                          <p className="mt-1 text-xs font-semibold text-gray-500">Güncel bakiye: {fmtMoney(request.user_balance)}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-[11px] font-black uppercase text-gray-400">Hesap</p>
                          <p className="mt-1 break-words text-xs font-bold text-gray-700">{describeAccount(request)}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs font-semibold text-gray-500 md:grid-cols-3">
                        <span>Talep: {fmtDate(request.created_at)}</span>
                        <span>Güncelleme: {fmtDate(request.updated_at)}</span>
                        <span>Referans: {request.payment_reference || '-'}</span>
                      </div>
                      {request.admin_note ? <p className="mt-2 text-xs font-bold text-rose-500">Admin notu: {request.admin_note}</p> : null}
                    </div>

                    <div className="space-y-2">
                      {['pending', 'processing'].includes(request.status) ? (
                        <>
                          <input
                            value={references[`withdrawal-${request.id}`] || ''}
                            onChange={(event) => setReferences((prev) => ({ ...prev, [`withdrawal-${request.id}`]: event.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold focus:border-violet-400 focus:outline-none"
                            placeholder="Dekont / referans / TX hash"
                          />
                          <textarea
                            value={notes[`withdrawal-${request.id}`] || ''}
                            onChange={(event) => setNotes((prev) => ({ ...prev, [`withdrawal-${request.id}`]: event.target.value }))}
                            rows={2}
                            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold focus:border-violet-400 focus:outline-none"
                            placeholder="Admin notu"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            {request.status === 'pending' ? (
                              <button disabled={saving} onClick={() => updateWithdrawal(request.id, 'processing')} className="rounded-xl bg-blue-50 px-2 py-2 text-xs font-black text-blue-700 hover:bg-blue-100 disabled:opacity-50">İşleme Al</button>
                            ) : null}
                            <button disabled={saving} onClick={() => updateWithdrawal(request.id, 'completed')} className="rounded-xl bg-emerald-50 px-2 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">Tamamla</button>
                            <button disabled={saving} onClick={() => updateWithdrawal(request.id, 'rejected')} className="rounded-xl bg-rose-50 px-2 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50">Reddet</button>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-2xl bg-gray-50 p-4 text-center text-xs font-bold text-gray-400">Bu talep sonuçlandı.</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-black text-gray-900">Kullanıcı Hesap Onayları</h2>
              <select value={accountStatus} onChange={(event) => setAccountStatus(event.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none">
                <option value="">Tüm durumlar</option>
                {Object.entries(ACCOUNT_STATUS).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
              </select>
            </div>

            <div className="grid gap-4 p-4 xl:grid-cols-2">
              {loading ? (
                <div className="col-span-full py-12 text-center text-sm font-semibold text-gray-400">Yükleniyor...</div>
              ) : accounts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-sm font-semibold text-gray-400">Hesap onay talebi bulunamadı.</div>
              ) : accounts.map((account) => (
                <div key={account.id} className="rounded-3xl border border-gray-100 bg-gray-50/70 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black text-gray-900">#{account.id} · {account.label || (account.type === 'bank' ? account.bank_name : `${account.crypto_currency} ${account.crypto_network}`)}</p>
                        <StatusPill status={account.status} map={ACCOUNT_STATUS} />
                      </div>
                      <p className="mt-1 text-xs font-bold text-gray-500">{account.username || '-'} · {account.email || '-'}</p>
                    </div>
                    {account.type === 'bank' ? <CreditCard className="text-violet-500" size={20} /> : <Wallet className="text-cyan-500" size={20} />}
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-xs font-semibold text-gray-600">
                    {describeAccount(account)}
                    {account.memo_tag ? <div className="mt-1">Memo/Tag: {account.memo_tag}</div> : null}
                    {account.user_note ? <div className="mt-2 text-gray-400">Kullanıcı notu: {account.user_note}</div> : null}
                    {account.admin_note ? <div className="mt-2 text-rose-500">Admin notu: {account.admin_note}</div> : null}
                  </div>
                  <div className="mt-3 text-xs font-semibold text-gray-400">Eklenme: {fmtDate(account.created_at)}</div>

                  {account.status === 'pending' ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={notes[`account-${account.id}`] || ''}
                        onChange={(event) => setNotes((prev) => ({ ...prev, [`account-${account.id}`]: event.target.value }))}
                        rows={2}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold focus:border-violet-400 focus:outline-none"
                        placeholder="Admin notu, red sebebi için zorunlu"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button disabled={saving} onClick={() => updateAccount(account.id, 'approved')} className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                          <CheckCircle size={13} /> Onayla
                        </button>
                        <button disabled={saving} onClick={() => updateAccount(account.id, 'rejected')} className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                          <XCircle size={13} /> Reddet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-gray-400">
                      <AlertTriangle size={13} /> Bu hesap sonucu verilmiş.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
