const API_ORIGIN = 'https://api.oyuncukantinim.com.tr';

export function isImageAvatar(value) {
  const text = String(value || '').trim();
  return (
    text.startsWith('http://') ||
    text.startsWith('https://') ||
    text.startsWith('/') ||
    text.startsWith('uploads/')
  );
}

export function normalizeAvatarSrc(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.startsWith('http://') || text.startsWith('https://')) return text;
  if (text.startsWith('//')) return `https:${text}`;
  if (text.startsWith('/uploads/')) return `${API_ORIGIN}${text}`;
  if (text.startsWith('uploads/')) return `${API_ORIGIN}/${text}`;
  return text;
}
