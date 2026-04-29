import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BellRing,
  Image as ImageIcon,
  LayoutTemplate,
  LifeBuoy,
  Loader2,
  Mail,
  MessageSquare,
  Package,
  Plus,
  Save,
  Settings as SettingsIcon,
  Shield,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminDeleteUploadedImage, adminGetSettings, adminSaveSettings, adminUploadImage } from '../../lib/adminApi';
import { formatDopingDuration, getDopingTypeMeta, normalizeDopingOptions } from '../../lib/doping';

const DEFAULT_LISTING_IMAGE_WIDTH = 1500;
const DEFAULT_LISTING_IMAGE_HEIGHT = 1000;

const SETTINGS_TABS = [
  {
    id: 'general',
    label: 'Genel',
    icon: SettingsIcon,
    sections: [
      {
        section: 'Marka Kimliği',
        fields: [
          { key: 'site_name', label: 'Site Adı', type: 'text', placeholder: 'Oyuncu Kantinim' },
          {
            key: 'site_logo',
            label: 'Site Logosu',
            type: 'image',
            placeholder: 'https://...',
            desc: 'Navbar, footer, login ve admin alanlarındaki logo bu görselden beslenir.',
          },
          {
            key: 'site_logo_text',
            label: 'Logo Metni',
            type: 'text',
            placeholder: 'Oyuncu Kantinim',
            desc: 'Logo yanında eski marka yazısı gibi görünür.',
          },
          {
            key: 'site_favicon',
            label: 'Favicon',
            type: 'image',
            placeholder: 'https://...',
            accept: '.png,.svg,.webp,.jpg,.jpeg,.ico,image/png,image/svg+xml,image/webp,image/jpeg,image/x-icon,image/vnd.microsoft.icon',
            desc: 'Tarayıcı sekmesinde kullanılacak küçük simge. SVG, PNG ve ICO kullanabilirsin.',
          },
        ],
      },
      {
        section: 'Temel Kontroller',
        fields: [
          { key: 'registration_enabled', label: 'Yeni Üyelik', type: 'toggle', desc: 'Kapalıysa yeni kullanıcılar kayıt olamaz.' },
          { key: 'balance_add_enabled', label: 'Bakiye Yükleme', type: 'toggle', desc: 'Kapalıysa kullanıcılar bakiye yükleyemez.' },
          { key: 'maintenance_mode', label: 'Bakım Modu', type: 'toggle', desc: 'Açıksa site kullanıcıya bakım ekranı gösterir.' },
        ],
      },
    ],
  },
  {
    id: 'appearance',
    label: 'Görünüm',
    icon: LayoutTemplate,
    sections: [
      {
        section: 'Bakım Modu Metinleri',
        fields: [
          { key: 'maintenance_title', label: 'Bakım Başlığı', type: 'text', placeholder: 'Kısa bir bakım molasındayız' },
          { key: 'maintenance_message', label: 'Bakım Açıklaması', type: 'textarea', rows: 4, placeholder: 'Sitemizi daha iyi hale getirmek için kısa süreli bakım çalışması yapıyoruz.' },
        ],
      },
      {
        section: 'Varsayılan Görseller',
        fields: [
          { key: 'default_avatar', label: 'Varsayılan Avatar', type: 'image', placeholder: 'https://...', desc: 'Profil fotoğrafı olmayan kullanıcılar için kullanılır.' },
          { key: 'default_profile_banner', label: 'Varsayılan Profil Bannerı', type: 'image', placeholder: 'https://...', desc: 'Banner eklememiş profillerde görünür.' },
          { key: 'default_listing_image', label: 'Varsayılan İlan Görseli', type: 'image', placeholder: 'https://...', desc: 'Görseli olmayan ilanlarda gösterilir. Yüklenen görsel 1500x1000 px WebP olarak hazırlanır.' },
        ],
      },
      {
        section: 'Footer ve Yasal Metinler',
        fields: [
          { key: 'footer_copyright', label: 'Footer Telif Metni', type: 'text', placeholder: '© Oyuncu Kantinim. Tüm hakları saklıdır.' },
          { key: 'footer_tagline', label: 'Footer Alt Metni', type: 'text', placeholder: 'Oyuncular için güvenli alım satım platformu.' },
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
          { key: 'commission_rate', label: 'Komisyon Oranı (%)', type: 'number', placeholder: '10' },
          { key: 'min_listing_price', label: 'Minimum İlan Fiyatı (₺)', type: 'number', placeholder: '1' },
          { key: 'max_listing_price', label: 'Maksimum İlan Fiyatı (₺)', type: 'number', placeholder: '50000' },
        ],
      },
      {
        section: 'İlan Limitleri',
        fields: [
          { key: 'max_listings_per_user', label: 'Maks. İlan / Kullanıcı', type: 'number', placeholder: '50' },
          { key: 'max_listing_images', label: 'Maks. Görsel / İlan', type: 'number', placeholder: '5' },
          { key: 'listing_title_max', label: 'Başlık Karakter Limiti', type: 'number', placeholder: '100' },
          { key: 'listing_desc_max', label: 'Açıklama Karakter Limiti', type: 'number', placeholder: '2000' },
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
        section: 'Sipariş ve Onay',
        fields: [
          { key: 'escrow_enabled', label: 'Emanet Sistemi', type: 'toggle', desc: 'Manuel ilanlarda ödeme, onay sonrası satıcıya aktarılır.' },
          { key: 'auto_confirm_days', label: 'Otomatik Onay (gün)', type: 'number', placeholder: '3' },
          { key: 'listing_duration_days', label: 'İlan Süresi (gün)', type: 'number', placeholder: '30' },
        ],
      },
      {
        section: 'Teslimat Kuralları',
        fields: [
          { key: 'manual_delivery_max_hours', label: 'Manuel Teslimat Üst Sınırı (saat)', type: 'number', placeholder: '72' },
          { key: 'dispute_window_hours', label: 'Anlaşmazlık Açma Süresi (saat)', type: 'number', placeholder: '72' },
          { key: 'stock_item_max_count', label: 'Maks. Stok Satırı / İlan', type: 'number', placeholder: '500' },
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
        section: 'Ticket Kuralları',
        fields: [
          { key: 'support_max_linked_listings', label: 'Maks. Bağlı İlan / Talep', type: 'number', placeholder: '5' },
          { key: 'support_subject_max_length', label: 'Konu Karakter Limiti', type: 'number', placeholder: '120' },
          { key: 'support_message_max_length', label: 'Detay Karakter Limiti', type: 'number', placeholder: '2000' },
          { key: 'support_ticket_delete_enabled', label: 'Admin Ticket Silme', type: 'toggle', desc: 'Kapalıysa admin panelde ticket silme işlemi pasif olur.' },
          { key: 'support_auto_assign_enabled', label: 'Otomatik Atama', type: 'toggle', desc: 'Yeni ticketlar ilk uygun yöneticiye otomatik atanır.' },
        ],
      },
      {
        section: 'Destek Metinleri',
        fields: [
          { key: 'support_intro_text', label: 'Destek Giriş Metni', type: 'textarea', rows: 4, placeholder: 'İlan sorunları için doğru ilanları seçip destek talebi oluşturabilirsiniz.' },
          { key: 'support_closed_note', label: 'Kapalı Ticket Notu', type: 'text', placeholder: 'Bu destek talebi kapatıldı. Müşteri tarafından yeniden açılamaz.' },
        ],
      },
    ],
  },
  {
    id: 'messaging',
    label: 'Mesajlaşma',
    icon: MessageSquare,
    sections: [
      {
        section: 'Mesaj Kuralları',
        fields: [
          { key: 'message_max_length', label: 'Mesaj Karakter Limiti', type: 'number', placeholder: '2000' },
          { key: 'message_links_enabled', label: 'Link Gönderimi', type: 'toggle', desc: 'Kapalıysa mesajlarda link paylaşımı engellenir.' },
          { key: 'conversation_order_panel_enabled', label: 'Ortak Sipariş Paneli', type: 'toggle', desc: 'Sohbet alanındaki ortak sipariş paneli görünürlüğünü kontrol eder.' },
        ],
      },
      {
        section: 'Bildirim Kuralları',
        fields: [
          { key: 'notification_retention_days', label: 'Bildirim Saklama Süresi (gün)', type: 'number', placeholder: '30' },
          { key: 'sale_notification_enabled', label: 'Satış Bildirimleri', type: 'toggle', desc: 'Satış ve yeni sipariş bildirimlerini topluca açıp kapatır.' },
          { key: 'support_notification_enabled', label: 'Destek Bildirimleri', type: 'toggle', desc: 'Yeni destek talebi ve yeni destek yanıtı bildirimlerini kontrol eder.' },
        ],
      },
    ],
  },
  {
    id: 'contact',
    label: 'İletişim',
    icon: Mail,
    sections: [
      {
        section: 'Kayıt Doğrulama',
        fields: [
          { key: 'registration_email_verification_enabled', label: 'Kayıtta Mail Doğrulama', type: 'toggle', desc: 'Açıksa yeni üyelikte mail kodu doğrulamadan hesap açılmaz.' },
          { key: 'registration_email_code_expiry_minutes', label: 'Kod Geçerlilik Süresi (dk)', type: 'number', placeholder: '10' },
          { key: 'registration_email_subject', label: 'Doğrulama Mail Konusu', type: 'text', placeholder: 'E-posta doğrulama kodunuz' },
        ],
      },
      {
        section: 'SMTP Ayarları',
        fields: [
          { key: 'smtp_host', label: 'SMTP Sunucu', type: 'text', placeholder: 'smtp.yourmail.com' },
          { key: 'smtp_port', label: 'SMTP Port', type: 'number', placeholder: '587' },
          { key: 'smtp_secure', label: 'SMTP Güvenlik', type: 'text', placeholder: 'tls / ssl / none', desc: 'Çoğu servis için tls veya ssl kullanılır.' },
          { key: 'smtp_username', label: 'SMTP Kullanıcı Adı', type: 'text', placeholder: 'mail@alanadi.com' },
          { key: 'smtp_password', label: 'SMTP Şifre', type: 'password', placeholder: 'SMTP şifresi' },
          { key: 'smtp_from_email', label: 'Gönderen E-posta', type: 'text', placeholder: 'noreply@alanadi.com' },
          { key: 'smtp_from_name', label: 'Gönderen Adı', type: 'text', placeholder: 'Oyuncu Kantinim' },
        ],
      },
    ],
  },
  {
    id: 'security',
    label: 'Güvenlik',
    icon: Shield,
    sections: [
      {
        section: 'Kullanıcı Politikaları',
        fields: [
          { key: 'username_min_length', label: 'Kullanıcı Adı Min Uzunluk', type: 'number', placeholder: '3' },
          { key: 'username_max_length', label: 'Kullanıcı Adı Max Uzunluk', type: 'number', placeholder: '20' },
          { key: 'password_min_length', label: 'Şifre Min Uzunluk', type: 'number', placeholder: '6' },
        ],
      },
      {
        section: 'Admin Güvenliği',
        fields: [
          { key: 'admin_session_hours', label: 'Admin Oturum Süresi (saat)', type: 'number', placeholder: '24' },
          { key: 'ban_force_logout', label: 'Banlı Kullanıcıyı Oturumdan Düşür', type: 'toggle', desc: 'Açıksa banlanan kullanıcı ilk doğrulamada sistem dışına atılır.' },
          { key: 'audit_log_enabled', label: 'Ayar Değişiklik Logu', type: 'toggle', desc: 'Açıksa kritik admin ayar değişiklikleri ayrı loglanır.' },
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
        section: 'Duyuru Bandı',
        fields: [
          { key: 'announcement_active', label: 'Duyuru Bandı Aktif', type: 'toggle', desc: 'Site üstünde renkli duyuru bandı görünür.' },
          { key: 'announcement_text', label: 'Duyuru Metni', type: 'textarea', rows: 4, placeholder: 'Büyük indirim başladı...' },
        ],
      },
    ],
  },
  {
    id: 'email_templates',
    label: 'E-posta Şablonları',
    icon: Mail,
    sections: [
      {
        section: 'Yeni Sipariş Bildirimi',
        fields: [
          { key: 'email_tpl_new_order_enabled', label: 'Yeni Sipariş Maili Aktif', type: 'toggle', desc: 'Satıcıya yeni sipariş geldiğinde e-posta gönderilir.' },
          { key: 'email_tpl_new_order_subject', label: 'Konu', type: 'text', placeholder: '{site_name} - Yeni Sipariş Aldınız' },
          { key: 'email_tpl_new_order_body', label: 'İçerik (HTML)', type: 'textarea', rows: 6, placeholder: '<p>Merhaba {seller_name},</p><p>{buyer_name} kullanıcısı {item_title} ilanınızdan sipariş verdi. Tutar: {amount} ₺</p>' },
        ],
      },
      {
        section: 'Sipariş Tamamlandı Bildirimi',
        fields: [
          { key: 'email_tpl_order_complete_enabled', label: 'Tamamlandı Maili Aktif', type: 'toggle', desc: 'Sipariş onaylandığında satıcıya e-posta gönderilir.' },
          { key: 'email_tpl_order_complete_subject', label: 'Konu', type: 'text', placeholder: '{site_name} - Ödemeniz Hesabınıza Aktarıldı' },
          { key: 'email_tpl_order_complete_body', label: 'İçerik (HTML)', type: 'textarea', rows: 6, placeholder: '<p>Merhaba {seller_name},</p><p>Sipariş #{order_id} teslim onaylandı, ödemeniz bakiyenize aktarıldı.</p>' },
        ],
      },
      {
        section: 'Anlaşmazlık Bildirimi',
        fields: [
          { key: 'email_tpl_dispute_enabled', label: 'Anlaşmazlık Maili Aktif', type: 'toggle', desc: 'Anlaşmazlık açıldığında alıcı ve satıcıya e-posta gönderilir.' },
          { key: 'email_tpl_dispute_subject', label: 'Konu', type: 'text', placeholder: '{site_name} - Anlaşmazlık Bildirimi' },
          { key: 'email_tpl_dispute_body', label: 'İçerik (HTML)', type: 'textarea', rows: 6, placeholder: '<p>Merhaba,</p><p>Sipariş #{order_id} için anlaşmazlık açıldı. Lütfen destek ekibimizle iletişime geçin.</p>' },
        ],
      },
    ],
    _note: 'Kullanılabilir değişkenler: {site_name} {order_id} {amount} {item_title} {buyer_name} {seller_name} {date}',
  },
];

function normalizeValue(field, value) {
  if (field.type === 'toggle') return value === '1' ? '1' : '0';
  return value ?? '';
}

function getDopingOptionsFromSettings(settings, type) {
  return normalizeDopingOptions(settings[`listing_doping_${type}_options`], type);
}

function isUploadedSiteImage(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname.startsWith('/uploads/') && (
      parsed.hostname === window.location.hostname ||
      parsed.hostname === 'api.oyuncukantinim.com.tr' ||
      parsed.hostname === ''
    );
  } catch {
    return String(url).startsWith('/uploads/');
  }
}

const loadImageFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Lütfen geçerli bir görsel seçin.'));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Görsel okunamadı.'));
    };
    img.src = url;
  });

