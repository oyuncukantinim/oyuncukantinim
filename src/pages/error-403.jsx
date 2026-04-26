import { Link } from 'react-router-dom';
import { ArrowLeft, LockKeyhole, ShieldAlert } from 'lucide-react';

const quickLinks = [
  { to: '/', label: 'Ana Sayfaya Dön' },
  { to: '/market', label: 'Pazarı Keşfet' },
  { to: '/support', label: 'Destek Merkezi' },
];

export default function Error403Page() {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white px-6 py-12 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.2)] sm:px-8 lg:px-12 lg:py-16">
      <div className="pointer-events-none absolute -left-16 top-0 h-44 w-44 rounded-full bg-amber-400/18 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-10 h-56 w-56 rounded-full bg-rose-500/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-violet-500/12 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_360px] lg:items-center">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-700">
            <ShieldAlert size={14} />
            Erişim Sınırı
          </div>

          <div className="mb-4 flex items-end gap-3">
            <span className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-6xl font-black leading-none text-transparent sm:text-7xl">
              403
            </span>
            <div className="pb-2 text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
              Forbidden
            </div>
          </div>

          <h1 className="max-w-2xl text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Bu alana erişim iznin şu anda bulunmuyor.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Girmeye çalıştığın sayfa sadece belirli kullanıcılar veya özel yetkiler için açık olabilir.
            Hesabınla ilgili bir sorun olduğunu düşünüyorsan destek ekibimizle iletişime geçebilirsin.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black tracking-[0.16em] text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.6)] transition-all hover:-translate-y-0.5 hover:bg-slate-900"
            >
              <ArrowLeft size={16} />
              Ana Sayfaya Dön
            </Link>
            <Link
              to="/support"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black tracking-[0.16em] text-slate-700 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700"
            >
              Destek Al
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.8)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(244,63,94,0.18),_transparent_40%)]" />
          <div className="relative">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.18)]">
              <LockKeyhole size={26} />
            </div>
            <h2 className="text-xl font-black tracking-tight">Hızlı Yönlendirme</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Çıkmaz sokakta kalmaman için en çok kullanılan güvenli yönleri burada topladık.
            </p>

            <div className="mt-6 space-y-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-100 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <span>{link.label}</span>
                  <ArrowLeft size={15} className="rotate-180 text-amber-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
