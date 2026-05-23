import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Single-page apps keep the previous scroll position when the route changes,
// so navigating from a scrolled-down page opened the next page mid-scroll.
// This resets the window to the top on every normal navigation (link click /
// navigate()). Back/forward (POP) is left untouched so the browser's own
// scroll restoration still returns you to where you were.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, navigationType]);

  return null;
}
