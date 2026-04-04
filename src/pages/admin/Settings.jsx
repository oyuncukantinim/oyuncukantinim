import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BellRing,
  Image as ImageIcon,
  LayoutTemplate,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Save,
  Settings as SettingsIcon,
  Shield,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetSettings, adminSaveSettings, adminUploadImage } from '../../lib/adminApi';

const SETTINGS_TABS = [
  {
    id: 'general',
    label: 'Genel',
    icon: SettingsIcon,
    sections: [
      {
        section: 'Marka KimliÄŸi',
        fields: [
          { key: 'site_name', label: 'Site AdÄ±', type: 'text', placeholder: 'Oyuncu Kantinim' },
          {
            key: 'site_logo',
            label: 'Site Logosu',
            type: 'image',
            placeholder: 'https://...',
            desc: 'Navbar, footer, login ve admin alanlarÄ±ndaki logo bu gÃ¶rselden beslenir.',
          },
          {
            key: 'site_logo_text',
            label: 'Logo Metni',
            type: 'text',
            placeholder: 'Oyuncu Kantinim',
            desc: 'Logo yanÄ±nda eski marka yazÄ±sÄ± gibi gÃ¶rÃ¼nÃ¼r.',
          },
          {
            key: 'site_favicon',
            label: 'Favicon',
            type: 'image',
            placeholder: 'https://...',
            accept: '.png,.svg,.webp,.jpg,.jpeg,.ico,image/png,image/svg+xml,image/webp,image/jpeg,image/x-icon,image/vnd.microsoft.icon',
            desc: 'TarayÄ±cÄ± sekmesinde kullanÄ±lacak kÃ¼Ã§Ã¼k simge. SVG, PNG ve ICO kullanabilirsin.',
          },
        ],
      },
      {
        section: 'Temel Kontroller',
        fields: [
          { key: 'registration_enabled', label: 'Yeni Ãœyelik', type: 'toggle', desc: 'KapalÄ±ysa yeni kullanÄ±cÄ±lar kayÄ±t olamaz.' },
          { key: 'balance_add_enabled', label: 'Bakiye YÃ¼kleme', type: 'toggle', desc: 'KapalÄ±ysa kullanÄ±cÄ±lar bakiye yÃ¼kleyemez.' },
          { key: 'maintenance_mode', label: 'BakÄ±m Modu', type: 'toggle', desc: 'AÃ§Ä±ksa site kullanÄ±cÄ±ya bakÄ±m ekranÄ± gÃ¶sterir.' },
        ],
      },
    ],
  },
  {
    id: 'appearance',
    label: 'GÃ¶rÃ¼nÃ¼m',
    icon: LayoutTemplate,
    sections: [
      {
        section: 'BakÄ±m Modu Metinleri',
        fields: [
          { key: 'maintenance_title', label: 'BakÄ±m BaÅŸlÄ±ÄŸÄ±', type: 'text', placeholder: 'KÄ±sa bir bakÄ±m molasÄ±ndayÄ±z' },
          { key: 'maintenance_message', label: 'BakÄ±m AÃ§Ä±klamasÄ±', type: 'textarea', rows: 4, placeholder: 'Sitemizi daha iyi hale getirmek iÃ§in kÄ±sa sÃ¼reli bakÄ±m Ã§alÄ±ÅŸmasÄ± yapÄ±yoruz.' },
        ],
      },
      {
        section: 'VarsayÄ±lan GÃ¶rseller',
        fields: [
          { key: 'default_avatar', label: 'VarsayÄ±lan Avatar', type: 'image', placeholder: 'https://...', desc: 'Profil fotoÄŸrafÄ± olmayan kullanÄ±cÄ±lar iÃ§in kullanÄ±lÄ±r.' },
          { key: 'default_profile_banner', label: 'VarsayÄ±lan Profil BannerÄ±', type: 'image', placeholder: 'https://...', desc: 'Banner eklememiÅŸ profillerde gÃ¶rÃ¼nÃ¼r.' },
          { key: 'default_listing_image', label: 'Varsayılan İlan Görseli', type: 'image', placeholder: 'https://...', desc: 'Görseli olmayan ilan kartlarında bu görsel gösterilir.' },
        ],
      },
      {
        section: 'Footer ve Yasal Metinler',
        fields: [
          { key: 'footer_copyright', label: 'Footer Telif Metni', type: 'text', placeholder: 'Â© Oyuncu Kantinim. TÃ¼m haklarÄ± saklÄ±dÄ±r.' },
          { key: 'footer_tagline', label: 'Footer Alt Metni', type: 'text', placeholder: 'Oyuncular iÃ§in gÃ¼venli alÄ±m satÄ±m platformu.' },
        ],
      },
    ],
  },
  {
    id: 'commerce',
    label: 'Ticari',
    icon: ShoppingBag,
    sections: [
      {
        section: 'Fiyat ve Komisyon',
        fields: [
          { key: 'commission_rate', label: 'Komisyon OranÄ± (%)', type: 'number', placeholder: '10' },
          { key: 'min_listing_price', label: 'Minimum Ä°lan FiyatÄ± (â‚º)', type: 'number', placeholder: '1' },
          { key: 'max_listing_price', label: 'Maksimum Ä°lan FiyatÄ± (â‚º)', type: 'number', placeholder: '50000' },
        ],
      },
      {
        section: 'Ä°lan Limitleri',
        fields: [
          { key: 'max_listings_per_user', label: 'Maks. Ä°lan / KullanÄ±cÄ±', type: 'number', placeholder: '50' },
          { key: 'max_listing_images', label: 'Maks. GÃ¶rsel / Ä°lan', type: 'number', placeholder: '5' },
          { key: 'listing_title_max', label: 'BaÅŸlÄ±k Karakter Limiti', type: 'number', placeholder: '100' },
          { key: 'listing_desc_max', label: 'AÃ§Ä±klama Karakter Limiti', type: 'number', placeholder: '2000' },
          { key: 'review_comment_max', label: 'Yorum Karakter Limiti', type: 'number', placeholder: '500' },
        ],
      },
    ],
  },
  {
    id: 'delivery',
    label: 'Teslimat',
    icon: Truck,
    sections: [
      {
        section: 'SipariÅŸ ve Onay',
        fields: [
          { key: 'escrow_enabled', label: 'Emanet Sistemi', type: 'toggle', desc: 'Manuel ilanlarda Ã¶deme, onay sonrasÄ± satÄ±cÄ±ya aktarÄ±lÄ±r.' },
          { key: 'auto_confirm_days', label: 'Otomatik Onay (gÃ¼n)', type: 'number', placeholder: '3' },
          { key: 'listing_duration_days', label: 'Ä°lan SÃ¼resi (gÃ¼n)', type: 'number', placeholder: '30' },
        ],
      },
      {
        section: 'Teslimat KurallarÄ±',
        fields: [
          { key: 'manual_delivery_max_hours', label: 'Manuel Teslimat Ãœst SÄ±nÄ±rÄ± (saat)', type: 'number', placeholder: '72' },
          { key: 'dispute_window_hours', label: 'AnlaÅŸmazlÄ±k AÃ§ma SÃ¼resi (saat)', type: 'number', placeholder: '72' },
          { key: 'stock_item_max_count', label: 'Maks. Stok SatÄ±rÄ± / Ä°lan', type: 'number', placeholder: '500' },
        ],
      },
    ],
  },
  {
    id: 'support',
    label: 'Destek',
    icon: LifeBuoy,
    sections: [
      {
        section: 'Ticket KurallarÄ±',
        fields: [
          { key: 'support_max_linked_listings', label: 'Maks. BaÄŸlÄ± Ä°lan / Talep', type: 'number', placeholder: '5' },
          { key: 'support_ticket_delete_enabled', label: 'Admin Ticket Silme', type: 'toggle', desc: 'KapalÄ±ysa admin panelde ticket silme iÅŸlemi pasif olur.' },
          { key: 'support_auto_assign_enabled', label: 'Otomatik Atama', type: 'toggle', desc: 'Yeni ticketlar ilk uygun yÃ¶neticiye otomatik atanÄ±r.' },
        ],
      },
      {
        section: 'Destek Metinleri',
        fields: [
          { key: 'support_intro_text', label: 'Destek GiriÅŸ Metni', type: 'textarea', rows: 4, placeholder: 'Ä°lan sorunlarÄ± iÃ§in doÄŸru ilanlarÄ± seÃ§ip destek talebi oluÅŸturabilirsiniz.' },
          { key: 'support_closed_note', label: 'KapalÄ± Ticket Notu', type: 'text', placeholder: 'Bu destek talebi kapatÄ±ldÄ±. MÃ¼ÅŸteri tarafÄ±ndan yeniden aÃ§Ä±lamaz.' },
        ],
      },
    ],
  },
  {
    id: 'messaging',
    label: 'MesajlaÅŸma',
    icon: MessageSquare,
    sections: [
      {
        section: 'Mesaj KurallarÄ±',
        fields: [
          { key: 'message_max_length', label: 'Mesaj Karakter Limiti', type: 'number', placeholder: '2000' },
          { key: 'message_links_enabled', label: 'Link GÃ¶nderimi', type: 'toggle', desc: 'KapalÄ±ysa mesajlarda link paylaÅŸÄ±mÄ± engellenir.' },
          { key: 'conversation_order_panel_enabled', label: 'Ortak SipariÅŸ Paneli', type: 'toggle', desc: 'Sohbet alanÄ±ndaki ortak sipariÅŸ paneli gÃ¶rÃ¼nÃ¼rlÃ¼ÄŸÃ¼nÃ¼ kontrol eder.' },
        ],
      },
      {
        section: 'Bildirim KurallarÄ±',
        fields: [
          { key: 'notification_retention_days', label: 'Bildirim Saklama SÃ¼resi (gÃ¼n)', type: 'number', placeholder: '30' },
          { key: 'sale_notification_enabled', label: 'SatÄ±ÅŸ Bildirimleri', type: 'toggle', desc: 'SatÄ±ÅŸ ve yeni sipariÅŸ bildirimlerini topluca aÃ§Ä±p kapatÄ±r.' },
          { key: 'support_notification_enabled', label: 'Destek Bildirimleri', type: 'toggle', desc: 'Yeni destek talebi ve yeni destek yanÄ±tÄ± bildirimlerini kontrol eder.' },
        ],
      },
    ],
  },
  {
    id: 'security',
    label: 'GÃ¼venlik',
    icon: Shield,
    sections: [
      {
        section: 'KullanÄ±cÄ± PolitikalarÄ±',
        fields: [
          { key: 'username_min_length', label: 'KullanÄ±cÄ± AdÄ± Min Uzunluk', type: 'number', placeholder: '3' },
          { key: 'username_max_length', label: 'KullanÄ±cÄ± AdÄ± Max Uzunluk', type: 'number', placeholder: '20' },
          { key: 'password_min_length', label: 'Åifre Min Uzunluk', type: 'number', placeholder: '6' },
        ],
      },
      {
        section: 'Admin GÃ¼venliÄŸi',
        fields: [
          { key: 'admin_session_hours', label: 'Admin Oturum SÃ¼resi (saat)', type: 'number', placeholder: '24' },
          { key: 'ban_force_logout', label: 'BanlÄ± KullanÄ±cÄ±yÄ± Oturumdan DÃ¼ÅŸÃ¼r', type: 'toggle', desc: 'AÃ§Ä±ksa banlanan kullanÄ±cÄ± ilk doÄŸrulamada sistem dÄ±ÅŸÄ±na atÄ±lÄ±r.' },
          { key: 'audit_log_enabled', label: 'Ayar DeÄŸiÅŸiklik Logu', type: 'toggle', desc: 'AÃ§Ä±ksa kritik admin ayar deÄŸiÅŸiklikleri ayrÄ± loglanÄ±r.' },
        ],
      },
    ],
  },
  {
    id: 'announcement',
    label: 'Duyuru',
    icon: BellRing,
    sections: [
      {
        section: 'Duyuru BandÄ±',
        fields: [
          { key: 'announcement_active', label: 'Duyuru BandÄ± Aktif', type: 'toggle', desc: 'Site Ã¼stÃ¼nde renkli duyuru bandÄ± gÃ¶rÃ¼nÃ¼r.' },
          { key: 'announcement_text', label: 'Duyuru Metni', type: 'textarea', rows: 4, placeholder: 'BÃ¼yÃ¼k indirim baÅŸladÄ±...' },
        ],
      },
    ],
  },
];

