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

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  // Pick a random seed once per mount — used to select the static background.
  // Does NOT update when the user switches slides, only on page refresh.
  const [bgSeed] = useState(() => Math.random());

  useEffect(() => {
    Promise.allSettled([getHeroSlides(), getHeroBackgrounds()])
      .then(([slidesRes, bgRes]) => {
        const slidesData = slidesRes.status === 'fulfilled' ? slidesRes.value : null;
        const bgData = bgRes.status === 'fulfilled' ? bgRes.value : null;
        const list = slidesData && Array.isArray(slidesData.data)
          ? slidesData.data.filter((s) => s.title || s.subtitle || s.image_url)
          : [];
        setSlides(list.length ? list : DEFAULT_SLIDES);
        const bgList = bgData && Array.isArray(bgData.data)
          ? bgData.data.map((b) => b.image_url).filter(Boolean)
          : [];
        setBackgrounds(bgList);
      })
      .finally(() => setLoaded(true));
  }, []);

  const total = slides.length;
  const current = slides[index] || slides[0];
  const accentHex = extractAccentHex(current?.accent_color);
  const titleLength = String(current?.title || '').trim().length;
  const titleSizeClass = titleLength > 72
    ? 'text-[1.85rem] sm:text-[2.2rem] md:text-[2.75rem] lg:text-[3.15rem]'
    : titleLength > 48
      ? 'text-[2.15rem] sm:text-[2.6rem] md:text-[3.1rem] lg:text-[3.7rem]'
      : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl';

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
      <section className="relative left-1/2 -mt-20 h-[650px] w-screen -translate-x-1/2 overflow-visible sm:h-[710px] lg:h-[770px]">
        <div className="absolute inset-x-0 top-0 h-[380px] overflow-hidden bg-slate-950 sm:h-[420px] lg:h-[460px]">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-violet-700/20 via-slate-900 to-cyan-700/10" />
        </div>
      </section>
    );
  }
  if (!current) return null;

  return (
    <section
      className="hero-slider group/hero relative left-1/2 -mt-20 h-[650px] w-screen -translate-x-1/2 overflow-visible text-white sm:h-[710px] lg:h-[770px]"
      aria-label="Ana sayfa slider"
      style={{ '--accent': accentHex }}
    >
      <style>{`
        @keyframes hs-kenburns {
          0%   { transform: scale(1.04) translateX(0); }
          100% { transform: scale(1.10) translateX(-1.2%); }
        }
        @keyframes hs-text-in {
          0%   { opacity: 0; transform: translateY(14px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        @keyframes hs-pulse-glow {
          0%, 100% { opacity: .9; }
          50%      { opacity: 1; }
        }
        .hs-bg { animation: hs-kenburns 22s ease-in-out infinite alternate; }
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
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px] overflow-hidden sm:h-[420px] lg:h-[460px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {backgroundUrl ? (
          <div
            className="hs-bg absolute inset-0"
            style={{
              backgroundImage: `url("${backgroundUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        )}
        {/* Light darkening — just enough so the card pops, background stays visible */}
        <div className="absolute inset-0 bg-slate-950/35" />
        {/* Soft side vignettes so the card area feels centered without hiding the art */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0) 18%, rgba(2,6,23,0) 82%, rgba(2,6,23,0.55) 100%)',
          }}
        />
        {/* Subtle dot grid for texture */}
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* ============== CONTENT LAYOUT ============== */}
      <div
        className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[1480px] flex-col justify-end px-4 pb-6 sm:px-10 sm:pb-8 lg:px-16 lg:pb-10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* ----- Card ----- */}
        <div
          key={`card-${current.id || index}`}
          className="relative mx-auto w-full overflow-hidden rounded-[22px] border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
        >
          {/* Left accent bar (matches active slide color) */}
          <div
            className="absolute left-0 top-0 z-20 h-full w-[5px]"
            style={{
              background: `linear-gradient(180deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 55%, transparent) 100%)`,
              boxShadow: `0 0 22px var(--accent), 0 0 44px color-mix(in srgb, var(--accent) 45%, transparent)`,
            }}
          />

          {/* Card background: accent gradient tinted by slide, with image art overlay.
              Aspect ratio ~3.5:1 on desktop so it stays cinematic & wide like the ref. */}
          <div
            className={`relative flex h-[350px] overflow-hidden bg-gradient-to-br ${current.accent_color || 'from-violet-700 via-purple-700 to-cyan-600'} sm:h-[395px] md:h-[440px]`}
          >
            {/* Dark plate so the text stays readable over bright gradients */}
            <div className="pointer-events-none absolute inset-0 bg-slate-950/55" />

            {/* Slide hero art (right side) */}
            {current.image_url ? (
              <div
                key={`art-${current.id || index}`}
                className="hs-card-art pointer-events-none absolute inset-y-0 right-0 hidden w-[55%] md:block"
                style={{
                  backgroundImage: `url("${current.image_url}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center right',
                  maskImage:
                    'linear-gradient(to left, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to left, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
                }}
              />
            ) : null}

            {/* Left→right darkening for legibility */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/35 to-transparent" />

            {/* Subtle dot texture inside card */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Text block */}
            <div
              key={`text-${current.id || index}`}
              className="hs-text relative z-10 flex h-full w-full max-w-[640px] flex-col justify-center gap-4 overflow-hidden px-8 py-10 sm:px-12 sm:py-14 md:px-14 md:py-16"
            >
              {current.eyebrow ? (
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-md"
                    style={{
                      background: `linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 60%, #000) 100%)`,
                    }}
                  >
                    {current.eyebrow}
                  </span>
                </div>
              ) : <div />}

              <h1 className={`${titleSizeClass} font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)]`}>
                {current.title || 'Başlığınızı buraya ekleyin'}
              </h1>

              {current.subtitle ? (
                <p className="line-clamp-3 max-w-lg text-sm font-semibold leading-relaxed text-white/85 sm:text-base md:text-lg">
                  {current.subtitle}
                </p>
              ) : <div />}

              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                {current.cta_label ? (
                  <Link
                    to={current.cta_url || '/market'}
                    className="group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg transition hover:-translate-y-0.5"
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
          </div>

        </div>

        {/* ----- Tabs ----- */}
        {total > 1 ? (
          <div
            className="relative mx-auto mt-3 w-full"
            role="tablist"
            aria-label="Slayt seçici"
          >
            <div className="flex items-stretch justify-between gap-1 overflow-x-auto rounded-[18px] border border-slate-300/95 bg-slate-200/90 p-1 shadow-[0_14px_30px_-26px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_22px_44px_-28px_rgba(2,6,23,0.75),inset_0_1px_0_rgba(255,255,255,0.08)] sm:gap-1.5">
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
                    className={`group/tab relative flex min-w-[64px] flex-1 items-center justify-center rounded-[14px] px-2.5 py-2.5 transition-all duration-300 sm:min-w-[80px] sm:py-3 ${
                      active
                        ? 'shadow-lg'
                        : 'bg-white/68 text-slate-700 ring-1 ring-slate-200/70 hover:bg-white/92 dark:bg-white/[0.03] dark:text-white/75 dark:ring-white/5 dark:hover:bg-white/[0.06]'
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
                        active ? 'h-10 w-10 scale-110 sm:h-12 sm:w-12' : 'h-8 w-8 sm:h-10 sm:w-10 group-hover/tab:scale-105'
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
                        <Gamepad2 size={active ? 32 : 28} className="text-white/85" />
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
