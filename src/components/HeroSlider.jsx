import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Pause,
  Play,
  Sparkles,
  Zap,
} from 'lucide-react';
import { getHeroSlides } from '../lib/api';

const DEFAULT_SLIDES = [
  {
    id: 'fallback-1',
    eyebrow: 'Hoşgeldin Oyuncu',
    title: 'Oyun Dünyasının Yeni Kantini',
    subtitle: 'Güvenilir oyuncu pazarı, onaylı satıcılar ve anında teslimat garantisiyle oyun deneyimini bir üst seviyeye taşı.',
    badge_text: 'LV 99 · PRO',
    cta_label: 'Oyuncu Pazarı',
    cta_url: '/market',
    secondary_label: 'Kategorileri Keşfet',
    secondary_url: '/categories',
    image_url: '',
    accent_color: 'from-violet-600 via-purple-600 to-cyan-500',
    stat_label: 'Aktif Oyuncu',
    stat_value: '50.000+',
  },
];

const AUTO_INTERVAL = 6500;

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);

  useEffect(() => {
    getHeroSlides()
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data.filter((s) => s.title || s.subtitle) : [];
        setSlides(list.length ? list : DEFAULT_SLIDES);
      })
      .catch(() => setSlides(DEFAULT_SLIDES))
      .finally(() => setLoaded(true));
  }, []);

  const total = slides.length;
  const current = slides[index] || slides[0];

  const go = useCallback((next) => {
    if (!total) return;
    setDirection(next > index ? 1 : -1);
    setIndex(((next % total) + total) % total);
  }, [index, total]);

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (!total || paused || total < 2) return;
    timerRef.current = setTimeout(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % total);
    }, AUTO_INTERVAL);
    return () => clearTimeout(timerRef.current);
  }, [index, paused, total]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  if (!loaded) {
    return (
      <section className="relative left-1/2 -mt-8 h-[460px] w-screen -translate-x-1/2 overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-violet-700/20 via-transparent to-cyan-400/10" />
      </section>
    );
  }

  if (!current) return null;

  return (
    <section
      className={`hero-slider relative left-1/2 -mt-8 w-screen -translate-x-1/2 overflow-hidden bg-slate-950`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Ana sayfa slider"
    >
      <style>{`
        @keyframes hs-float-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-15px) scale(1.06); } }
        @keyframes hs-float-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-25px,20px) scale(1.08); } }
        @keyframes hs-grid-drift { 0% { background-position: 0 0; } 100% { background-position: 44px 44px; } }
        @keyframes hs-scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        @keyframes hs-gradient-shift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes hs-fade-in { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes hs-slide-in-right { 0% { opacity: 0; transform: translateX(60px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes hs-slide-in-left { 0% { opacity: 0; transform: translateX(-60px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes hs-pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }
        @keyframes hs-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes hs-progress { 0% { width: 0%; } 100% { width: 100%; } }
        .hero-slider { font-family: inherit; }
        .hero-stage { animation: hs-fade-in .55s ease-out both; }
        .hero-stage[data-dir="1"] .hs-stage-text { animation: hs-slide-in-right .6s cubic-bezier(.2,.7,.2,1) both; }
        .hero-stage[data-dir="-1"] .hs-stage-text { animation: hs-slide-in-left .6s cubic-bezier(.2,.7,.2,1) both; }
        .hero-stage[data-dir="1"] .hs-stage-visual { animation: hs-slide-in-left .7s cubic-bezier(.2,.7,.2,1) both; }
        .hero-stage[data-dir="-1"] .hs-stage-visual { animation: hs-slide-in-right .7s cubic-bezier(.2,.7,.2,1) both; }
        .hero-progress { animation: hs-progress ${AUTO_INTERVAL}ms linear; }
        .hero-progress.paused { animation-play-state: paused; }
        .hs-grid-layer {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 44px 44px;
          animation: hs-grid-drift 22s linear infinite;
        }
        .hs-scanline {
          background: linear-gradient(to bottom, transparent 0%, rgba(139,92,246,0.18) 48%, rgba(34,211,238,0.18) 50%, transparent 100%);
          animation: hs-scan 6s linear infinite;
        }
        .hs-bg-gradient {
          background-size: 200% 200%;
          animation: hs-gradient-shift 18s ease infinite;
        }
        .hs-dot-btn .hs-dot-inner {
          transition: width .45s cubic-bezier(.2,.7,.2,1), background-color .3s;
        }
      `}</style>

      {/* Background gradient (per-slide) */}
      <div
        key={`bg-${current.id || index}`}
        className={`absolute inset-0 bg-gradient-to-br ${current.accent_color || 'from-violet-600 via-purple-600 to-cyan-500'} hs-bg-gradient transition-opacity duration-700`}
      />

      {/* Background image overlay */}
      {current.image_url ? (
        <div
          key={`img-${current.id || index}`}
          className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-overlay transition-opacity duration-700"
          style={{ backgroundImage: `url("${current.image_url}")` }}
        />
      ) : null}

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 hs-grid-layer opacity-40" />
      {/* Scanline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 hs-scanline opacity-50" />

      {/* Floating orbs */}
      <div
        className="pointer-events-none absolute left-[-10%] top-[10%] h-[420px] w-[420px] rounded-full bg-white/15 blur-[110px]"
        style={{ animation: 'hs-float-a 14s ease-in-out infinite' }}
      />
      <div
        className="pointer-events-none absolute bottom-[-15%] right-[-5%] h-[360px] w-[360px] rounded-full bg-cyan-400/25 blur-[100px]"
        style={{ animation: 'hs-float-b 18s ease-in-out infinite' }}
      />

      {/* Noise vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.55)_85%)]" />

      {/* Content */}
      <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-6 py-16 md:py-20">
        <div
          key={`stage-${current.id || index}`}
          data-dir={direction}
          className="hero-stage grid w-full grid-cols-1 items-center gap-10 md:grid-cols-[1.15fr_1fr]"
        >
          {/* TEXT */}
          <div className="hs-stage-text relative z-10">
            {/* HUD chips row */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-emerald-400" style={{ animation: 'hs-pulse-ring 1.6s ease-out infinite' }} />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Online
              </span>
              {current.eyebrow ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-gradient-to-r from-white/25 to-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white backdrop-blur-md">
                  <Sparkles size={11} />
                  {current.eyebrow}
                </span>
              ) : null}
              {current.badge_text ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 shadow-[0_6px_20px_-6px_rgba(251,191,36,0.6)]">
                  <Zap size={11} strokeWidth={3} />
                  {current.badge_text}
                </span>
              ) : null}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
              <GlitchTitle text={current.title} />
            </h1>

            {/* Subtitle */}
            {current.subtitle ? (
              <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-white/80 sm:text-lg">
                {current.subtitle}
              </p>
            ) : null}

            {/* Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {current.cta_label ? (
                <CTAButton to={current.cta_url || '/market'} primary>
                  {current.cta_label}
                </CTAButton>
              ) : null}
              {current.secondary_label ? (
                <CTAButton to={current.secondary_url || '/categories'}>
                  {current.secondary_label}
                </CTAButton>
              ) : null}
            </div>

            {/* Stat pod */}
            {current.stat_value && current.stat_label ? (
              <div className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 backdrop-blur-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white/20 to-white/5 text-white">
                  <Gamepad2 size={18} />
                </div>
                <div>
                  <div className="text-xl font-black leading-none text-white">{current.stat_value}</div>
                  <div className="mt-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                    {current.stat_label}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* VISUAL (controller HUD panel) */}
          <div className="hs-stage-visual relative hidden md:block">
            <VisualPanel slide={current} />
          </div>
        </div>
      </div>

      {/* Bottom control bar */}
      <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:border-white/30 hover:bg-white/15 hover:text-white"
              aria-label="Önceki"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={next}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition hover:border-white/30 hover:bg-white/15 hover:text-white"
              aria-label="Sonraki"
            >
              <ChevronRight size={17} />
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 text-[11px] font-black uppercase tracking-wider text-white/80 transition hover:border-white/30 hover:bg-white/15 hover:text-white"
              aria-label={paused ? 'Oynat' : 'Durdur'}
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}
              {paused ? 'Oynat' : 'Durdur'}
            </button>
          </div>

          {/* Dots */}
          {total > 1 ? (
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id || i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="hs-dot-btn group flex h-2 items-center overflow-hidden rounded-full"
                >
                  <span
                    className={`hs-dot-inner block h-1.5 rounded-full ${
                      i === index ? 'w-10 bg-white' : 'w-2 bg-white/30 group-hover:bg-white/60'
                    }`}
                  />
                </button>
              ))}
            </div>
          ) : <div />}

          <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
            <span className="font-mono text-white/90">{String(index + 1).padStart(2, '0')}</span>
            <span>/</span>
            <span className="font-mono">{String(total).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-white/10">
          <div
            key={`pg-${index}-${paused ? 'p' : 'r'}`}
            className={`hero-progress h-full bg-gradient-to-r from-white via-cyan-300 to-fuchsia-400 ${paused ? 'paused' : ''}`}
          />
        </div>
      </div>
    </section>
  );
}

