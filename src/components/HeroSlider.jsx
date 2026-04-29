import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Gamepad2 } from 'lucide-react';
import { getHeroBackgrounds, getHeroSlides } from '../lib/api';

// Map Tailwind "from-color-NNN via-... to-..." accent strings to a single
// solid hex used for left border glow + bottom tab underline glow.
// Falls back to violet if the first token is not recognized.
const ACCENT_HEX = {
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  indigo: '#6366f1',
};

function extractAccentHex(accentClass) {
  if (!accentClass) return ACCENT_HEX.violet;
  const m = String(accentClass).match(/from-([a-z]+)-\d{2,3}/);
  if (!m) return ACCENT_HEX.violet;
  return ACCENT_HEX[m[1]] || ACCENT_HEX.violet;
}

function hexToRgba(hex, alpha) {
  const normalized = String(hex || '').replace('#', '');
  if (normalized.length !== 6) return `rgba(139, 92, 246, ${alpha})`;
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const DEFAULT_SLIDES = [
  {
    id: 'fallback-1',
    eyebrow: 'Hoşgeldin Oyuncu',
    title: 'Oyun Dünyasının Yeni Kantini',
    subtitle:
      'Güvenilir oyuncu pazarı, onaylı satıcılar ve anında teslimat garantisiyle oyun deneyimini bir üst seviyeye taşı.',
    cta_label: 'Oyuncu Pazarı',
    cta_url: '/market',
    image_url: '',
    icon_url: '',
    accent_color: 'from-violet-600 via-purple-600 to-cyan-500',
  },
];

const AUTO_INTERVAL = 9500;

// localStorage-backed stale-while-revalidate cache for the hero payload.
// Lets returning visitors render the LCP image synchronously on mount
// without waiting for the API round-trip. A short TTL prevents admin edits
// from staying invisible for too long — after expiry we treat the cache as
// missing and block on the fresh fetch like a first visit.
// NOTE: the cache entries are stored as plain arrays in versions <=v1 (no
// timestamp). The v2 key format is { data, ts } so old entries are ignored.
const CACHE_KEY_SLIDES = 'hero_slides_cache_v5';
const CACHE_KEY_BGS = 'hero_backgrounds_cache_v2';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function readCache(key) {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.data)) return null;
    if (typeof parsed.ts !== 'number' || Date.now() - parsed.ts > CACHE_TTL_MS) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    }
  } catch {
    /* quota / private-mode — ignore */
  }
}

function filterSlides(list) {
  return list.filter(
    (s) => s.title || s.subtitle || s.image_url || s.icon_url || s.eyebrow || s.cta_label || s.cta_url,
  );
}

