export function getListingCoverImage(listing, fallback = '') {
  if (!listing) return fallback || '';

  const images = Array.isArray(listing.images) ? listing.images.filter(Boolean) : [];
  const coverIndex = Number.isInteger(Number(listing.cover_index)) ? Number(listing.cover_index) : 0;

  return (
    images[coverIndex] ||
    images[0] ||
    listing.item_image ||
    fallback ||
    ''
  );
}

export function getListingImageSet(listing, fallback = '') {
  const images = Array.isArray(listing?.images) ? listing.images.filter(Boolean) : [];
  if (images.length) return images;
  return fallback ? [fallback] : [];
}
