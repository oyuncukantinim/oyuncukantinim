import { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Loader2, Package, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetSettings, adminSaveSettings, adminUploadImage } from '../../lib/adminApi';
import { formatDopingDuration, getDopingTypeMeta, normalizeDopingOptions } from '../../lib/doping';

function getDopingOptionsFromSettings(settings, type) {
  return normalizeDopingOptions(settings[`listing_doping_${type}_options`], type);
}

function getDopingImage(options) {
  return options.find((option) => option.image)?.image || '';
}

function DopingSettingsPanel({ settings, setSetting, imageUploading, onTypeImageUpload }) {
  const setOptions = (type, nextOptions) => {
    setSetting(`listing_doping_${type}_options`, JSON.stringify(nextOptions));
  };

  const setTypeImage = (type, image) => {
    const current = getDopingOptionsFromSettings(settings, type);
    setOptions(type, current.map((option) => ({ ...option, image })));
  };

  const updateOption = (type, index, patch) => {
    const current = getDopingOptionsFromSettings(settings, type);
    setOptions(
      type,
      current.map((option, optionIndex) => (optionIndex === index ? { ...option, ...patch } : option)),
    );
  };

  const addOption = (type) => {
    const current = getDopingOptionsFromSettings(settings, type);
    const currentImage = getDopingImage(current);
    const nextHours = Math.max(1, ...current.map((option) => Number(option.hours) || 0)) + 24;
    const nextPrice = current[current.length - 1]?.price ?? (type === 'vitrine' ? 149 : 79);
    setOptions(type, [...current, { hours: nextHours, price: nextPrice, image: currentImage }]);
  };

  const removeOption = (type, index) => {
    const current = getDopingOptionsFromSettings(settings, type);
    if (current.length <= 1) return;
    setOptions(type, current.filter((_, optionIndex) => optionIndex !== index));
  };

  return (
    <div className="space-y-3">
      {['vitrine', 'featured'].map((type) => {
        const options = getDopingOptionsFromSettings(settings, type);
        const meta = getDopingTypeMeta(type);
        const dopingImage = getDopingImage(options);

        return (
          <div key={type} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.buttonClass}`}>
                  <Package size={13} />
                  {meta.label}
                </div>
                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500">{meta.description}</p>
              </div>
              <button
                type="button"
                onClick={() => addOption(type)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-600"
              >
                <Plus size={14} />
                Paket Ekle
              </button>
            </div>

            <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
                <div>
                  {dopingImage ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="flex h-24 items-center justify-center bg-slate-50 p-2">
                        <img loading="lazy" src={dopingImage} alt={`${meta.label} görseli`} className="h-full w-full object-contain" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-400">
                      <ImageIcon size={18} />
                      <span className="mt-1.5 text-xs font-semibold">Henüz görsel yok</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-600">Doping görseli</label>
                    <input
                      type="text"
                      value={dopingImage}
                      onChange={(event) => setTypeImage(type, event.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      id={`doping-image-input-${type}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        await onTypeImageUpload(type, file);
                        event.target.value = '';
                      }}
                    />
                    <label
                      htmlFor={`doping-image-input-${type}`}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-600"
                    >
                      {imageUploading === `listing_doping_${type}_image` ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      Görsel Yükle
                    </label>
                    {dopingImage ? (
                      <button
                        type="button"
                        onClick={() => setTypeImage(type, '')}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[11px] font-bold text-rose-600 transition-colors hover:bg-rose-50"
                      >
                        <X size={13} />
                        Görseli Kaldır
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2.5 p-3 lg:grid-cols-2 2xl:grid-cols-3">
              {options.map((option, index) => (
                <div key={`${type}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-black text-slate-900">{meta.label} Paketi</div>
                      <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {formatDopingDuration(option.hours)} · {Number(option.price || 0).toFixed(2)} ₺
                      </div>
                    </div>
                    {options.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeOption(type, index)}
                        className="rounded-md border border-rose-200 bg-white p-1 text-rose-500 transition-colors hover:bg-rose-50"
                        title="Paketi sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-600">Süre (saat)</label>
                      <input
                        type="number"
                        min="1"
                        value={option.hours}
                        onChange={(event) => updateOption(type, index, { hours: Math.max(1, Number(event.target.value || 1)) })}
                        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] focus:border-violet-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-slate-600">Fiyat (₺)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={option.price}
                        onChange={(event) => updateOption(type, index, { price: Math.max(0, Number(event.target.value || 0)) })}
                        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] focus:border-violet-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDoping() {
  const [settings, setSettings] = useState({});
  const [initialSettings, setInitialSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [imageUploading, setImageUploading] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    adminGetSettings()
      .then((response) => {
        setSettings(response.data || {});
        setInitialSettings(response.data || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setSetting = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

  const handleDopingImageUpload = async (type, file) => {
    const uploadKey = `listing_doping_${type}_image`;
    setImageUploading(uploadKey);
    try {
      const url = await adminUploadImage(file, 'doping', { preserveOriginal: true });
      const current = getDopingOptionsFromSettings(settings, type);
      setSetting(`listing_doping_${type}_options`, JSON.stringify(current.map((option) => ({ ...option, image: url }))));
      showToast('Doping görseli yüklendi.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setImageUploading('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminSaveSettings(settings);
      setInitialSettings(settings);
      showToast('Doping ayarları kaydedildi.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(initialSettings),
    [settings, initialSettings],
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="mx-auto max-w-[1400px] space-y-4">
        <section className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6 text-white shadow-xl shadow-slate-900/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-100">
                <Package size={13} />
                Doping
              </div>
              <h1 className="text-3xl font-black tracking-tight">Vitrin ve öne çıkar paketlerini ayrı bir merkezden yönet</h1>
              <p className="mt-2 text-sm leading-6 text-violet-100/80">
                Süre ve fiyat paketlerini yönet, her doping tipi için tek görsel kullan ve kullanıcıya daha temiz bir satın alma deneyimi sun.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 lg:min-w-[280px]">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">
                {hasChanges ? 'Kaydedilmemiş değişiklikler var' : 'Tüm değişiklikler kayıtlı'}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Kaydediliyor...' : 'Doping Ayarlarını Kaydet'}
              </button>
            </div>
          </div>
        </section>

        <DopingSettingsPanel
          settings={settings}
          setSetting={setSetting}
          imageUploading={imageUploading}
          onTypeImageUpload={handleDopingImageUpload}
        />
      </div>
    </AdminLayout>
  );
}
