import { useEffect } from 'react';

export const SITE_ORIGIN = 'https://beta.oyuncukantinim.com.tr';
const SITE_NAME = 'Oyuncu Kantinim';
const DEFAULT_DESCRIPTION = 'Oyuncu Kantinim ile oyun ürünleri, dijital kodlar ve oyuncu ilanlarını güvenli alışveriş deneyimiyle keşfet.';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.png`;

function cleanText(value, fallback = '') {
  return String(value || fallback)
    .replace(/\s+/g, ' ')
    .trim();
}

function clampText(value, maxLength) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function absoluteUrl(value = '/') {
  const text = cleanText(value, '/');
  if (/^https?:\/\//i.test(text)) return text;
  return `${SITE_ORIGIN}${text.startsWith('/') ? text : `/${text}`}`;
}

function upsertMeta(selector, createAttrs, valueAttr, value) {
  if (!value) return;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    Object.entries(createAttrs).forEach(([key, attrValue]) => tag.setAttribute(key, attrValue));
    document.head.appendChild(tag);
  }
  tag.setAttribute(valueAttr, value);
}

function upsertLink(rel, href) {
  if (!href) return;
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  const existing = document.head.querySelector(`script#${id}`);
  if (!data) {
    existing?.remove();
    return;
  }
  const content = JSON.stringify(data);
  if (existing) {
    existing.textContent = content;
    return;
  }
  const tag = document.createElement('script');
  tag.id = id;
  tag.type = 'application/ld+json';
  tag.textContent = content;
  document.head.appendChild(tag);
}

export function buildPageTitle(title) {
  const cleanTitle = cleanText(title, SITE_NAME);
  return cleanTitle.includes(SITE_NAME) ? cleanTitle : `${cleanTitle} - ${SITE_NAME}`;
}

export function buildProductSeo(product) {
  const price = Number(product?.sale_price || product?.price || 0);
  const title = buildPageTitle(`${product?.title || 'Oyun Ürünü'} Satın Al`);
  const description = clampText(
    product?.seo_description ||
      product?.short_description ||
      `${product?.title || 'Bu oyun ürünü'} için güvenli ödeme ve hızlı teslimat fırsatlarını Oyuncu Kantinim'de incele.`,
    155,
  );
  const path = product?.product_path ? `/product/${product.product_path}` : window.location.pathname;
  const image = absoluteUrl(product?.cover_image || DEFAULT_IMAGE);

  return {
    title,
    description,
    canonical: absoluteUrl(path),
    image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product?.title || 'Oyun Ürünü',
      image,
      description,
      category: product?.category_name || undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: product?.currency || 'TRY',
        price: price ? String(price.toFixed(2)) : undefined,
        availability: product?.status === 'sold_out' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: absoluteUrl(path),
      },
    },
  };
}

export function buildListingSeo(listing) {
  const title = buildPageTitle(`${listing?.title || 'Oyuncu İlanı'} İlanı`);
  const description = clampText(
    listing?.description ||
      `${listing?.title || 'Oyuncu ilanı'} için fiyat, satıcı ve güvenli alışveriş detaylarını Oyuncu Kantinim'de incele.`,
    155,
  );
  const path = window.location.pathname;
  const image = absoluteUrl(Array.isArray(listing?.images) ? listing.images[listing.cover_index || 0] || listing.images[0] : DEFAULT_IMAGE);

  return {
    title,
    description,
    canonical: absoluteUrl(path),
    image,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: listing?.title || 'Oyuncu İlanı',
      image,
      description,
      category: listing?.category_name || listing?.category || undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'TRY',
        price: listing?.price ? String(Number(listing.price).toFixed(2)) : undefined,
        availability: 'https://schema.org/InStock',
        url: absoluteUrl(path),
      },
    },
  };
}

export function buildCategorySeo(category) {
  const name = category?.hero_title || category?.name || 'Oyun Kategorileri';
  const title = buildPageTitle(name);
  const description = clampText(
    category?.hero_subtitle ||
      `${category?.name || 'Oyun'} kategorisindeki ürün ve ilanları güvenli alışveriş deneyimiyle incele.`,
    155,
  );
  const path = category?.slug ? `/categories/${category.slug}` : window.location.pathname;
  return {
    title,
    description,
    canonical: absoluteUrl(path),
    image: absoluteUrl(category?.hero_image || category?.banner_image || category?.image || DEFAULT_IMAGE),
  };
}

export function useSeo(meta = {}) {
  useEffect(() => {
    const title = buildPageTitle(meta.title || SITE_NAME);
    const description = clampText(meta.description || DEFAULT_DESCRIPTION, 155);
    const canonical = absoluteUrl(meta.canonical || window.location.pathname);
    const image = absoluteUrl(meta.image || DEFAULT_IMAGE);

    document.title = title;
    upsertMeta('meta[name="description"]', { name: 'description' }, 'content', description);
    upsertLink('canonical', canonical);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'content', meta.type || 'website');
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, 'content', SITE_NAME);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, 'content', title);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, 'content', description);
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, 'content', canonical);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, 'content', image);
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'content', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, 'content', title);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, 'content', description);
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, 'content', image);
    upsertJsonLd('ok-page-jsonld', meta.jsonLd || null);
  }, [meta]);
}
