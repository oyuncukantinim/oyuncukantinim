import { useState, useEffect } from 'react';
import { Save, ToggleLeft, ToggleRight, Settings as SettingsIcon } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetSettings, adminSaveSettings } from '../../lib/adminApi';

// Bölümler ikişer ikişer yan yana gösterilir
const SETTINGS_ROWS = [
  [
    {
      section: 'Genel',
      fields: [
        { key: 'site_name', label: 'Site Adı', type: 'text', placeholder: 'Oyuncu Kantinim' },
      ],
    },
    {
      section: 'Özellikler',
      fields: [
        { key: 'registration_enabled', label: 'Yeni Üyelik', type: 'toggle', desc: 'Kapalıysa yeni kullanıcılar kayıt olamaz' },
        { key: 'balance_add_enabled',  label: 'Bakiye Yükleme', type: 'toggle', desc: 'Kapalıysa kullanıcılar bakiye yükleyemez' },
        { key: 'maintenance_mode',     label: 'Bakım Modu', type: 'toggle', desc: 'Açıksa site kullanıcılara kapalı görünür' },
      ],
    },
  ],
  [
    {
      section: 'Ticari',
      fields: [
        { key: 'commission_rate',       label: 'Komisyon Oranı (%)', type: 'number', placeholder: '10' },
        { key: 'max_listings_per_user', label: 'Max İlan / Kullanıcı', type: 'number', placeholder: '50' },
        { key: 'min_listing_price',     label: 'Min İlan Fiyatı (₺)', type: 'number', placeholder: '1' },
        { key: 'max_listing_price',     label: 'Max İlan Fiyatı (₺)', type: 'number', placeholder: '50000' },
      ],
    },
    {
      section: 'Teslimat & Havuz',
      fields: [
        { key: 'escrow_enabled',        label: 'Emanet (Havuz) Sistemi', type: 'toggle', desc: 'Manuel ilanlar için para satıcıya onay sonrası geçer' },
        { key: 'auto_confirm_days',     label: 'Otomatik Onay (gün)', type: 'number', placeholder: '3' },
        { key: 'listing_duration_days', label: 'İlan Süresi (gün)', type: 'number', placeholder: '30' },
      ],
    },
  ],
  [
    {
      section: 'Duyuru Bandı',
      fields: [
        { key: 'announcement_active', label: 'Duyuru Bandı Aktif', type: 'toggle', desc: 'Site üstünde renkli bant gösterilir' },
        { key: 'announcement_text',   label: 'Duyuru Metni', type: 'text', placeholder: 'Büyük indirim başladı! ...' },
      ],
    },
  ],
];

function SettingField({ field, value, onChange }) {
  if (field.type === 'toggle') {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
        <div>
          <div className="font-semibold text-gray-800 text-sm">{field.label}</div>
          {field.desc && <div className="text-xs text-gray-400 mt-0.5">{field.desc}</div>}
        </div>
        <button
          onClick={() => onChange(value === '1' ? '0' : '1')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm border transition-all flex-shrink-0 ml-4 ${
            value === '1' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
        >
          {value === '1' ? <><ToggleRight size={16} /> Açık</> : <><ToggleLeft size={16} /> Kapalı</>}
        </button>
      </div>
    );
  }
  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
      />
    </div>
  );
}

function SectionCard({ section, settings, set }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <SettingsIcon size={15} className="text-violet-600" />
        <h3 className="font-extrabold text-gray-800 text-sm">{section.section}</h3>
      </div>
      <div className="px-5 py-1 flex-1">
        {section.fields.map(field => (
          <SettingField
            key={field.key}
            field={field}
            value={settings[field.key]}
            onChange={v => set(field.key, v)}
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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    adminGetSettings()
      .then(r => setSettings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminSaveSettings(settings);
      showToast('Ayarlar kaydedildi.');
    } catch (e) { showToast(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="max-w-5xl mx-auto space-y-4">
        {SETTINGS_ROWS.map((row, i) => (
          <div key={i} className={`grid gap-4 ${row.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {row.map(section => (
              <SectionCard key={section.section} section={section} settings={settings} set={set} />
            ))}
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20"
        >
          {saving
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Save size={16} /> Tüm Ayarları Kaydet</>
          }
        </button>
      </div>
    </AdminLayout>
  );
}
