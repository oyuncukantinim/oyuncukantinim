export const DEFAULT_FOOTER_POPULAR_LINKS = [
  { label: 'Valorant VP Satın Al', url: '/categories/valorant-vp' },
  { label: 'League of Legends RP Satın Al', url: '/categories/league-of-legends' },
  { label: 'PUBG UC Satın Al', url: '/categories/pubg' },
  { label: 'Steam Cüzdan Kodu Satın Al', url: '/categories/steam' },
  { label: 'Brawl Stars Elmas Satın Al', url: '/categories/brawl-stars' },
  { label: 'Robux Satın Al', url: '/categories/roblox' },
  { label: 'Metin2 EP Satın Al', url: '/categories/metin2' },
  { label: 'Google Play Hediye Kartı', url: '/categories/google-play' },
];

export const DEFAULT_FOOTER_QUICK_LINKS = [
  { label: 'İlan Pazarı', url: '/market' },
  { label: 'Tüm Kategoriler', url: '/categories' },
  { label: 'Bakiye Yükle', url: '/finance' },
  { label: 'İlan Ekle', url: '/create' },
  { label: 'Destek Merkezi', url: '/support' },
];

export const DEFAULT_FOOTER_SOCIAL_LINKS = [
  { type: 'instagram', url: '' },
  { type: 'youtube', url: '' },
  { type: 'discord', url: '' },
];

export const DEFAULT_FOOTER_CONTACT_ITEMS = [
  { type: 'support', label: 'Canlı Desteğe Bağlan', value: 'Destek merkezi', url: '/support' },
  { type: 'mail', label: 'E-posta', value: 'destek@oyuncukantinim.com.tr', url: 'mailto:destek@oyuncukantinim.com.tr' },
];

export const FOOTER_SOCIAL_TYPES = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X' },
  { value: 'discord', label: 'Discord' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'telegram', label: 'Telegram' },
];

export const FOOTER_CONTACT_TYPES = [
  { value: 'support', label: 'Destek' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Telefon' },
  { value: 'mail', label: 'E-posta' },
  { value: 'link', label: 'Link' },
];

function parseJsonList(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function normalizeFooterLinks(value, fallback = []) {
  const source = parseJsonList(value);
  const normalized = source
    .map((item) => ({
      label: String(item?.label || '').trim(),
      url: String(item?.url || '').trim(),
    }))
    .filter((item) => item.label && item.url);
  return normalized.length ? normalized : fallback;
}

export function normalizeFooterSocialLinks(value, fallback = []) {
  const source = parseJsonList(value);
  const allowedTypes = new Set(FOOTER_SOCIAL_TYPES.map((item) => item.value));
  const normalized = source
    .map((item) => ({
      type: allowedTypes.has(item?.type) ? item.type : 'link',
      url: String(item?.url || '').trim(),
    }))
    .filter((item) => item.url);
  return normalized.length ? normalized : fallback.filter((item) => item.url);
}

export function normalizeFooterContactItems(value, fallback = []) {
  const source = parseJsonList(value);
  const allowedTypes = new Set(FOOTER_CONTACT_TYPES.map((item) => item.value));
  const normalized = source
    .map((item) => ({
      type: allowedTypes.has(item?.type) ? item.type : 'link',
      label: String(item?.label || '').trim(),
      value: String(item?.value || '').trim(),
      url: String(item?.url || '').trim(),
    }))
    .filter((item) => item.label || item.value || item.url);
  return normalized.length ? normalized : fallback;
}

export function footerListToSetting(items) {
  return JSON.stringify(Array.isArray(items) ? items : []);
}
