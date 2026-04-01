const SITE_NAME = 'Oyuncu Kantinim';

export function setPageSeo({ title, description, jsonLd }) {
  if (typeof document === 'undefined') return;
  if (title) document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  if (description != null) meta.setAttribute('content', description);

  document.getElementById('dynamic-jsonld')?.remove();
  if (jsonLd) {
    const el = document.createElement('script');
    el.id = 'dynamic-jsonld';
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(el);
  }
}

export function clearPageSeoJsonLd() {
  if (typeof document === 'undefined') return;
  document.getElementById('dynamic-jsonld')?.remove();
}
