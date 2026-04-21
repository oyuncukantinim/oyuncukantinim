import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bolt,
  ChevronRight,
  Flame,
  Gamepad2,
  Headphones,
  Joystick,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { getListings, getEpins } from '../lib/api';
import ListingCard from '../components/ListingCard';
import EPinCard from '../components/EPinCard';
import useSiteBrand from '../hooks/useSiteBrand';
import { hasListingDopingType } from '../lib/doping';

function HomeCardSkeleton({ className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 shadow-sm ${className}`}>
      <div className="animate-pulse">
        <div className="h-28 w-full bg-slate-800/60" />
        <div className="space-y-2 p-3">
          <div className="h-3 w-2/3 rounded-full bg-slate-800/60" />
          <div className="h-3 w-1/2 rounded-full bg-slate-800/60" />
        </div>
      </div>
    </div>
  );
}

/* ============  HERO  ============ */
function HeroSection() {
  return (
    <section className="relative left-1/2 -mt-8 w-screen -translate-x-1/2 overflow-hidden">
      {/* Base layer — space gradient */}
      <div className="absolute inset-0 bg-[#05060d]" />
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(139,92,246,0.45), transparent 60%),' +
            'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(6,182,212,0.35), transparent 60%),' +
            'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(236,72,153,0.35), transparent 60%)',
        }}
      />
      {/* Animated mesh — slowly shifts */}
      <div
        className="absolute inset-0 opacity-40 animate-gradient-shift"
        style={{
          background:
            'linear-gradient(120deg, rgba(139,92,246,0.25), rgba(6,182,212,0.25), rgba(236,72,153,0.25), rgba(139,92,246,0.25))',
          backgroundSize: '400% 400%',
        }}
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Diagonal hex pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(30deg, transparent 46%, white 46%, white 54%, transparent 54%),' +
            'linear-gradient(150deg, transparent 46%, white 46%, white 54%, transparent 54%)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Scan line */}
      <div className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-white/10 via-white/5 to-transparent blur-sm animate-scan-line" />

      {/* Floating game icons */}
      <FloatingIcon icon={Gamepad2} className="left-[6%] top-[18%] text-cyan-300/60 animate-float-slower" size={56} />
      <FloatingIcon icon={Joystick} className="right-[9%] top-[12%] text-fuchsia-300/60 animate-float-slow" size={48} />
      <FloatingIcon icon={Swords} className="left-[11%] bottom-[18%] text-amber-300/50 animate-float" size={44} />
      <FloatingIcon icon={Trophy} className="right-[14%] bottom-[24%] text-emerald-300/60 animate-float-slow" size={50} />
      <FloatingIcon icon={Headphones} className="left-[40%] top-[8%] text-violet-300/40 animate-float-slower" size={40} />
      <FloatingIcon icon={Rocket} className="right-[32%] bottom-[10%] text-pink-300/50 animate-float" size={42} />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 md:py-28">
        <div className="flex flex-col items-center text-center">
          {/* Live badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.28em] text-white backdrop-blur-md animate-fade-up">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-emerald-200">Canlı</span>
            <span className="h-3 w-px bg-white/20" />
            <span className="text-cyan-200">Oyuncu Kantini</span>
            <Sparkles size={12} className="text-amber-300" />
          </div>

          {/* Mega title */}
          <h1
            className="relative max-w-5xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl lg:text-[88px] animate-fade-up"
            style={{ animationDelay: '120ms' }}
          >
            <span className="block">Oyun Dünyasının</span>
            <span className="relative mt-2 block">
              <span
                className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent"
                style={{
                  backgroundSize: '200% 200%',
                  animation: 'gradient-shift 6s ease infinite',
                }}
              >
                Yeni Kantini.
              </span>
              {/* decorative underline sweep */}
              <span
                className="pointer-events-none absolute -bottom-3 left-1/2 h-[6px] w-[280px] -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent opacity-70 blur-sm"
              />
            </span>
          </h1>

          <p
            className="mt-8 max-w-2xl text-base leading-7 text-slate-300 md:text-lg animate-fade-up"
            style={{ animationDelay: '240ms' }}
          >
            En uygun fiyatlı <span className="font-bold text-cyan-300">E-Pinler</span>, güvenilir{' '}
            <span className="font-bold text-fuchsia-300">oyuncu pazarı</span> ve anında teslimat garantisiyle oyun
            deneyimini bir üst seviyeye taşı.
          </p>

          {/* CTA */}
          <div
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row animate-fade-up"
            style={{ animationDelay: '360ms' }}
          >
            <Link
              to="/store"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 px-8 py-4 text-base font-black text-white shadow-[0_10px_40px_-10px_rgba(236,72,153,0.7)] transition-all hover:scale-[1.03] active:scale-95"
            >
              <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
              <span className="relative flex items-center gap-2">
                <Zap size={18} />
                Mağazaya Göz At
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              to="/market"
              className="group flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-base font-black text-white backdrop-blur-md transition-all hover:scale-[1.03] hover:border-white/40 hover:bg-white/15 active:scale-95"
            >
              <Swords size={18} />
              Oyuncu Pazarı
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Trust strip */}
          <div
            className="mt-14 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up"
            style={{ animationDelay: '480ms' }}
          >
            <TrustStat icon={Users} label="Aktif Oyuncu" value="10K+" gradient="from-violet-400 to-fuchsia-400" />
            <TrustStat icon={Bolt} label="Anında Teslimat" value="⚡ 30sn" gradient="from-amber-400 to-orange-400" />
            <TrustStat icon={ShieldCheck} label="Güvenli İşlem" value="%100" gradient="from-emerald-400 to-cyan-400" />
            <TrustStat icon={Star} label="Kullanıcı Puanı" value="4.9 / 5" gradient="from-pink-400 to-rose-400" />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[var(--ok-bg)]" />
    </section>
  );
}

function FloatingIcon({ icon: Icon, className = '', size = 40 }) {
  return (
    <div className={`pointer-events-none absolute ${className}`}>
      <Icon size={size} strokeWidth={1.4} />
    </div>
  );
}

function TrustStat({ icon: Icon, label, value, gradient }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/30 hover:bg-white/10">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`} />
      <div className="relative flex items-center gap-3">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg ring-1 ring-white/30`}>
          <Icon size={16} className="text-white" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 text-left">
          <div className={`bg-gradient-to-r ${gradient} bg-clip-text text-lg font-black tracking-tight text-transparent`}>
            {value}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{label}</div>
        </div>
      </div>
    </div>
  );
}

/* ============  MARQUEE  ============ */
function GameMarquee() {
  const games = [
    'Valorant', 'League of Legends', 'CS2', 'Fortnite', 'PUBG', 'Mobile Legends',
    'GTA V', 'Minecraft', 'Genshin Impact', 'Apex Legends', 'Call of Duty', 'Dota 2',
    'Roblox', 'Clash Royale', 'Brawl Stars', 'FIFA', 'Rocket League',
  ];
  const loop = [...games, ...games];
  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-white/5 bg-gradient-to-r from-[#0B0F1E] via-[#13142B] to-[#0B0F1E] py-4">
      <div className="flex animate-marquee gap-10 whitespace-nowrap">
        {loop.map((name, idx) => (
          <div key={`${name}-${idx}`} className="flex items-center gap-3 px-1">
            <Gamepad2 size={16} className="text-fuchsia-400" />
            <span className="text-sm font-black uppercase tracking-[0.25em] text-white/70">{name}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/60" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============  FEATURES  ============ */
function FeaturesSection() {
  const items = [
    {
      icon: Bolt,
      title: 'Anında Teslimat',
      desc: 'Satın aldığın E-Pin kodları saniyeler içinde hesabına düşer. Kuyruk, bekleme, gecikme yok.',
      gradient: 'from-amber-400 via-orange-500 to-red-500',
      shadow: 'shadow-[0_20px_50px_-20px_rgba(251,146,60,0.55)]',
    },
    {
      icon: ShieldCheck,
      title: '%100 Güvenli Havuz',
      desc: 'Oyuncu pazarında paran güvenli havuzda bekler; işlem onaylandığında satıcıya aktarılır.',
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      shadow: 'shadow-[0_20px_50px_-20px_rgba(16,185,129,0.55)]',
    },
    {
      icon: MessageCircle,
      title: '7/24 Destek',
      desc: 'Yapay zeka destekli botumuz ve canlı destek ekibimiz her saatte yanında — kahve molan bile haric.',
      gradient: 'from-violet-500 via-fuchsia-500 to-pink-500',
      shadow: 'shadow-[0_20px_50px_-20px_rgba(217,70,239,0.55)]',
    },
  ];

  return (
    <section className="relative">
      <SectionHeader
        accent="from-violet-500 to-cyan-500"
        icon={Sparkles}
        title="Neden Oyuncu Kantini?"
        subtitle="Profesyonel altyapı, oyuncu odaklı deneyim"
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={item.title}
            className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-900/80 p-6 ${item.shadow} transition-all duration-500 hover:-translate-y-2 hover:border-white/20`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* hover glow */}
            <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${item.gradient} opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-60`} />
            {/* grid pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-xl ring-1 ring-white/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]`}>
              <item.icon size={26} className="text-white" strokeWidth={2.4} />
            </div>
            <h3 className="relative mt-5 text-xl font-black tracking-tight text-white">{item.title}</h3>
            <p className="relative mt-2 text-sm leading-6 text-slate-400">{item.desc}</p>
            <div className="relative mt-5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 transition-colors group-hover:text-white">
              Detaylar <ChevronRight size={13} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============  SECTION HEADER  ============ */
