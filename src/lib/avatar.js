export function isImageAvatar(value) {
  const text = String(value || '').trim();
  return text.startsWith('http://') || text.startsWith('https://') || text.startsWith('/');
}
