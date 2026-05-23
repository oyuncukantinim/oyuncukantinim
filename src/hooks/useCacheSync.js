import { useEffect } from 'react';
import { clearPublicCache, getCacheVersion } from '../lib/api';

// Content-version cache sync.
//
// Problem it solves: the public API cache (sessionStorage, with a TTL) is
// per-browser. When an admin edits a product/price/category, other users keep
// seeing stale data until the TTL expires. Aggressively clearing the whole
// cache on a timer is wasteful, and the owner specifically does NOT want
// anything that can drop the session.
//
// This hook polls a tiny, never-cached `get_cache_version` endpoint. The
// backend bumps that version on every admin mutation. When the version we see
// differs from the one we stored, we clear ONLY the public API cache
// (clearPublicCache touches just the `ok_public_api_v2:` keys — never the auth
// cookie or the user snapshot), so users get fresh data without ever being
// logged out.
//
// Backend contract (PHP):
//   action=get_cache_version  ->  { status:'success', data:{ version: <int|string> } }
//   Bump the stored version (e.g. a row in a settings table, or filemtime of a
//   marker file) inside every admin save/delete that changes public content.
//
// If the endpoint doesn't exist yet, every call just fails silently and the
// existing TTL behavior remains — so this is safe to ship before the backend.

const VERSION_KEY = 'ok_cache_version';

export default function useCacheSync() {
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await getCacheVersion();
        const version = String(res?.data?.version ?? res?.version ?? '');
        if (!version || cancelled) return;

        let stored = null;
        try {
          stored = localStorage.getItem(VERSION_KEY);
        } catch {
          stored = null;
        }

        // Only clear when we had a previous version and it changed — never on
        // the very first visit (nothing to invalidate yet).
        if (stored && stored !== version) {
          clearPublicCache();
        }

        try {
          localStorage.setItem(VERSION_KEY, version);
        } catch {
          // Storage disabled — sync simply degrades to TTL behavior.
        }
      } catch {
        // Endpoint missing / network error: keep the current TTL behavior.
      }
    };

    check();

    // Re-check when the tab regains focus so a user who left the page open
    // picks up admin changes on their next interaction.
    const onFocus = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, []);
}