export default function HeroSlider() {
  // Seed state synchronously from cache so the very first render already
  // contains the <img> tag — browser can kick off the LCP image download
  // before the API round-trip even finishes.
  const [slides, setSlides] = useState(() => {
    const cached = readCache(CACHE_KEY_SLIDES);
    return cached && cached.length ? filterSlides(cached) : [];
  });
  const [backgrounds, setBackgrounds] = useState(() => readCache(CACHE_KEY_BGS) || []);
  const [loaded, setLoaded] = useState(() => {
    // Consider us "loaded" if we have any cached data to render.
    const cachedSlides = readCache(CACHE_KEY_SLIDES);
    const cachedBgs = readCache(CACHE_KEY_BGS);
    return Boolean((cachedSlides && cachedSlides.length) || (cachedBgs && cachedBgs.length));
  });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  // Pick a seed once per mount for the static background.
  // First-visit (no cached pool yet) → deterministic 0 so the URL matches the
  // <link rel="preload"> injected into index.html at build time and the LCP
  // image starts downloading from the very first byte of HTML.
  // Returning visitors (cache hit) → random pick for variety, image is already
  // warm in the browser cache so LCP isn't affected either way.
  const [bgSeed] = useState(() => {
    const cachedBgs = readCache(CACHE_KEY_BGS);
    return cachedBgs && cachedBgs.length ? Math.random() : 0;
  });

  useEffect(() => {
    Promise.allSettled([getHeroSlides(), getHeroBackgrounds()])
      .then(([slidesRes, bgRes]) => {
        const slidesData = slidesRes.status === 'fulfilled' ? slidesRes.value : null;
        const bgData = bgRes.status === 'fulfilled' ? bgRes.value : null;
        if (slidesData && Array.isArray(slidesData.data)) {
          const filtered = filterSlides(slidesData.data);
          setSlides(filtered.length ? filtered : DEFAULT_SLIDES);
          writeCache(CACHE_KEY_SLIDES, slidesData.data);
        }
        if (bgData && Array.isArray(bgData.data)) {
          const bgList = bgData.data.map((b) => b.image_url).filter(Boolean);
          setBackgrounds(bgList);
          writeCache(CACHE_KEY_BGS, bgList);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const total = slides.length;
  const current = slides[index] || slides[0];
  const accentHex = extractAccentHex(current?.accent_color);
  const currentTitle = String(current?.title || '').trim();
  const hasTitle = currentTitle.length > 0;
  const desktopImageUrl = current?.image_url || '';
  const hasImage = Boolean(desktopImageUrl);
  const titleLength = currentTitle.length;
  const titleSizeClass = titleLength > 72
    ? 'text-[1.18rem] sm:text-[1.95rem] md:text-[2.45rem] lg:text-[2.9rem]'
    : titleLength > 48
      ? 'text-[1.34rem] sm:text-[2.35rem] md:text-[2.85rem] lg:text-[3.35rem]'
      : 'text-[1.56rem] sm:text-4xl md:text-5xl lg:text-6xl';

  // Pick a stable background once per mount. Prefer the dedicated backgrounds
  // pool; fall back to slide images if the admin hasn't uploaded any yet.
  const backgroundUrl = useMemo(() => {
    const pool = backgrounds.length
      ? backgrounds
      : slides.map((s) => s.image_url).filter(Boolean);
    if (!pool.length) return '';
    const idx = Math.floor(bgSeed * pool.length) % pool.length;
    return pool[idx];
  }, [backgrounds, slides, bgSeed]);

  useEffect(() => {
    if (!total || paused || total < 2) return;
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % total);
    }, AUTO_INTERVAL);
    return () => clearTimeout(timerRef.current);
  }, [index, paused, total]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % (total || 1));
      else if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + (total || 1)) % (total || 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [total]);

  if (!loaded) {
    return (
      <section className="relative left-1/2 -mt-8 h-[500px] w-screen -translate-x-1/2 overflow-visible sm:h-[710px] lg:h-[770px]">
        <div className="absolute inset-x-0 top-0 h-[24vw] min-h-[96px] max-h-[118px] overflow-hidden bg-slate-950 sm:h-[420px] sm:min-h-0 sm:max-h-none lg:h-[460px]">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-violet-700/20 via-slate-900 to-cyan-700/10" />
        </div>
      </section>
    );
  }
  if (!current) return null;

  return (
    <section
      className="hero-slider group/hero relative left-1/2 -mt-8 h-[500px] w-screen -translate-x-1/2 overflow-visible text-white sm:h-[710px] lg:h-[770px]"
      aria-label="Ana sayfa slider"
      style={{ '--accent': accentHex }}
    >
      <style>{`
        @keyframes hs-text-in {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes hs-pulse-glow {
          0%, 100% { opacity: .9; }
          50%      { opacity: 1; }
        }
        .hs-text > * { opacity: 0; animation: hs-text-in .6s cubic-bezier(.2,.7,.2,1) forwards; }
        .hs-text > *:nth-child(1) { animation-delay: .05s; }
        .hs-text > *:nth-child(2) { animation-delay: .16s; }
        .hs-text > *:nth-child(3) { animation-delay: .27s; }
        .hs-text > *:nth-child(4) { animation-delay: .38s; }

        .hs-card-art { animation: hs-text-in .7s cubic-bezier(.2,.7,.2,1) both; animation-delay: .25s; }

        .hs-tab-glow { animation: hs-pulse-glow 2.4s ease-in-out infinite; }
      `}</style>

      {/* ============== BACKGROUND (static per page load) ============== */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[24vw] min-h-[96px] max-h-[118px] w-screen -translate-x-1/2 overflow-hidden sm:h-[420px] sm:min-h-0 sm:max-h-none lg:h-[460px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {backgroundUrl ? (
          <img
            src={backgroundUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        )}
        {/* Light darkening — just enough so the card pops, background stays visible */}
      </div>

      {/* ============== CONTENT LAYOUT ============== */}
      <div
        className="absolute inset-x-0 bottom-48 mx-auto flex w-full max-w-[1480px] flex-col justify-end px-4 pb-4 sm:bottom-48 sm:px-10 sm:pb-6 lg:bottom-52 lg:px-16 lg:pb-8"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ----- Card ----- */}
        <div
          key={`card-${current.id || index}`}
          className="relative mx-auto w-full overflow-hidden rounded-[22px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
        >
          {/* Left accent bar (matches active slide color) */}
          {hasTitle ? (
            <div
              className="absolute left-0 top-0 z-20 h-full w-[5px]"
              style={{
                background: `linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 55%, transparent) 100%)`,
                boxShadow: `0 0 22px var(--accent), 0 0 44px color-mix(in srgb, var(--accent) 45%, transparent)`,
              }}
            />
          ) : null}

          {/* Card background: accent gradient tinted by slide, with image art overlay.
              Aspect ratio ~3.5:1 on desktop so it stays cinematic & wide like the ref. */}
          <div
            className={`relative flex h-[210px] overflow-hidden ${hasTitle ? `bg-gradient-to-br ${current.accent_color || 'from-violet-700 via-purple-700 to-cyan-600'}` : 'bg-slate-950'} sm:h-[330px] md:h-[440px]`}
          >
            {hasTitle ? (
              <div className={`pointer-events-none absolute inset-0 ${hasImage ? 'bg-slate-950/0 md:bg-slate-950/55' : 'bg-slate-950/30 md:bg-slate-950/55'}`} />
            ) : null}

            {/* Slide hero art (right side) */}
            {desktopImageUrl && hasTitle ? (
              <div
                key={`art-${current.id || index}`}
                className="hs-card-art pointer-events-none absolute inset-y-0 right-0 hidden w-[55%] md:block"
                style={{
                  backgroundImage: `url("${desktopImageUrl}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center right',
                  maskImage:
                    'linear-gradient(to left, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to left, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
                }}
              />
            ) : null}

            {desktopImageUrl && !hasTitle ? (
              <div
                key={`art-full-${current.id || index}`}
                className="hs-card-art pointer-events-none absolute inset-0 hidden md:block"
                style={{
                  backgroundImage: `url("${desktopImageUrl}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ) : null}

            {/* Left→right darkening for legibility */}
            {hasTitle ? (
              <div className={`pointer-events-none absolute inset-0 ${hasImage ? 'bg-gradient-to-r from-slate-950/24 via-slate-950/06 to-transparent md:from-slate-950/80 md:via-slate-950/35 md:to-transparent' : 'bg-gradient-to-r from-slate-950/88 via-slate-950/52 to-slate-950/12 md:from-slate-950/80 md:via-slate-950/35 md:to-transparent'}`} />
            ) : null}

            {/* Subtle dot texture inside card */}
            {hasTitle ? (
              <div
                className="pointer-events-none absolute inset-0 hidden opacity-[0.08] mix-blend-overlay md:block"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
                  backgroundSize: '16px 16px',
                }}
              />
            ) : null}

            {/* Text block */}
            {hasTitle ? (
              <div
                key={`text-${current.id || index}`}
                className="hs-text relative z-10 flex h-full w-full max-w-[56%] flex-col justify-start gap-1.5 overflow-hidden px-4 pb-14 pt-5 sm:max-w-[640px] sm:justify-center sm:gap-3 sm:px-10 sm:py-12 md:px-14 md:py-16"
              >
              {current.eyebrow ? (
                <div>
                  <span
                    className="inline-flex max-w-full items-center gap-1.5 break-words rounded-md px-2 py-1 text-[9px] font-black uppercase leading-tight tracking-[0.08em] text-white shadow-md sm:px-2.5 sm:text-[11px] sm:tracking-[0.22em]"
                    style={{
                      background: `linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 60%, #000) 100%)`,
                    }}
                  >
                    {current.eyebrow}
                  </span>
                </div>
              ) : <div />}

              <h1 className={`${titleSizeClass} max-w-[11.5rem] break-words font-black leading-[0.92] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] sm:max-w-none sm:leading-[0.98]`}>
                {current.title || 'Başlığınızı buraya ekleyin'}
              </h1>

              {current.subtitle ? (
                <p className="line-clamp-2 max-w-[11.5rem] break-words text-[10px] font-semibold leading-[1.3] text-white/85 sm:line-clamp-3 sm:max-w-lg sm:text-base sm:leading-relaxed md:text-lg">
                  {current.subtitle}
                </p>
              ) : <div />}

              <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:mt-2 sm:gap-2.5">
                {current.cta_label ? (
                  <Link
                    to={current.cta_url || '/market'}
                    className="group/btn relative inline-flex max-w-full items-center gap-1 overflow-hidden rounded-xl px-3 py-2 text-[10px] font-black uppercase leading-none tracking-[0.08em] text-white shadow-lg transition hover:-translate-y-0.5 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm sm:tracking-wider"
                    style={{
                      background: `linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 60%, #000) 100%)`,
                      boxShadow: `0 10px 28px -8px var(--accent)`,
                    }}
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                    <span className="relative">{current.cta_label}</span>
                    <ChevronRight size={15} className="relative transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                ) : null}
              </div>
              </div>
            ) : null}
          </div>

        </div>

        {/* ----- Tabs ----- */}
        {total > 1 ? (
          <div
            className="relative z-20 mx-auto -mt-[44px] w-full sm:-mt-[56px] lg:-mt-[56px]"
            role="tablist"
            aria-label="Slayt seçici"
          >
            <div className="flex items-stretch justify-between overflow-hidden rounded-b-[22px] bg-slate-950/55 ring-1 ring-black/10 dark:bg-slate-950/62">
              {slides.map((slide, i) => {
                const active = i === index;
                const tabHex = extractAccentHex(slide.accent_color);
                const title = slide.tab_label || slide.eyebrow || slide.title || `Slayt ${i + 1}`;
                return (
                  <button
                    key={slide.id || i}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={title}
                    onClick={() => setIndex(i)}
                    className={`group/tab relative flex min-w-[58px] flex-1 items-center justify-center px-2 py-1 transition-all duration-300 sm:min-w-[72px] ${
                      active
                        ? 'shadow-lg'
                        : 'bg-slate-950/34 text-white/82 hover:bg-slate-950/48 dark:bg-slate-950/42 dark:text-white/80 dark:hover:bg-slate-950/56'
                    }`}
                    title={title}
                    style={active ? {
                      background: `linear-gradient(135deg, ${hexToRgba(tabHex, 0.28)} 0%, ${hexToRgba(tabHex, 0.14)} 100%)`,
                      boxShadow: `0 10px 26px -18px ${hexToRgba(tabHex, 0.9)}, inset 0 1px 0 ${hexToRgba('#ffffff', 0.3)}`,
                    } : undefined}
                  >
                    {/* Icon — acts as the tab header itself */}
                    <span
                      className={`flex items-center justify-center transition-transform duration-300 ${
                        active ? 'h-10 w-10 scale-105 sm:h-12 sm:w-12' : 'h-8 w-8 sm:h-10 sm:w-10 group-hover/tab:scale-105'
                      }`}
                      style={active ? {
                        filter: `drop-shadow(0 0 8px ${tabHex}) drop-shadow(0 0 18px color-mix(in srgb, ${tabHex} 55%, transparent))`,
                      } : { filter: 'grayscale(0.15)', opacity: 0.92 }}
                    >
                      {slide.icon_url ? (
                        <img
                          src={slide.icon_url}
                          alt={title}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <Gamepad2 size={active ? 34 : 28} className="text-white/85" />
                      )}
                    </span>

                    {/* Active underline glow */}
                    {active ? (
                      <span
                        className="hs-tab-glow absolute -bottom-[2px] left-4 right-4 h-[3px] rounded-full"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${tabHex}, transparent)`,
                          boxShadow: `0 0 10px ${tabHex}, 0 0 22px color-mix(in srgb, ${tabHex} 65%, transparent)`,
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

          </div>
        ) : null}
      </div>
    </section>
  );
}
