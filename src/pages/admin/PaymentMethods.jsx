import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Settings2,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetSettings, adminSaveSettings } from '../../lib/adminApi';

const API_BASE = 'https://api.oyuncukantinim.com.tr/api.php';
const DEFAULT_FRONTEND_URL = 'https://beta.oyuncukantinim.com.tr';

const PAYMENT_METHODS = [
  {
    id: 'shopier',
    name: 'Shopier',
    defaultDisplayName: 'Kredi Kartı',
    icon: CreditCard,
    accent: 'from-cyan-500 to-violet-600',
    description: 'Bakiye yükleme ödemeleri Shopier güvenli ödeme sayfası üzerinden alınır.',
  },
];

const COMMISSION_TYPES = [
  { value: 'none', label: 'Komisyon yok' },
  { value: 'fixed', label: 'Sabit TL' },
  { value: 'percent', label: 'Yüzde (%)' },
];

function value(settings, key, fallback = '') {
  const current = settings?.[key];
  return current === undefined || current === null || current === '' ? fallback : current;
}

function boolValue(settings, key) {
  return String(settings?.[key] ?? '0') === '1';
}

function Field({ label, value: fieldValue, onChange, type = 'text', placeholder, helper, secret = false }) {
  const [visible, setVisible] = useState(false);
  const inputType = secret && !visible ? 'password' : type;

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black text-slate-700">{label}</span>
      <div className="relative">
        <input
          type={inputType}
          value={fieldValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        />
        {secret ? (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        ) : null}
      </div>
      {helper ? <span className="mt-1.5 block text-xs font-semibold leading-5 text-slate-400">{helper}</span> : null}
    </label>
  );
}

