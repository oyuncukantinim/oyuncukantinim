// Tiny localStorage-backed stale-while-revalidate cache.
//
// Goal: pages that fetch rarely-changing reference data (categories, popular
// games, site settings…) should not wait for a full network round-trip on
// every visit. We persist the last successful payload and hand it back
// synchronously on the next mount, then refresh in the background so stale
// data eventually rolls forward.
//
// Usage:
//   const { data, refresh } = useCachedResource(KEY, fetcher, { ttlMs })
//
// The fetcher must return the payload you want cached (NOT a Response object).

import { useEffect, useRef, useState } from 'react';

const MEMORY = new Map();
const INFLIGHT = new Map();

function now() {
  return Date.now();
}

export function readCached(key) {
  if (MEMORY.has(key)) return MEMORY.get(key);
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    MEMORY.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function writeCached(key, data) {
  const entry = { data, ts: now() };
  MEMORY.set(key, entry);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(entry));
    }
  } catch {
    /* quota / private-mode — ignore */
  }
}

// Dedup concurrent calls for the same key so multiple components mounting at
// the same time share a single network request.
export function fetchDedup(key, fetcher) {
  if (INFLIGHT.has(key)) return INFLIGHT.get(key);
  const p = Promise.resolve()
    .then(() => fetcher())
    .finally(() => {
      INFLIGHT.delete(key);
    });
  INFLIGHT.set(key, p);
  return p;
}

// React hook: returns cached data immediately (may be null on first visit),
// then refreshes in the background if the cache is missing or older than ttlMs.
export function useCachedResource(key, fetcher, { ttlMs = 24 * 60 * 60 * 1000 } = {}) {
  const [data, setData] = useState(() => {
    const cached = readCached(key);
    return cached ? cached.data : null;
  });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useRef(() => {
    fetchDedup(key, () => fetcherRef.current())
      .then((fresh) => {
        if (fresh == null) return;
        writeCached(key, fresh);
        setData(fresh);
      })
      .catch(() => {});
  }).current;

  useEffect(() => {
    const cached = readCached(key);
    const stale = !cached || now() - cached.ts > ttlMs;
    if (stale) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, refresh };
}
