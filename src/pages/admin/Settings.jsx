import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Settings as SettingsIcon, CalendarRange, Sparkles } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetSettings, adminSaveSettings } from '../../lib/adminApi';

const FIELD_GROUPS = [
  {
    title: 'Genel',
    fields: [
      { key: 'site_name', label: 'Site Adı' },
      { key: 'announcement_text', label: 'Duyuru Bandı Metni' },
    ],
  },
  {
    title: 'Ticari',
    fields: [
      { key: 'commission_rate', label: 'Varsayılan Komisyon (%)', type: 'number' },
      { key: 'min_listing_price', label: 'Min İlan Fiyatı', type: 'number' },
      { key: 'max_listing_price', label: 'Max İlan Fiyatı', type: 'number' },
      { key: 'auto_confirm_days', label: 'Otomatik Onay (gün)', type: 'number' },
    ],
  },
  {
    title: 'Planlı Bakım',
    fields: [
      { key: 'maintenance_schedule_start', label: 'Bakım Başlangıcı', type: 'datetime-local' },
      { key: 'maintenance_schedule_end', label: 'Bakım Bitişi', type: 'datetime-local' },
    ],
  },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    adminGetSettings()
      .then((res) => setSettings(res.data || {}))
      .catch((e) => showToast(e.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminSaveSettings(settings);
      showToast('Ayarlar kaydedildi.');
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="max-w-5xl mx-auto space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/admin/access-control" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div className="font-extrabold text-gray-900">Özellik Bayrakları ve Yetkiler</div>
            </div>
            <p className="text-sm text-gray-500">Kurucu tarafı feature flag, rol ve kritik işlem ayarlarını buradan yönetir.</p>
          </Link>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <CalendarRange size={18} />
              </div>
              <div className="font-extrabold text-gray-900">Planlı Bakım</div>
            </div>
            <p className="text-sm text-gray-500">Bakım zaman aralığı kaydedildiğinde API otomatik olarak bakım modunu açıp kapatır.</p>
          </div>
        </div>

        {FIELD_GROUPS.map((group) => (
          <div key={group.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <SettingsIcon size={16} />
              </div>
              <h3 className="font-extrabold text-gray-900">{group.title}</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    value={settings[field.key] || ''}
                    onChange={(e) => update(field.key, e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={16} /> Ayarları Kaydet</>}
        </button>
      </div>
    </AdminLayout>
  );
}