function ReadonlyUrl({ label, url }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <div className="mb-1.5 text-sm font-black text-slate-700">{label}</div>
      <div className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
        <code className="min-w-0 flex-1 truncate text-xs font-bold text-violet-700">{url}</code>
        <button
          type="button"
          onClick={copy}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
            copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 hover:text-violet-600'
          }`}
        >
          {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function PaymentMethods() {
  const [settings, setSettings] = useState({});
  const [initialSettings, setInitialSettings] = useState({});
  const [selectedMethod, setSelectedMethod] = useState('shopier');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminGetSettings()
      .then((response) => {
        const data = response.data || {};
        setSettings(data);
        setInitialSettings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = PAYMENT_METHODS.find((method) => method.id === selectedMethod) || PAYMENT_METHODS[0];
  const frontendBaseUrl = String(value(settings, 'frontend_base_url', DEFAULT_FRONTEND_URL)).replace(/\/+$/, '');
  const callbackUrl = `${API_BASE}?action=shopier_balance_callback`;
  const paymentStartUrl = `${API_BASE}?action=shopier_balance_pay`;
  const returnUrl = `${frontendBaseUrl}/profile?tab=balance`;

  const methodState = useMemo(() => ({
    methodName: value(settings, 'shopier_method_name', selected.name),
    displayName: value(settings, 'shopier_display_name', selected.defaultDisplayName),
    enabled: boolValue(settings, 'shopier_enabled'),
    apiKey: value(settings, 'shopier_api_key'),
    apiSecret: value(settings, 'shopier_api_secret'),
    osbApi: value(settings, 'shopier_osb_api'),
    osbSecret: value(settings, 'shopier_osb_secret'),
    websiteIndex: value(settings, 'shopier_website_index', '1'),
    commissionType: value(settings, 'shopier_commission_type', 'none'),
    commissionValue: value(settings, 'shopier_commission_value', '0'),
  }), [settings, selected]);

  const set = (key, nextValue) => setSettings((current) => ({ ...current, [key]: nextValue }));

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        shopier_method_name: methodState.methodName,
        shopier_display_name: methodState.displayName,
        shopier_enabled: methodState.enabled ? '1' : '0',
        shopier_api_key: methodState.apiKey,
        shopier_api_secret: methodState.apiSecret,
        shopier_osb_api: methodState.osbApi,
        shopier_osb_secret: methodState.osbSecret,
        shopier_website_index: methodState.websiteIndex,
        shopier_commission_type: methodState.commissionType,
        shopier_commission_value: methodState.commissionValue,
      };
      await adminSaveSettings(payload);
      setInitialSettings((current) => ({ ...current, ...payload }));
      setSettings((current) => ({ ...current, ...payload }));
      setMessage('Ödeme yöntemi ayarları kaydedildi.');
    } catch (error) {
      setMessage(error.message || 'Ayarlar kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const dirty = JSON.stringify({
    shopier_method_name: settings.shopier_method_name ?? '',
    shopier_display_name: settings.shopier_display_name ?? '',
    shopier_enabled: settings.shopier_enabled ?? '',
    shopier_api_key: settings.shopier_api_key ?? '',
    shopier_api_secret: settings.shopier_api_secret ?? '',
    shopier_osb_api: settings.shopier_osb_api ?? '',
    shopier_osb_secret: settings.shopier_osb_secret ?? '',
    shopier_website_index: settings.shopier_website_index ?? '',
    shopier_commission_type: settings.shopier_commission_type ?? '',
    shopier_commission_value: settings.shopier_commission_value ?? '',
  }) !== JSON.stringify({
    shopier_method_name: initialSettings.shopier_method_name ?? '',
    shopier_display_name: initialSettings.shopier_display_name ?? '',
    shopier_enabled: initialSettings.shopier_enabled ?? '',
    shopier_api_key: initialSettings.shopier_api_key ?? '',
    shopier_api_secret: initialSettings.shopier_api_secret ?? '',
    shopier_osb_api: initialSettings.shopier_osb_api ?? '',
    shopier_osb_secret: initialSettings.shopier_osb_secret ?? '',
    shopier_website_index: initialSettings.shopier_website_index ?? '',
    shopier_commission_type: initialSettings.shopier_commission_type ?? '',
    shopier_commission_value: initialSettings.shopier_commission_value ?? '',
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[420px] items-center justify-center">
          <Loader2 className="animate-spin text-violet-500" size={30} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.15em] text-violet-700">
              <ShieldCheck size={13} /> Finans
            </div>
            <h1 className="text-2xl font-black text-slate-900">Ödeme Yöntemleri</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">Bakiye yükleme için kullanılacak ödeme yöntemlerini buradan yönetebilirsin.</p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Ayarları Kaydet
          </button>
        </div>

        {message ? (
          <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700">
            {message}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <div className="space-y-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const active = selectedMethod === method.id;
              const enabled = boolValue(settings, `${method.id}_enabled`);
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                    active ? 'border-violet-300 ring-4 ring-violet-100' : 'border-slate-200 hover:border-violet-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${method.accent} text-white shadow-lg shadow-violet-900/20`}>
                      <Icon size={21} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-base font-black text-slate-900">{value(settings, `${method.id}_display_name`, method.defaultDisplayName)}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {enabled ? 'Aktif' : 'Pasif'}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{method.description}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className={`bg-gradient-to-r ${selected.accent} px-5 py-5 text-white`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/15">
                    <selected.icon size={22} />
                  </span>
                  <div>
                    <h2 className="text-xl font-black">{selected.name}</h2>
                    <p className="text-sm font-semibold text-white/75">Ödeme methodu düzenle</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set('shopier_enabled', methodState.enabled ? '0' : '1')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/20"
                >
                  {methodState.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {methodState.enabled ? 'Aktif' : 'Pasif'}
                </button>
              </div>
            </div>

            <div className="space-y-6 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Method adı" value={methodState.methodName} onChange={(next) => set('shopier_method_name', next)} placeholder="Shopier" />
                <Field label="Görünür adı" value={methodState.displayName} onChange={(next) => set('shopier_display_name', next)} placeholder="Kredi Kartı" />
                <Field label="Shopier API" value={methodState.apiKey} onChange={(next) => set('shopier_api_key', next)} placeholder="Shopier API Key" />
                <Field label="Shopier API Şifre" value={methodState.apiSecret} onChange={(next) => set('shopier_api_secret', next)} placeholder="Shopier API Secret" secret />
                <Field label="Shopier Website Index" value={methodState.websiteIndex} onChange={(next) => set('shopier_website_index', next)} type="number" placeholder="1" />
              </div>

              <div className="grid gap-4 border-y border-slate-100 py-5 lg:grid-cols-2">
                <ReadonlyUrl label="Shopier Ödeme Adresi" url={paymentStartUrl} />
                <ReadonlyUrl label="Shopier Callback / Dönüş Adresi" url={callbackUrl} />
                <ReadonlyUrl label="Kullanıcı Dönüş Adresi" url={returnUrl} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Shopier OSB API" value={methodState.osbApi} onChange={(next) => set('shopier_osb_api', next)} placeholder="OSB API" />
                <Field label="Shopier OSB Şifre" value={methodState.osbSecret} onChange={(next) => set('shopier_osb_secret', next)} placeholder="OSB Şifre" secret />
              </div>

              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1fr]">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-black text-slate-700">Shopier Komisyon Tipi</span>
                  <select
                    value={methodState.commissionType}
                    onChange={(event) => set('shopier_commission_type', event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  >
                    {COMMISSION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Shopier Komisyon Değeri"
                  value={methodState.commissionValue}
                  onChange={(next) => set('shopier_commission_value', next)}
                  type="number"
                  placeholder="0"
                  helper="Sabit TL seçilirse doğrudan TL eklenir, yüzde seçilirse yüklenen tutar üzerinden hesaplanır."
                />
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs font-semibold leading-5 text-cyan-800">
                Kullanıcı bakiyesine sadece yüklemek istediği ana tutar eklenir. Komisyon ödeme tutarına eklenir ve kullanıcıdan tahsil edilir.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