function SectionHeader({ icon: Icon, title, subtitle, accent, action }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className={`hidden h-12 w-1.5 rounded-full bg-gradient-to-b ${accent} shadow-lg sm:block`} />
        <div>
          <div className="flex items-center gap-2">
            {Icon ? <Icon size={16} className="text-violet-500" /> : null}
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-500">{subtitle}</span>
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

/* ============  MAIN  ============ */
export default function Home() {
  const { defaultListingImage } = useSiteBrand();
  const [listings, setListings] = useState([]);
  const [epins, setEpins] = useState([]);
  const [popularGames, setPopularGames] = useState([]);
  const [listingsLoaded, setListingsLoaded] = useState(false);
  const [epinsLoaded, setEpinsLoaded] = useState(false);
  const [popularGamesLoaded, setPopularGamesLoaded] = useState(false);

  useEffect(() => {
    getListings()
      .then((r) => setListings(r.data || []))
      .catch(() => {})
      .finally(() => setListingsLoaded(true));

    getEpins()
      .then((r) => setEpins(r.data || []))
      .catch(() => {})
      .finally(() => setEpinsLoaded(true));

    fetch('https://api.oyuncukantinim.com.tr/api.php?action=get_popular_games')
      .then((r) => r.json())
      .then((j) => setPopularGames(j.data || []))
      .catch(() => {})
      .finally(() => setPopularGamesLoaded(true));
  }, []);

  const vitrineListings = useMemo(
    () => listings.filter((listing) => hasListingDopingType(listing, 'vitrine')),
    [listings],
  );
  const recentListings = useMemo(
    () => listings.filter((listing) => !hasListingDopingType(listing, 'vitrine')),
    [listings],
  );

  return (
    <div className="space-y-16 pb-16">
      <HeroSection />
      <GameMarquee />

      {/* ============  POPULAR CATEGORIES  ============ */}
      {(popularGames.length > 0 || !popularGamesLoaded) && (
        <section>
          <SectionHeader
            icon={Flame}
            title="Popüler Kategoriler"
            subtitle="Trend Oyunlar"
            accent="from-orange-500 via-red-500 to-pink-500"
            action={
              <Link
                to="/categories"
                className="group hidden items-center gap-1 rounded-full bg-gradient-to-r from-orange-500/10 to-pink-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-600 ring-1 ring-orange-500/20 transition-all hover:bg-orange-500 hover:text-white hover:ring-orange-500 sm:flex"
              >
                Tümü <ChevronRight size={12} />
              </Link>
            }
          />
          <div className="min-h-[164px]">
            {popularGames.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {popularGames.map((game, i) => (
                  <Link
                    key={game.id}
                    to={
                      game.category_slug
                        ? `/categories/${game.category_slug}`
                        : `/market?game=${encodeURIComponent(game.name)}`
                    }
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.color || 'from-violet-500 to-fuchsia-500'} p-[2px] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_rgba(139,92,246,0.5)]`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {/* Shimmer overlay */}
                    <span className="pointer-events-none absolute inset-0 z-10 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                    <div className="relative flex h-full w-full flex-col items-center justify-center rounded-2xl bg-white/95 px-3 py-4 text-center backdrop-blur-sm">
                      <div className="relative mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200 transition-transform duration-300 group-hover:scale-110">
                        {game.image_url ? (
                          <img src={game.image_url} alt={game.name} className="h-11 w-11 rounded-xl object-contain" />
                        ) : (
                          <span className="text-3xl">{game.emoji || '🎮'}</span>
                        )}
                      </div>
                      <span className="text-sm font-black leading-tight text-slate-900">{game.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {Array.from({ length: 7 }).map((_, index) => (
                  <HomeCardSkeleton key={`popular-skeleton-${index}`} className="h-[164px]" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <FeaturesSection />

      {/* ============  E-PIN STORE  ============ */}
      {(epins.length > 0 || !epinsLoaded) && (
        <section>
          <SectionHeader
            icon={Zap}
            title="E-Pin Mağazası"
            subtitle="Anında Teslimat"
            accent="from-yellow-400 via-amber-500 to-orange-500"
            action={
              <Link
                to="/store"
                className="group flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-700 ring-1 ring-amber-500/20 transition-all hover:bg-amber-500 hover:text-white hover:ring-amber-500"
              >
                Tümü <ChevronRight size={12} />
              </Link>
            }
          />
          <div className="min-h-[272px]">
            {epins.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {epins.slice(0, 4).map((epin) => (
                  <EPinCard key={epin.id} epin={epin} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <HomeCardSkeleton key={`epin-skeleton-${index}`} className="h-[272px]" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============  VITRIN  ============ */}
      {(vitrineListings.length > 0 || !listingsLoaded) && (
        <section>
          <SectionHeader
            icon={Trophy}
            title="Vitrin İlanlar"
            subtitle="Öne Çıkan"
            accent="from-amber-400 via-orange-500 to-pink-500"
            action={
              <Link
                to="/market"
                className="group flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/10 to-pink-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-800 ring-1 ring-amber-500/20 transition-all hover:bg-amber-500 hover:text-white hover:ring-amber-500"
              >
                Tümü <ChevronRight size={12} />
              </Link>
            }
          />
          <div className="min-h-[356px]">
            {vitrineListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
                {vitrineListings.slice(0, 10).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <HomeCardSkeleton key={`vitrine-skeleton-${index}`} className="h-[356px]" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============  RECENT  ============ */}
      {(recentListings.length > 0 || !listingsLoaded) && (
        <section>
          <SectionHeader
            icon={ShieldCheck}
            title="Son İlanlar"
            subtitle="Yeni Eklenenler"
            accent="from-emerald-400 via-teal-500 to-cyan-500"
            action={
              <Link
                to="/market"
                className="group flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-500/20 transition-all hover:bg-emerald-500 hover:text-white hover:ring-emerald-500"
              >
                Tümü <ChevronRight size={12} />
              </Link>
            }
          />
          <div className="min-h-[356px]">
            {recentListings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
                {recentListings.slice(0, 10).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} fallbackImage={defaultListingImage} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <HomeCardSkeleton key={`recent-skeleton-${index}`} className="h-[356px]" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============  CTA BAND  ============ */}
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0B1120] via-[#1E1B4B] to-[#0B1120] p-8 shadow-2xl md:p-14">
            {/* ambient blobs */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl" />
            <div className="pointer-events-none absolute left-1/3 top-1/2 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
            {/* grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                backgroundSize: '36px 36px',
              }}
            />

            <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200 backdrop-blur">
                  <Rocket size={12} /> Satışa Başla
                </div>
                <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
                  Envanterini{' '}
                  <span className="bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                    paraya çevir.
                  </span>
                </h2>
                <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
                  Hesap, karakter, skin, boost — oyundaki her şeyi saniyeler içinde listele. Güvenli havuz, düşük komisyon, geniş alıcı kitlesi.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/create"
                    className="group relative overflow-hidden rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-slate-900 shadow-xl transition-transform hover:scale-105 active:scale-95"
                  >
                    <span className="relative flex items-center gap-2">
                      <Bolt size={16} className="text-amber-500" />
                      İlan Oluştur
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                  <Link
                    to="/support"
                    className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-black text-white backdrop-blur transition-colors hover:border-white/40 hover:bg-white/10"
                  >
                    <MessageCircle size={16} />
                    Destek Al
                  </Link>
                </div>
              </div>

              {/* Side card — community stats */}
              <div className="relative">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-500/30 opacity-60 blur-2xl" />
                <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Topluluk</div>
                      <div className="mt-1 text-2xl font-black text-white">Hızla Büyüyoruz</div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-lg ring-1 ring-white/20">
                      <Sparkles size={16} />
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <StatRow label="Tamamlanan İşlem" value="50.000+" color="from-emerald-400 to-cyan-400" />
                    <StatRow label="Aktif İlan" value="8.500+" color="from-violet-400 to-fuchsia-400" />
                    <StatRow label="Ortalama Puan" value="4.9 / 5" color="from-amber-400 to-pink-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{label}</span>
      <span className={`bg-gradient-to-r ${color} bg-clip-text text-lg font-black text-transparent`}>{value}</span>
    </div>
  );
}
