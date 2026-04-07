const ALLOWED_DOMAINS = [
  'dropbox.com',
  'postimages.org', 'postimg.cc',
  'flickr.com', 'staticflickr.com',
  'hizliresim.com',
  'imgur.com', 'i.imgur.com',
  'api.oyuncukantinim.com.tr',
];

const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

export const ALLOWED_DOMAINS_LABEL = 'imgur.com, dropbox.com, postimages.org, flickr.com, hizliresim.com';

/**
 * Returns true if url is empty (optional) or is a valid image URL from an allowed domain.
 */
export function isValidImageUrl(url) {
  if (!url || !url.trim()) return true;
  try {
    const u = new URL(url.trim());
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    const validDomain = ALLOWED_DOMAINS.some(d => host === d || host.endsWith('.' + d));
    if (!validDomain) return false;
    const path = u.pathname.toLowerCase();
    const ext = path.split('.').pop().split('?')[0];
    return ALLOWED_EXTS.includes(ext);
  } catch {
    return false;
  }
}