function CTAButton({ to, primary, children }) {
  if (primary) {
    return (
      <Link
        to={to}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white px-6 py-3.5 text-sm font-black uppercase tracking-wider text-slate-900 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.6)] transition hover:-translate-y-0.5"
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <span className="relative">{children}</span>
        <ChevronRight size={16} className="relative transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20"
    >
      <span>{children}</span>
      <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function GlitchTitle({ text }) {
  if (!text) return <span className="italic text-white/60">Başlık ekleyin</span>;
  return (
    <span className="relative inline-block">
      <span
        className="absolute inset-0 translate-x-[1px] translate-y-[1px] text-fuchsia-400/40 mix-blend-screen"
        aria-hidden="true"
      >
        {text}
      </span>
      <span
        className="absolute inset-0 -translate-x-[1px] -translate-y-[1px] text-cyan-300/40 mix-blend-screen"
        aria-hidden="true"
      >
        {text}
      </span>
      <span className="relative bg-gradient-to-br from-white via-white to-white/80 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
        {text}
      </span>
    </span>
  );
}

function VisualPanel({ slide }) {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[360px]">
      {/* Glow ring */}
      <div className="absolute -inset-3 rounded-[32px] bg-gradient-to-br from-white/30 via-white/5 to-transparent blur-xl" />

      <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/15 bg-slate-900/50 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        {/* Corner brackets */}
        <CornerBracket className="left-3 top-3" />
        <CornerBracket className="right-3 top-3 rotate-90" />
        <CornerBracket className="left-3 bottom-3 -rotate-90" />
        <CornerBracket className="right-3 bottom-3 rotate-180" />

        {/* Inner image */}
        {slide.image_url ? (
          <img
            src={slide.image_url}
            alt={slide.title || ''}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${slide.accent_color || 'from-violet-600 via-purple-600 to-cyan-500'}`}>
            <div className="flex h-full w-full items-center justify-center">
              <Gamepad2 size={120} className="text-white/25" strokeWidth={1.4} />
            </div>
          </div>
        )}

        {/* Scanline in panel */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.12)_50%)] bg-[length:100%_4px] opacity-40" />

        {/* Bottom HUD tag */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl border border-white/15 bg-black/40 px-3 py-2 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" style={{ animation: 'hs-blink 1.2s ease-in-out infinite' }} />
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white">Live</span>
          </div>
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            SYS/OK
          </span>
        </div>

        {/* Top HUD tag */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 backdrop-blur-md">
          <Sparkles size={11} className="text-cyan-300" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Featured</span>
        </div>
      </div>

      {/* Floating stat pill */}
      {slide.stat_value && slide.stat_label ? (
        <div className="absolute -right-3 top-10 rotate-3 rounded-2xl border border-white/20 bg-slate-900/80 px-3 py-2 shadow-xl backdrop-blur-md">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">{slide.stat_label}</div>
          <div className="text-lg font-black text-white">{slide.stat_value}</div>
        </div>
      ) : null}
    </div>
  );
}

function CornerBracket({ className = '' }) {
  return (
    <span className={`pointer-events-none absolute h-6 w-6 ${className}`} aria-hidden="true">
      <span className="absolute left-0 top-0 h-0.5 w-5 bg-white/70" />
      <span className="absolute left-0 top-0 h-5 w-0.5 bg-white/70" />
    </span>
  );
}
