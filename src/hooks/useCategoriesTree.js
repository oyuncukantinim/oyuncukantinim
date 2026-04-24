// Shared categories tree hook. Previously each of Navbar, categories page,
// market page, category-listings and create page fetched `get_categories_tree`
// independently on every mount — 4–5 duplicate requests per navigation.
//
// This hook wraps the endpoint with a 24h stale-while-revalidate cache so the
// first fetch populates localStorage and every subsequent mount (and every
// other component mounting simultaneously) gets the data synchronously.

import { useCachedResource } from '../lib/cache';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';
const CACHE_KEY = 'categories_tree_cache_v1';
const TTL_MS = 24 * 60 * 60 * 1000; // 24h — categories are admin-curated

async function fetchCategoriesTree() {
  const res = await fetch(`${API_URL}?action=get_categories_tree`);
  if (!res.ok) throw new Error('categories fetch failed');
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export default function useCategoriesTree() {
  const { data, refresh } = useCachedResource(CACHE_KEY, fetchCategoriesTree, {
    ttlMs: TTL_MS,
  });
  return { categories: data || [], refresh };
}
