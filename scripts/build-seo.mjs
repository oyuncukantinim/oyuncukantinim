import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';
const SITE_ORIGIN = 'https://beta.oyuncukantinim.com.tr';
const SITE_NAME = 'Oyuncu Kantinim';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.png`;
const MAX_LISTING_PAGES = 30;
const MAX_PRERENDER_LISTINGS = 240;
const MAX_PRERENDER_PRODUCTS = 240;
const MAX_PRERENDER_SELLERS = 160;

function cleanText(value, fallback = '') {
  return String(value || fallback).replace(/\s+/g, ' ').trim();
}

function clampText(value, maxLength = 155) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function escapeHtml(value) {
  return cleanText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absoluteUrl(path = '/') {
  const text = cleanText(path, '/');
  if (/^https?:\/\//i.test(text)) return text;
  return `${SITE_ORIGIN}${text.startsWith('/') ? text : `/${text}`}`;
}

function makeSlug(title) {
  return String(title || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function listingPath(listing) {
  return `/listing/${makeSlug(listing.title) || 'listing'}-${listing.id}`;
}

function productPath(product) {
  return `/product/${product.product_path || `${makeSlug(product.slug || product.title) || 'product'}-${product.id}`}`;
}

function categoryPath(category) {
  return `/categories/${category.slug || category.id}`;
}

function pagePath(page) {
  return `/${page.slug}`;
}

async function api(action, query = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const json = await response.json();
    if (!response.ok || json.status !== 'success') throw new Error(json.message || `${action} failed`);
    return json.data;
  } finally {
    clearTimeout(timer);
  }
}

function flattenCategories(rows = []) {
  const list = [];
  const visit = (items) => {
    for (const item of items || []) {
      list.push(item);
      if (Array.isArray(item.children)) visit(item.children);
    }
  };
  visit(rows);
  return list;
}

async function fetchSeoData() {
  const [categoryTree, firstListings, customPages] = await Promise.all([
    api('get_categories_tree').catch(() => []),
    api('get_listings', { limit: 100, offset: 0, paginate: 1, sort: 'newest' }).catch(() => null),
    api('get_pages').catch(() => []),
  ]);
  const categories = flattenCategories(Array.isArray(categoryTree) ? categoryTree : []);

  const listings = [];
  const firstListingRows = Array.isArray(firstListings?.listings)
    ? firstListings.listings
    : (Array.isArray(firstListings) ? firstListings : []);
  listings.push(...firstListingRows);
  const totalListings = Number(firstListings?.total || firstListingRows.length || 0);
  const pages = Math.min(MAX_LISTING_PAGES, Math.ceil(totalListings / 100));
  for (let page = 1; page < pages; page += 1) {
    const data = await api('get_listings', { limit: 100, offset: page * 100, paginate: 1, sort: 'newest' }).catch(() => null);
    const rows = Array.isArray(data?.listings) ? data.listings : [];
    listings.push(...rows);
    if (rows.length < 100) break;
  }

  const productMap = new Map();
  const addProducts = (rows = []) => {
    rows.forEach((product) => {
      if (product?.id) productMap.set(String(product.id), product);
    });
  };
  addProducts(await api('get_products', { limit: 60, sort: 'featured' }).catch(() => []));
  await Promise.all(categories
    .filter((category) => category.content_type === 'product')
    .map(async (category) => {
      addProducts(await api('get_products', { category_id: category.id, limit: 60, sort: 'featured' }).catch(() => []));
    }));

  const products = Array.from(productMap.values());
  return { categories, listings, products, pages: Array.isArray(customPages) ? customPages : [] };
}

function baseMeta() {
  return {
    title: 'Oyuncu Kantinim - Yenilikçi Oyuncu Alışveriş Platformu',
    description: 'E-pin, oyun ürünleri, güvenilir oyuncu pazarı ve hızlı teslimat fırsatlarını Oyuncu Kantinim’de keşfet.',
    path: '/',
    image: DEFAULT_IMAGE,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_ORIGIN}/market?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  };
}

function categoryMeta(category) {
  const title = category.hero_title || category.name || 'Kategori';
  return {
    title: `${title} - ${SITE_NAME}`,
    description: clampText(category.hero_subtitle || `${category.name} kategorisindeki ürün ve ilanları güvenli alışveriş deneyimiyle incele.`),
    path: categoryPath(category),
    image: absoluteUrl(category.hero_image || category.banner_image || category.image || DEFAULT_IMAGE),
  };
}

function productMeta(product) {
  const price = Number(product.sale_price || product.price || 0);
  const path = productPath(product);
  const image = absoluteUrl(product.cover_image || DEFAULT_IMAGE);
  const description = clampText(product.seo_description || product.short_description || `${product.title} ürününü güvenli ödeme ve hızlı teslimat avantajıyla Oyuncu Kantinim’de satın al.`);
  return {
    title: `${product.title} Satın Al - ${SITE_NAME}`,
    description,
    path,
    image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      image,
      description,
      category: product.category_name || undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: product.currency || 'TRY',
        price: price ? price.toFixed(2) : undefined,
        availability: product.status === 'sold_out' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: absoluteUrl(path),
      },
    },
  };
}

function listingMeta(listing) {
  const path = listingPath(listing);
  const image = absoluteUrl(Array.isArray(listing.images) ? listing.images[listing.cover_index || 0] || listing.images[0] || DEFAULT_IMAGE : DEFAULT_IMAGE);
  const description = clampText(listing.description || `${listing.title} ilanını güvenli alışveriş sistemiyle Oyuncu Kantinim’de incele.`);
  return {
    title: `${listing.title} İlanı - ${SITE_NAME}`,
    description,
    path,
    image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: listing.title,
      image,
      description,
      category: listing.category_name || listing.category || undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'TRY',
        price: listing.price ? Number(listing.price).toFixed(2) : undefined,
        availability: 'https://schema.org/InStock',
        url: absoluteUrl(path),
      },
    },
  };
}

function sellerMeta(username) {
  return {
    title: `${username} Mağazası - ${SITE_NAME}`,
    description: clampText(`${username} satıcısının ilanlarını, değerlendirmelerini ve profilini Oyuncu Kantinim’de incele.`),
    path: `/p/${username}`,
    image: DEFAULT_IMAGE,
  };
}

function pageMeta(page) {
  return {
    title: page.seo_title || `${page.title} - ${SITE_NAME}`,
    description: clampText(page.seo_description || page.excerpt || `${page.title} sayfasını Oyuncu Kantinim üzerinde incele.`),
    path: pagePath(page),
    image: DEFAULT_IMAGE,
  };
}

function metaTags(meta) {
  const title = meta.title?.includes(SITE_NAME) ? meta.title : `${meta.title} - ${SITE_NAME}`;
  const description = clampText(meta.description || baseMeta().description);
  const canonical = absoluteUrl(meta.path || '/');
  const image = absoluteUrl(meta.image || DEFAULT_IMAGE);
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ];
  if (meta.jsonLd) {
    tags.push(`<script id="ok-page-jsonld" type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')}</script>`);
  }
  return tags.map((tag) => `    ${tag}`).join('\n');
}

