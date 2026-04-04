import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Save, Settings as SettingsIcon, ToggleLeft, ToggleRight, Upload, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetSettings, adminSaveSettings, adminUploadImage } from '../../lib/adminApi';

const SETTINGS_ROWS = [
  [
    {
      section: 'Genel',
      fields: [
        { key: 'site_name', label: 'Site Adı', type: 'text', placeholder: 'Oyuncu Kantinim' },
        {
          key: 'site_logo',
          label: 'Site Logosu',
          type: 'image',
          placeholder: 'https://...',
          desc: 'Navbar, footer ve admin alanlarındaki logo bu görselden beslenir.',
        },
      ],
    },
    {
      section: 'Özellikler',
      fields: [
        { key: 'registration_enabled', label: 'Yeni Üyelik', type: 'toggle', desc: 'Kapalıysa yeni kullanıcılar kayıt olamaz.' },
        { key: 'balance_add_enabled', label: 'Bakiye Yükleme', type: 'toggle', desc: 'Kapalıysa kullanıcılar bakiye yükleyemez.' },
        { key: 'maintenance_mode', label: 'Bakım Modu', type: 'toggle', desc: 'Açıksa site kullanıcıya bakım ekranı gösterir.' },
      ],
    },
  ],
  [
    {
      section: 'Ticari',
      fields: [
        { key: 'commission_rate', label: 'Komisyon Oranı (%)', type: 'number', placeholder: '10' },
        { key: 'max_listings_per_user', label: 'Maks. İlan / Kullanıcı', type: 'number', placeholder: '50' },
        { key: 'min_listing_price', label: 'Minimum İlan Fiyatı (₺)', type: 'number', placeholder: '1' },
        { key: 'max_listing_price', label: 'Maksimum İlan Fiyatı (₺)', type: 'number', placeholder: '50000' },
        { key: 'max_listing_images', label: 'Maks. Görsel / İlan', type: 'number', placeholder: '5' },
        { key: 'listing_title_max', label: 'Başlık Karakter Limiti', type: 'number', placeholder: '100' },
        { key: 'listing_desc_max', label: 'Açıklama Karakter Limiti', type: 'number', placeholder: '2000' },
        { key: 'review_comment_max', label: 'Yorum Karakter Limiti', type: 'number', placeholder: '500' },
      ],
    },
    {
      section: 'Teslimat ve Havuz',
      fields: [
        { key: 'escrow_enabled', label: 'Emanet Sistemi', type: 'toggle', desc: 'Manuel ilanlarda ödeme, onay sonrası satıcıya aktarılır.' },
        { key: 'auto_confirm_days', label: 'Otomatik Onay (gün)', type: 'number', placeholder: '3' },
        { key: 'listing_duration_days', label: 'İlan Süresi (gün)', type: 'number', placeholder: '30' },
      ],
    },
  ],
  [
    {
      section: 'Duyuru Bandı',
      fields: [
        { key: 'announcement_active', label: 'Duyuru Bandı Aktif', type: 'toggle', desc: 'Site üstünde renkli duyuru bandı görünür.' },
        { key: 'announcement_text', label: 'Duyuru Metni', type: 'text', placeholder: 'Büyük indirim başladı...' },
      ],
    },
  ],
];

function SettingField({ field, value, onChange, onUpload, imageUploading }) {
  const fileInputRef = useRef(null);

  if (field.type === 'toggle') {
    return (
      <div className="flex items-center justify-between border-b border-gray-50 py-2.5 last:border-0">
        <div>
          <div className="text-sm font-semibold text-gray-800">{field.label}</div>
          {field.desc ? <div className="mt-0.5 text-xs text-gray-400">{field.desc}</div> : null}
        </div>
        <button
          onClick={() => onChange(value === '1' ? '0' : '1')}
          className={`ml-4 flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold transition-all ${
            value === '1'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          {value === '1' ? <><ToggleRight size={16} /> Açık</> : <><ToggleLeft size={16} /> Kapalı</>}
        </button>
      </div>
    );
  }

  if (field.type === 'image') {
    return (
      <div className="border-b border-gray-50 py-2.5 last:border-0">
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">{field.label}</label>
        {field.desc ? <div className="mb-2 text-xs text-gray-400">{field.desc}</div> : null}

        <div className="space-y-3">
          <input
            type="text"
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              await onUpload(file);
              event.target.value = '';
            }}
          />

          {value ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <div className="flex items-center justify-center bg-gray-50 px-4 py-4">
                <img src={value} alt="Site logosu" className="max-h-20 w-auto max-w-full object-contain" />
              </div>
              <div className="flex gap-2 border-t border-gray-200 bg-white p-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:border-violet-300 hover:text-violet-600 disabled:opacity-50"
                >
                  {imageUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Yeni Görsel Yükle
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
                >
                  <X size={13} /> Logoyu Kaldır
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 transition-all hover:border-violet-400 hover:bg-violet-50 disabled:opacity-50"
            >
              {imageUploading ? (
                <>
                  <Loader2 size={22} className="animate-spin text-violet-500" />
                  <span className="text-xs font-semibold text-gray-500">Logo yükleniyor...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={22} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500">Logo yüklemek için tıkla</span>
                  <span className="text-[10px] text-gray-400">PNG, SVG, WebP veya JPG kullanabilirsin.</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-50 py-2.5 last:border-0">
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">{field.label}</label>
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
      />
    </div>
  );
}

function SectionCard({ section, settings, set, onUpload, imageUploading }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5">
        <SettingsIcon size={15} className="text-violet-600" />
        <h3 className="text-sm font-extrabold text-gray-800">{section.section}</h3>
      </div>
      <div className="flex-1 px-5 py-1">
        {section.fields.map((field) => (
          <SettingField
            key={field.key}
            field={field}
            value={settings[field.key]}
            onChange={(nextValue) => set(field.key, nextValue)}
            onUpload={field.type === 'image' ? (file) => onUpload(field.key, file) : undefined}
            imageUploading={imageUploading === field.key}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
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
      .then((response) => setSettings(response.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

  const handleUpload = async (key, file) => {
    setImageUploading(key);
    try {
      const url = await adminUploadImage(file, 'branding');
      set(key, url);
      showToast('Logo yüklendi.');
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
      showToast('Ayarlar kaydedildi.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

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
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-4">
        {SETTINGS_ROWS.map((row, index) => (
          <div
            key={index}
            className={`grid gap-4 ${row.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}
          >
            {row.map((section) => (
              <SectionCard
                key={section.section}
                section={section}
                settings={settings}
                set={set}
                onUpload={handleUpload}
                imageUploading={imageUploading}
              />
            ))}
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50"
        >
          {saving ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Save size={16} /> Tüm Ayarları Kaydet
            </>
          )}
        </button>
      </div>
    </AdminLayout>
  );
}
