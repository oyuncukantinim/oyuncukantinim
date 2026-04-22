const API_ORIGIN = 'https://api.oyuncukantinim.com.tr';

function cleanAvatarValue(value) {
  return String(value || '').trim().replace(/\\/g, '/');
}

export function isImageAvatar(value) {
  const text = cleanAvatarValue(value);
  const lower = text.toLowerCase();
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('//') ||
    lower.startsWith('api.oyuncukantinim.com.tr/') ||
    text.startsWith('/') ||
    lower.startsWith('uploads/') ||
    lower.startsWith('profile/avatars/') ||
    lower.startsWith('profile/banners/') ||
    lower.includes('/uploads/profile/') ||
    /^avatar_u\d+_[a-z0-9_.-]+\.webp$/i.test(text) ||
    /^banner_u\d+_[a-z0-9_.-]+\.webp$/i.test(text)
  );
}

export function normalizeAvatarSrc(value) {
  const text = cleanAvatarValue(value);
  if (!text) return '';
  const lower = text.toLowerCase();
  const uploadsIndex = lower.indexOf('/uploads/profile/');

  if (lower.startsWith('https://')) return text;
  if (lower.startsWith('http://api.oyuncukantinim.com.tr/')) return text.replace(/^http:\/\//i, 'https://');
  if (lower.startsWith('http://')) return text;
  if (text.startsWith('//')) return `https:${text}`;
  if (lower.startsWith('api.oyuncukantinim.com.tr/')) return `https://${text}`;
  if (uploadsIndex >= 0) return `${API_ORIGIN}${text.slice(uploadsIndex)}`;
  if (text.startsWith('/uploads/')) return `${API_ORIGIN}${text}`;
  if (text.startsWith('uploads/')) return `${API_ORIGIN}/${text}`;
  if (lower.startsWith('profile/avatars/')) return `${API_ORIGIN}/uploads/${text}`;
  if (lower.startsWith('profile/banners/')) return `${API_ORIGIN}/uploads/${text}`;
  if (/^avatar_u\d+_[a-z0-9_.-]+\.webp$/i.test(text)) return `${API_ORIGIN}/uploads/profile/avatars/${text}`;
  if (/^banner_u\d+_[a-z0-9_.-]+\.webp$/i.test(text)) return `${API_ORIGIN}/uploads/profile/banners/${text}`;
  return text;
}
