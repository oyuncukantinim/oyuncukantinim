import { next } from '@vercel/edge';

const BOT_UA =
  /whatsapp|telegrambot|twitterbot|facebookexternalhit|linkedinbot|slackbot|discordbot|googlebot|bingbot|applebot|pinterest|snapchat/i;

const API_BASE  = 'https://api.oyuncukantinim.com.tr/api.php';
const SITE_URL  = 'https://beta.oyuncukantinim.com.tr';
const SITE_NAME = 'Oyuncu Kantinim';
const DEFAULT_DESC  = 'En uygun fiyatlı E-Pinler, güvenilir oyuncu pazarı ve anında teslimat garantisi.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHtml({ title, desc, image, url, type = 'website' }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta property="og:site_name" content="${esc(SITE_NAME)}" />
  <meta property="og:type" content="${type}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${esc(image)}" />
  <meta http-equiv="refresh" content="0;url=${esc(url)}" />
</head>
<body></body>
</html>`;
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA.test(ua)) return next();

  const url      = new URL(request.url);
  const pathname = url.pathname;

  let title = `${SITE_NAME} - Oyun Dünyasının Yeni Kantini`;
  let desc  = DEFAULT_DESC;
  let image = DEFAULT_IMAGE;
  let type  = 'website';

  // /listing/slug-123
  const listingMatch = pathname.match(/^\/listing\/.*?-(\d+)$/);
  if (listingMatch) {
    const id = listingMatch[1];
    try {
      const res  = await fetch(`${API_BASE}?action=get_listing&id=${id}`);
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        const l = data.data;
        title = `${l.title} — ${SITE_NAME}`;
        desc  = l.description
          ? l.description.slice(0, 200)
          : `${Number(l.price).toFixed(2)} ₺ · ${l.category_name || ''}`;

        const imgs     = Array.isArray(l.images) ? l.images.filter(Boolean) : [];
        const coverIdx = Number.isInteger(Number(l.cover_index)) ? Number(l.cover_index) : 0;
        const img      = imgs[coverIdx] || imgs[0] || l.item_image;
        if (img) image = img;

        type = 'product';
      }
    } catch (_) {}
  }

  const html = buildHtml({ title, desc, image, url: request.url, type });
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export const config = {
  matcher: ['/((?!_vercel|favicon|.*\\..+).*)'],
};
