import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { getHeroSlides } from '../lib/api';

const DEFAULT_SLIDES = [
  {
    id: 'fallback-1',
    eyebrow: 'Hoşgeldin Oyuncu',
    title: 'Oyun Dünyasının Yeni Kantini',
    subtitle:
      'Güvenilir oyuncu pazarı, onaylı satıcılar ve anında teslimat garantisiyle oyun deneyimini bir üst seviyeye taşı.',
    cta_label: 'Oyuncu Pazarı',
    cta_url: '/market',
    secondary_label: 'Kategorileri Keşfet',
    secondary_url: '/categories',
    image_url: '',
    accent_color: 'from-violet-600 via-purple-600 to-cyan-500',
  },
];

const AUTO_INTERVAL = 6500;

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    getHeroSlides()
      .then((r) => {
        const list = Array.isArray(r.data)
          ? r.data.filter((s) => s.title || s.subtitle || s.image_url)
          : [];
        setSlides(list.length ? list : DEFAULT_SLIDES);
      })
      .catch(() => setSlides(DEFAULT_SLIDES))
      .finally(() => setLoaded(true));
  }, []);

  const total = slides.length;
  const current = slides[index] || slides[0];

  const go = useCallback(
    (next) => {
      if (!total) return;
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (!total || paused || total < 2) return;
    timerRef.current = setTimeout(() => {
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
      <section className="relative left-1/2 -mt-8 h-[460px] w-screen -translate-x-1/2 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-violet-700/20 via-slate-900 to-cyan-700/10" />
      </section>
    );
  }

  if (!current) return null;

  return (
    <section
      className="hero-slider group/hero relative left-1/2 -mt-8 w-screen -translate-x-1/2 overflow-hidden bg-slate-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Ana sayfa slider"
    >
      <style>{`
        @keyframes hs-kenburns {
          0%   { transform: scale(1.05) translateX(0); }
          100% { transform: scale(1.14) translateX(-1.5%); }
        }
        @keyframes hs-text-in {
          0%   { opacity: 0; transform: translateY(18px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0);   filter: blur(0); }
        }
        @keyframes hs-progress { 0% { width: 0%; } 100% { width: 100%; } }

        .hs-slide-layer {
          animation: hs-kenburns ${AUTO_INTERVAL + 800}ms ease-out both;
        }
        .hs-text > * { opacity: 0; animation: hs-text-in .7s cubic-bezier(.2,.7,.2,1) forwards; }
        .hs-text > *:nth-child(1) { animation-delay: .05s; }
        .hs-text > *:nth-child(2) { animation-delay: .18s; }
        .hs-text > *:nth-child(3) { animation-delay: .30s; }
        .hs-text > *:nth-child(4) { animation-delay: .42s; }

        .hs-progress { animation: hs-progress ${AUTO_INTERVAL}ms linear; }
        .hs-progress.paused { animation-play-state: paused; }
      `}</style>

      {/* Slides stack */}
      <div className="relative h-[480px] min-h-[420px] w-full sm:h-[520px] md:h-[560px]">
        {slides.map((slide, i) => (
          <div
            key={slide.id || i}
            className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={i !== index}
          >
            {/* Image layer (Ken Burns zoom when active) */}
            <div className="absolute inset-0 overflow-hidden">
              {slide.image_url ? (
                <div
                  className={i === index ? 'hs-slide-layer absolute inset-0' : 'absolute inset-0'}
                  style={{
                    backgroundImage: `url("${slide.image_url}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${slide.accent_color || 'from-violet-600 via-purple-600 to-cyan-500'}`}
                />
              )}
            </div>

            {/* Legibility gradient (dark left → clear right) */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/10" />
            {/* Bottom fade for controls area */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
          </div>
        ))}
      </div>

      {/* Content overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-6">
          <div
            key={`text-${current.id || index}`}
            className="hs-text pointer-events-auto max-w-xl"
          >
            {current.eyebrow ? (
              <div>
                <span
                  className={`inline-block rounded-full bg-gradient-to-r ${current.accent_color || 'from-violet-600 via-purple-600 to-cyan-500'} px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-white shadow-lg`}
                >
                  {current.eyebrow}
                </span>
              </div>
            ) : <div />}

            <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)] sm:text-5xl md:text-6xl">
              {current.title || 'Başlığınızı buraya ekleyin'}
            </h1>

            {current.subtitle ? (
              <p className="mt-5 max-w-xl text-base font-semibold leading-relaxed text-white/85 sm:text-lg">
                {current.subtitle}
              </p>
            ) : <div />}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {current.cta_label ? (
                <Link
                  to={current.cta_url || '/market'}
                  className="group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white px-6 py-3.5 text-sm font-black uppercase tracking-wider text-slate-900 shadow-xl transition hover:-translate-y-0.5"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-200 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                  <span className="relative">{current.cta_label}</span>
                  <ChevronRight size={16} className="relative transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              ) : null}
              {current.secondary_label ? (
                <Link
                  to={current.secondary_url || '/categories'}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-black uppercase tracking-wider text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/15"
                >
                  <span>{current.secondary_label}</span>
                  <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Side arrows */}
      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 opacity-0 backdrop-blur-md transition hover:border-white/40 hover:bg-black/50 hover:text-white group-hover/hero:opacity-100 md:flex"
            aria-label="Önceki slayt"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 opacity-0 backdrop-blur-md transition hover:border-white/40 hover:bg-black/50 hover:text-white group-hover/hero:opacity-100 md:flex"
            aria-label="Sonraki slayt"
          >
            <ChevronRight size={18} />
          </button>
        </>
      ) : null}

      {/* Bottom controls */}
      <div className="absolute inset-x-0 bottom-0">
        {/* Progress bar */}
        <div className="h-0.5 w-full bg-white/10">
          <div
            key={`pg-${index}-${paused ? 'p' : 'r'}-${total}`}
            className={`hs-progress h-full bg-white ${paused || total < 2 ? 'paused' : ''}`}
            style={total < 2 ? { width: 0 } : undefined}
          />
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          {/* Dots */}
          {total > 1 ? (
            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id || i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Slayt ${i + 1}`}
                  className="group/dot flex h-2 items-center overflow-hidden rounded-full"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-500 ease-out ${
                      i === index ? 'w-10 bg-white' : 'w-2 bg-white/30 group-hover/dot:bg-white/60'
                    }`}
                  />
                </button>
              ))}
            </div>
          ) : <div />}

          <div className="flex items-center gap-3">
            {total > 1 ? (
              <>
                <span className="hidden font-mono text-xs font-black uppercase tracking-[0.2em] text-white/60 sm:inline">
                  <span className="text-white">{String(index + 1).padStart(2, '0')}</span>
                  <span className="mx-1 text-white/30">/</span>
                  <span>{String(total).padStart(2, '0')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition hover:border-white/35 hover:bg-white/15 hover:text-white"
                  aria-label={paused ? 'Oynat' : 'Durdur'}
                >
                  {paused ? <Play size={13} /> : <Pause size={13} />}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
