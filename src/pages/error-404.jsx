import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Flame, Home, Search, ShoppingBag } from 'lucide-react';

const quickRoutes = [
  { to: '/', label: 'Ana Sayfa', icon: Home },
  { to: '/market', label: 'Pazar', icon: ShoppingBag },
  { to: '/categories', label: 'Kategoriler', icon: Compass },
];

export default function Error404Page() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white px-6 py-12 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.2)] sm:px-8 lg:px-12 lg:py-16">
      <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-10 h-56 w-56 rounded-full bg-cyan-400/16 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-fuchsia-400/10 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-center">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-violet-700">
            <Search size={14} />
            Sayfa Bulunamadı
          </div>

          <div className="mb-4 flex items-end gap-3">
            <span className="bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-6xl font-black leading-none text-transparent sm:text-7xl">
              404
            </span>
            <div className="pb-2 text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
              Not Found
            </div>
          </div>

          <h1 className="max-w-2xl text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Aradığın sayfa burada değil ya da adres artık değişmiş olabilir.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Link eski kalmış, yanlış yazılmış veya içerik kaldırılmış olabilir. İstersen pazara dönüp
            aktif ilanları inceleyebilir ya da kategorilerden yeni bir rota açabilirsin.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black tracking-[0.16em] text-white shadow-[0_18px_40px_-20px_rgba(124,58,237,0.55)] transition-all hover:-translate-y-0.5"
            >
              <ArrowLeft size={16} />
              Ana Sayfaya Dön
            </Link>
            <Link
              to="/market"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black tracking-[0.16em] text-slate-700 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700"
            >
              Pazara Git
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.8)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.28),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.2),_transparent_42%)]" />
          <div className="relative">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
              <Flame size={25} />
            </div>
            <h2 className="text-xl font-black tracking-tight">Hızlı Kısayollar</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Tekrar akışa dönmek için en çok kullanılan bölümleri buraya yerleştirdik.
            </p>

            <div className="mt-6 space-y-3">
              {quickRoutes.map((route) => {
                const Icon = route.icon;
                return (
                  <Link
                    key={route.to}
                    to={route.to}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-100 transition-all hover:border-white/20 hover:bg-white/10"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-300">
                        <Icon size={16} />
                      </span>
                      {route.label}
                    </span>
                    <ArrowLeft size={15} className="rotate-180 text-violet-300" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