function renderHtml(template, meta) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+(?:property|name)=["'](?:og:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, '')
    .replace(/<script\s+id=["']ok-page-jsonld["'][\s\S]*?<\/script>\s*/gi, '');
  return html.replace('</head>', `${metaTags(meta)}\n  </head>`);
}

async function writeRouteHtml(template, meta) {
  const routePath = meta.path === '/' ? 'index.html' : join(meta.path.replace(/^\/+|\/+$/g, ''), 'index.html');
  const filePath = join(distDir, routePath);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, renderHtml(template, meta), 'utf8');
}

function sitemapEntry(path, lastmod, priority = '0.7', changefreq = 'weekly') {
  const mod = lastmod ? new Date(lastmod) : new Date();
  const safeDate = Number.isNaN(mod.getTime()) ? new Date() : mod;
  return [
    '  <url>',
    `    <loc>${escapeHtml(absoluteUrl(path))}</loc>`,
    `    <lastmod>${safeDate.toISOString().slice(0, 10)}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

async function main() {
  const template = await readFile(join(distDir, 'index.html'), 'utf8');
  let data = { categories: [], listings: [], products: [], pages: [] };
  try {
    data = await fetchSeoData();
  } catch (error) {
    console.warn(`[seo] API verisi alınamadı, temel SEO dosyaları üretilecek: ${error.message}`);
  }

  const categoryMetas = data.categories.filter((category) => category.slug || category.id).map(categoryMeta);
  const productMetas = data.products.map(productMeta);
  const listingMetas = data.listings.map(listingMeta);
  const sellerMetas = Array.from(new Set(data.listings.map((listing) => listing.seller).filter(Boolean))).map(sellerMeta);
  const pageMetas = data.pages.filter((page) => page.slug).map(pageMeta);
  const staticMetas = [
    baseMeta(),
    { title: `Oyuncu Pazarı - ${SITE_NAME}`, description: 'Oyuncu ilanlarını, hesapları ve dijital ürünleri güvenli alışveriş sistemiyle keşfet.', path: '/market', image: DEFAULT_IMAGE },
    { title: `Kategoriler - ${SITE_NAME}`, description: 'Oyuncu Kantinim kategori ağacında oyun ürünleri, dijital kodlar ve kullanıcı ilanlarını keşfet.', path: '/categories', image: DEFAULT_IMAGE },
  ];

  const prerenderMetas = [
    ...staticMetas,
    ...categoryMetas,
    ...productMetas.slice(0, MAX_PRERENDER_PRODUCTS),
    ...listingMetas.slice(0, MAX_PRERENDER_LISTINGS),
    ...sellerMetas.slice(0, MAX_PRERENDER_SELLERS),
    ...pageMetas,
  ];

  for (const meta of prerenderMetas) {
    await writeRouteHtml(template, meta);
  }

  const sitemapRows = [
    ...staticMetas.map((meta) => sitemapEntry(meta.path, new Date(), meta.path === '/' ? '1.0' : '0.8', 'daily')),
    ...data.categories.map((category) => sitemapEntry(categoryPath(category), category.updated_at || category.created_at, '0.8', 'weekly')),
    ...data.products.map((product) => sitemapEntry(productPath(product), product.updated_at || product.created_at, '0.9', 'daily')),
    ...data.listings.map((listing) => sitemapEntry(listingPath(listing), listing.updated_at || listing.created_at, '0.7', 'daily')),
    ...sellerMetas.map((meta) => sitemapEntry(meta.path, new Date(), '0.5', 'weekly')),
    ...data.pages.map((page) => sitemapEntry(pagePath(page), page.updated_at, page.is_contract ? '0.5' : '0.6', 'monthly')),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRows.join('\n')}\n</urlset>\n`;
  await writeFile(join(distDir, 'sitemap.xml'), sitemap, 'utf8');

  const robots = [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /login',
    'Disallow: /profile',
    'Disallow: /messages',
    'Disallow: /notifications',
    'Disallow: /cart',
    'Disallow: /support',
    'Disallow: /gift-balance-coupon',
    'Disallow: /finance',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n');
  await writeFile(join(distDir, 'robots.txt'), robots, 'utf8');

  console.log(`[seo] ${prerenderMetas.length} HTML, ${sitemapRows.length} sitemap URL üretildi.`);
}

main().catch((error) => {
  console.warn(`[seo] SEO üretimi atlandı: ${error.message}`);
});