function normalizeValue(field, value) {
  if (field.type === 'toggle') return value === '1' ? '1' : '0';
  return value ?? '';
}

function SettingField({ field, value, onChange, onUpload, imageUploading }) {
  const fileInputRef = useRef(null);

  if (field.type === 'toggle') {
    return (
      <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
        <div className="pr-3">
          <div className="text-sm font-semibold text-slate-800">{field.label}</div>
          {field.desc ? <div className="mt-0.5 text-xs leading-5 text-slate-400">{field.desc}</div> : null}
        </div>
        <button
          type="button"
          onClick={() => onChange(value === '1' ? '0' : '1')}
          className={`ml-4 flex flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold transition-all ${
            value === '1'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          {value === '1' ? <><ToggleRight size={16} /> AÃ§Ä±k</> : <><ToggleLeft size={16} /> KapalÄ±</>}
        </button>
      </div>
    );
  }

  if (field.type === 'image') {
    return (
      <div className="border-b border-slate-100 py-3 last:border-0">
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}</label>
        {field.desc ? <div className="mb-2 text-xs leading-5 text-slate-400">{field.desc}</div> : null}

        <div className="space-y-3">
          <input
            type="text"
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept={field.accept || 'image/*'}
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              await onUpload(file);
              event.target.value = '';
            }}
          />

          {value ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="flex items-center justify-center bg-slate-50 px-4 py-4">
                <img src={value} alt={field.label} className="max-h-20 w-auto max-w-full object-contain" />
              </div>
              <div className="flex gap-2 border-t border-slate-200 bg-white p-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-600 disabled:opacity-50"
                >
                  {imageUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Yeni GÃ¶rsel YÃ¼kle
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <X size={13} /> KaldÄ±r
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 transition-all hover:border-violet-400 hover:bg-violet-50 disabled:opacity-50"
            >
              {imageUploading ? (
                <>
                  <Loader2 size={22} className="animate-spin text-violet-500" />
                  <span className="text-xs font-semibold text-slate-500">GÃ¶rsel yÃ¼kleniyor...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={22} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">GÃ¶rsel yÃ¼klemek iÃ§in tÄ±kla</span>
                  <span className="text-[10px] text-slate-400">PNG, SVG, WebP veya JPG kullanabilirsin.</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="border-b border-slate-100 py-3 last:border-0">
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}</label>
        {field.desc ? <div className="mb-2 text-xs leading-5 text-slate-400">{field.desc}</div> : null}
        <textarea
          rows={field.rows || 4}
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}</label>
      {field.desc ? <div className="mb-2 text-xs leading-5 text-slate-400">{field.desc}</div> : null}
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
      />
    </div>
  );
}

function SectionCard({ section, settings, set, onUpload, imageUploading }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
        <SettingsIcon size={15} className="text-violet-600" />
        <h3 className="text-sm font-extrabold text-slate-800">{section.section}</h3>
      </div>
      <div className="flex-1 px-5 py-1">
        {section.fields.map((field) => (
          <SettingField
            key={field.key}
            field={field}
            value={normalizeValue(field, settings[field.key])}
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
  const [initialSettings, setInitialSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [imageUploading, setImageUploading] = useState('');
  const [activeTab, setActiveTab] = useState('general');

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

  const set = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

  const handleUpload = async (key, file) => {
    setImageUploading(key);
    try {
      const url = await adminUploadImage(file, 'branding', { preserveOriginal: key === 'site_favicon' });
      set(key, url);
      showToast('GÃ¶rsel yÃ¼klendi.');
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
      showToast('Ayarlar kaydedildi.');
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

  const activeTabConfig = SETTINGS_TABS.find((tab) => tab.id === activeTab) || SETTINGS_TABS[0];

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
                <SettingsIcon size={13} />
                Site AyarlarÄ±
              </div>
              <h1 className="text-3xl font-black tracking-tight">Marka, satÄ±ÅŸ, destek ve gÃ¼venlik ayarlarÄ±nÄ± tek merkezden yÃ¶net</h1>
              <p className="mt-2 text-sm leading-6 text-violet-100/80">
                Bu ekran artÄ±k sadece temel ayar formu deÄŸil; sitenin gÃ¶rÃ¼nÃ¼m, ticari kurallar ve operasyon davranÄ±ÅŸlarÄ±nÄ± yÃ¶nettiÄŸin kontrol merkezi.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 lg:min-w-[280px]">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-violet-100/70">
                {hasChanges ? 'KaydedilmemiÅŸ deÄŸiÅŸiklikler var' : 'TÃ¼m deÄŸiÅŸiklikler kayÄ±tlÄ±'}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Kaydediliyor...' : 'TÃ¼m AyarlarÄ± Kaydet'}
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
              {SETTINGS_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all last:mb-0 ${
                      active
                        ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-violet-100' : 'bg-slate-100'}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-black">{tab.label}</div>
                      <div className="text-[11px] font-medium text-slate-400">{tab.sections.length} bÃ¶lÃ¼m</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Aktif Sekme</div>
                  <h2 className="mt-1 text-2xl font-black text-slate-950">{activeTabConfig.label}</h2>
                </div>
                <div className="text-xs leading-5 text-slate-400">
                  Bu sekmedeki ayarlar topluca kaydedilir. DeÄŸiÅŸiklikler canlÄ± Ã¶nizlemede anlÄ±k gÃ¶rÃ¼nÃ¼r.
                </div>
              </div>
            </div>

            {activeTabConfig.sections.map((section) => (
              <SectionCard
                key={section.section}
                section={section}
                settings={settings}
                set={set}
                onUpload={handleUpload}
                imageUploading={imageUploading}
              />
            ))}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