async function resizeDefaultListingImage(file) {
  const img = await loadImageFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = DEFAULT_LISTING_IMAGE_WIDTH;
  canvas.height = DEFAULT_LISTING_IMAGE_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Görsel işleme başlatılamadı.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, DEFAULT_LISTING_IMAGE_WIDTH, DEFAULT_LISTING_IMAGE_HEIGHT);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 1));
  if (!blob) {
    throw new Error('Varsayılan ilan görseli 1500x1000 px tuvale dönüştürülemedi.');
  }

  const baseName = String(file.name || 'varsayilan-ilan-gorseli')
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'varsayilan-ilan-gorseli';

  return new File([blob], `${baseName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}

function SettingField({ field, value, onChange, onUpload, onRemove, imageUploading }) {
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
          {value === '1' ? <><ToggleRight size={16} /> Açık</> : <><ToggleLeft size={16} /> Kapalı</>}
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
              <div className={`flex items-center justify-center bg-slate-50 ${field.key === 'default_listing_image' ? 'aspect-[3/2] p-0' : 'px-4 py-4'}`}>
                <img
                  src={value}
                  alt={field.label}
                  className={field.key === 'default_listing_image' ? 'h-full w-full object-cover' : 'max-h-20 w-auto max-w-full object-contain'}
                />
              </div>
              <div className="flex gap-2 border-t border-slate-200 bg-white p-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-600 disabled:opacity-50"
                >
                  {imageUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Yeni Görsel Yükle
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(value)}
                  disabled={imageUploading}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <X size={13} /> Kaldır
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
                  <span className="text-xs font-semibold text-slate-500">Görsel yükleniyor...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={22} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">Görsel yüklemek için tıkla</span>
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
        type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
      />
    </div>
  );
}

function SectionCard({ section, settings, set, onUpload, onRemove, imageUploading }) {
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
            onRemove={field.type === 'image' ? (url) => onRemove(field.key, url) : undefined}
            imageUploading={imageUploading === field.key}
          />
        ))}
      </div>
    </div>
  );
}

function DopingSettingsPanel({ settings, set, imageUploading, onOptionImageUpload, onOptionImageRemove }) {
  const setOptions = (type, nextOptions) => {
    set(`listing_doping_${type}_options`, JSON.stringify(nextOptions));
  };

  const updateOption = (type, index, patch) => {
    const current = getDopingOptionsFromSettings(settings, type);
    const next = current.map((option, optionIndex) => (optionIndex === index ? { ...option, ...patch } : option));
    setOptions(type, next);
  };

  const addOption = (type) => {
    const current = getDopingOptionsFromSettings(settings, type);
    const nextHours = Math.max(1, ...current.map((option) => Number(option.hours) || 0)) + 24;
    const nextPrice = current[current.length - 1]?.price ?? (type === 'vitrine' ? 149 : 79);
    setOptions(type, [...current, { hours: nextHours, price: nextPrice, image: '' }]);
  };

  const removeOption = (type, index) => {
    const current = getDopingOptionsFromSettings(settings, type);
    if (current.length <= 1) return;
    setOptions(type, current.filter((_, optionIndex) => optionIndex !== index));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Aktif Sekme</div>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Doping</h2>
          </div>
          <div className="text-xs leading-5 text-slate-400">
            Burada vitrin ve öne çıkar paketlerinin süre, fiyat ve görsellerini ayrı ayrı yönetebilirsin.
          </div>
        </div>
      </div>

      {['vitrine', 'featured'].map((type) => {
        const options = getDopingOptionsFromSettings(settings, type);
        const meta = getDopingTypeMeta(type);

        return (
          <div key={type} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${meta.buttonClass}`}>
                  <Package size={13} />
                  {meta.label}
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{meta.description}</p>
              </div>
              <button
                type="button"
                onClick={() => addOption(type)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-600"
              >
                <Plus size={14} />
                Paket Ekle
              </button>
            </div>

            <div className="grid gap-4 p-5 xl:grid-cols-2">
              {options.map((option, index) => (
                <div key={`${type}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-900">{meta.label} Paketi</div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">
                        {formatDopingDuration(option.hours)} · {Number(option.price || 0).toFixed(2)} ₺
                      </div>
                    </div>
                    {options.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeOption(type, index)}
                        className="rounded-xl border border-rose-200 bg-white p-2 text-rose-500 transition-colors hover:bg-rose-50"
                        title="Paketi sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">Sure (saat)</label>
                      <input
                        type="number"
                        min="1"
                        value={option.hours}
                        onChange={(event) => updateOption(type, index, { hours: Math.max(1, Number(event.target.value || 1)) })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">Fiyat (₺)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={option.price}
                        onChange={(event) => updateOption(type, index, { price: Math.max(0, Number(event.target.value || 0)) })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">Paket Görseli</label>
                    <input
                      type="text"
                      value={option.image || ''}
                      onChange={(event) => updateOption(type, index, { image: event.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
                    />
                    <div className="mt-3 space-y-3">
                      {option.image ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          <div className="flex h-40 items-center justify-center bg-slate-50 p-3">
                            <img src={option.image} alt={`${meta.label} paketi`} className="h-full w-full object-contain" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400">
                          <ImageIcon size={22} />
                          <span className="mt-2 text-xs font-semibold">Henüz görsel yok</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <input
                          id={`doping-image-input-${type}-${index}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            await onOptionImageUpload(type, index, file);
                            event.target.value = '';
                          }}
                        />
                        <label
                          htmlFor={`doping-image-input-${type}-${index}`}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-600"
                        >
                          {imageUploading === `listing_doping_${type}_options_${index}` ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                          Görsel Yükle
                        </label>
                        {option.image ? (
                          <button
                            type="button"
                            onClick={() => onOptionImageRemove(type, index, option.image)}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
                          >
                            <X size={13} />
                            Görseli Kaldır
                          </button>
                        ) : null}
                      </div>
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
      const uploadFile = key === 'default_listing_image' ? await resizeDefaultListingImage(file) : file;
      const url = await adminUploadImage(uploadFile, 'branding', { preserveOriginal: key === 'site_favicon' });
      set(key, url);
      showToast('Görsel yüklendi.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setImageUploading('');
    }
  };

  const handleRemoveImage = async (key, url) => {
    setImageUploading(key);
    try {
      if (isUploadedSiteImage(url)) {
        await adminDeleteUploadedImage(url);
      }
      set(key, '');
      if (key === 'default_listing_image') {
        await adminSaveSettings({ default_listing_image: '' });
        setInitialSettings((current) => ({ ...current, default_listing_image: '' }));
      }
      showToast('Görsel kaldırıldı.');
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
                Site Ayarları
              </div>
              <h1 className="text-3xl font-black tracking-tight">Marka, satış, destek ve güvenlik ayarlarını tek merkezden yönet</h1>
              <p className="mt-2 text-sm leading-6 text-violet-100/80">
                Bu ekran artık sadece temel ayar formu değil; sitenin görünüm, ticari kurallar ve operasyon davranışlarını yönettiğin kontrol merkezi.
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
                {saving ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
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
                      <div className="text-[11px] font-medium text-slate-400">{tab.sections.length} bölüm</div>
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
                  Bu sekmedeki ayarlar topluca kaydedilir. Değişiklikler kaydedildikten sonra site davranışına yansır.
                </div>
              </div>
            </div>

            {activeTabConfig._note ? (
              <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs text-violet-700 font-semibold">
                <span className="font-extrabold">Kullanılabilir değişkenler: </span>
                {'{site_name} {order_id} {amount} {item_title} {buyer_name} {seller_name} {date}'}
              </div>
            ) : null}

            {activeTabConfig.sections.map((section) => (
              <SectionCard
                key={section.section}
                section={section}
                settings={settings}
                set={set}
                onUpload={handleUpload}
                onRemove={handleRemoveImage}
                imageUploading={imageUploading}
              />
            ))}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}



