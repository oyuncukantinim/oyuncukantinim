import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpWideNarrow,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Gamepad2,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Lock,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getStoreApplicationOverview, submitStoreApplication } from '../lib/api';
import { AchievementCard, VerifiedAchievementCard, VerifiedStoreBadge } from '../components/StoreBadges';

const statusMeta = {
  pending: { label: 'İncelemede', className: 'border-amber-200 bg-amber-50 text-amber-700', icon: Clock, ring: 'ring-amber-400/40' },
  approved: { label: 'Onaylandı', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2, ring: 'ring-emerald-400/40' },
  rejected: { label: 'Reddedildi', className: 'border-rose-200 bg-rose-50 text-rose-700', icon: XCircle, ring: 'ring-rose-400/40' },
};

const benefits = [
  { icon: ShieldCheck, title: 'Güven Rozeti', text: 'Yeşil Onaylı Mağaza rozetiyle satıcı kartlarında güçlü güven sinyali.', accent: 'from-emerald-500 to-teal-500' },
  { icon: ArrowUpWideNarrow, title: 'Daha Üst Görünürlük', text: 'Pazar alanında standart üyelere göre öne çıkan konumlandırma.', accent: 'from-sky-500 to-indigo-500' },
  { icon: Crown, title: 'Satış Rütbeleri', text: 'Satış başarına göre özel rütbe rozetleri ve prestij seviyeleri.', accent: 'from-amber-500 to-orange-500' },
  { icon: Sparkles, title: 'Özel Rozetler', text: 'Admin tarafından oluşturulan oyuncu temalı özel rozet koleksiyonu.', accent: 'from-violet-500 to-fuchsia-500' },
  { icon: ImageIcon, title: 'Dosya Profil Resmi', text: 'Emoji yerine kendi özel profil görselini yükleme yetkisi.', accent: 'from-pink-500 to-rose-500' },
  { icon: Headphones, title: 'Öncelikli Destek', text: 'Mağaza modülü yönetim akışında hızlandırılmış destek.', accent: 'from-cyan-500 to-blue-500' },
  { icon: MessageCircle, title: 'Discord Rolü', text: 'Topluluk sunucusunda Mağaza Üye rolü ve özel kanal erişimi.', accent: 'from-indigo-500 to-purple-500' },
  { icon: Users, title: 'Profesyonel Vitrin', text: 'Başarım, doğrulama ve rütbe alanlarıyla kurumsal görünüm.', accent: 'from-slate-600 to-slate-800' },
  { icon: Gamepad2, title: 'Oyuncu Teması', text: 'Pazarın oyun odaklı görsel diline uygun özel sergileme.', accent: 'from-lime-500 to-green-600' },
];

function FileDrop({ id, label, description, file, onChange }) {
  const has = Boolean(file);
  return (
    <label
      htmlFor={id}
      className={`group relative flex min-h-[130px] cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-4 transition-all duration-300 ${
        has
          ? 'border-emerald-300 bg-emerald-50/70 hover:border-emerald-400'
          : 'border-violet-200 bg-white/80 hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50 hover:shadow-lg hover:shadow-violet-100'
      }`}
    >
      <input id={id} type="file" accept="image/*,.webp" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${
        has ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-200' : 'bg-gradient-to-br from-violet-500 to-cyan-500 shadow-violet-200'
      }`}>
        {has ? <CheckCircle2 size={22} /> : <Upload size={22} className="transition-transform duration-300 group-hover:-translate-y-0.5" />}
        {has ? <span className="absolute inset-0 rounded-2xl ring-2 ring-emerald-300 mb-ping-slow" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-black text-slate-900">{label}</div>
        <div className={`mt-1 truncate text-xs font-semibold leading-5 ${has ? 'text-emerald-600' : 'text-slate-400'}`}>
          {has ? file.name : description}
        </div>
      </div>
      <ChevronRight size={18} className={`shrink-0 transition-all duration-300 ${has ? 'text-emerald-500' : 'text-slate-300 group-hover:translate-x-1 group-hover:text-violet-500'}`} />
    </label>
  );
}

function ProgressRing({ progress }) {
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="url(#ring-grad)" strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,.0,.2,1)' }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-black leading-none">{progress}%</div>
        <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/60">Kriter</div>
      </div>
    </div>
  );
}

export default function StoreApplicationPage() {
  const { user } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [identityImage, setIdentityImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [userNote, setUserNote] = useState('');
  const [exampleOpen, setExampleOpen] = useState(false);

  const loadOverview = useCallback(() => {
    setLoading(true);
    getStoreApplicationOverview()
      .then((response) => setOverview(response.data))
      .catch((error) => {
        showToast(error.message);
        navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate, showToast]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOverview();
  }, [user, navigate, loadOverview]);

  const handleSubmit = async () => {
    if (!identityImage || !selfieImage) {
      showToast('Kimlik ve selfie görsellerini yüklemelisiniz.');
      return;
    }
    setSubmitting(true);
    try {
      await submitStoreApplication({ identityImage, selfieImage, userNote });
      setIdentityImage(null);
      setSelfieImage(null);
      setUserNote('');
      showToast('Başvurunuz incelemeye alındı.');
      loadOverview();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const criteria = overview?.criteria || {};
  const application = overview?.application;
  const appMeta = application ? statusMeta[application.status] : null;
  const AppIcon = appMeta?.icon || Clock;
  const isVerified = Boolean(overview?.is_verified_store);
  const isPending = application?.status === 'pending';
  const canApply = !isVerified && !isPending && criteria.eligible;
  const criteriaProgress = useMemo(() => {
    if (!criteria.total_count) return 100;
    return Math.round((criteria.passed_count / criteria.total_count) * 100);
  }, [criteria.passed_count, criteria.total_count]);

  if (loading || !overview) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 animate-ping rounded-full border-4 border-violet-200 opacity-40" />
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          </div>
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Yükleniyor</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl space-y-8">
      <style>{`
        @keyframes mb-float-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-20px) scale(1.1); } }
        @keyframes mb-float-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-25px,25px) scale(1.08); } }
        @keyframes mb-float-c { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,15px) scale(1.05); } }
        @keyframes mb-fade-up { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes mb-fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes mb-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes mb-pulse-ring { 0% { transform: scale(0.95); opacity: 0.7; } 70% { transform: scale(1.25); opacity: 0; } 100% { transform: scale(1.25); opacity: 0; } }
        @keyframes mb-sparkle { 0%,100% { opacity: 0; transform: scale(0.5) rotate(0deg); } 50% { opacity: 1; transform: scale(1.1) rotate(180deg); } }
        @keyframes mb-gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .mb-float-a { animation: mb-float-a 12s ease-in-out infinite; }
        .mb-float-b { animation: mb-float-b 14s ease-in-out infinite; }
        .mb-float-c { animation: mb-float-c 10s ease-in-out infinite; }
        .mb-fade-up { animation: mb-fade-up 0.6s cubic-bezier(.4,.0,.2,1) both; }
        .mb-fade-in { animation: mb-fade-in 0.8s ease-out both; }
        .mb-ping-slow { animation: mb-pulse-ring 1.8s cubic-bezier(0,0,0.2,1) infinite; }
        .mb-sparkle { animation: mb-sparkle 2.6s ease-in-out infinite; }
        .mb-gradient-x { background-size: 200% 200%; animation: mb-gradient-x 6s ease infinite; }
        .mb-shimmer-wrap { position: relative; overflow: hidden; }
        .mb-shimmer-wrap::after { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%); animation: mb-shimmer 3s ease-in-out infinite; }
        .mb-stagger > * { opacity: 0; animation: mb-fade-up 0.55s cubic-bezier(.4,.0,.2,1) forwards; }
        .mb-stagger > *:nth-child(1) { animation-delay: .05s; }
        .mb-stagger > *:nth-child(2) { animation-delay: .1s; }
        .mb-stagger > *:nth-child(3) { animation-delay: .15s; }
        .mb-stagger > *:nth-child(4) { animation-delay: .2s; }
        .mb-stagger > *:nth-child(5) { animation-delay: .25s; }
        .mb-stagger > *:nth-child(6) { animation-delay: .3s; }
        .mb-stagger > *:nth-child(7) { animation-delay: .35s; }
        .mb-stagger > *:nth-child(8) { animation-delay: .4s; }
        .mb-stagger > *:nth-child(9) { animation-delay: .45s; }
        .mb-stagger > *:nth-child(10) { animation-delay: .5s; }
      `}</style>

      {/* HERO */}
      <section className="mb-fade-up relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-violet-950 to-cyan-900 p-6 text-white shadow-2xl sm:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="mb-float-a absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="mb-float-b absolute -bottom-20 left-6 h-64 w-64 rounded-full bg-violet-400/25 blur-3xl" />
          <div className="mb-float-c absolute left-1/3 top-1/4 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)', backgroundSize: '28px 28px' }} />

        <div className="relative grid gap-8 xl:grid-cols-[1.6fr_0.4fr] xl:items-center">
          <div>
            <div className="mb-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-black text-cyan-100 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              <Gamepad2 size={14} /> Mağaza güçlendirme merkezi
            </div>
            <h1 className="mb-fade-up max-w-5xl bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-3xl font-black leading-tight text-transparent sm:text-5xl" style={{ animationDelay: '.05s' }}>
              Onaylı Mağaza ol,{' '}
              <span className="mb-gradient-x bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent">
                oyunculara profesyonel
              </span>{' '}
              görün.
            </h1>
            <p className="mb-fade-up mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base" style={{ animationDelay: '.1s' }}>
              Yeşil verify rozeti, satış rütbeleri, özel rozetler ve mağaza odaklı avantajlarla satıcı profilini güçlü bir vitrine dönüştür.
            </p>
            <div className="mb-fade-up mt-6 flex flex-wrap items-center gap-2.5" style={{ animationDelay: '.15s' }}>
              {isVerified ? <VerifiedStoreBadge /> : null}
              {application ? (
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ring-4 ${appMeta.className} ${appMeta.ring}`}>
                  <AppIcon size={14} /> Başvuru: {appMeta.label}
                </span>
              ) : null}
              {!application && !isVerified ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-black text-white/80">
                  <Sparkles size={14} /> Başvuru: Henüz gönderilmedi
                </span>
              ) : null}
            </div>
          </div>

          <div className="mb-fade-up relative rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl" style={{ animationDelay: '.2s' }}>
            <div className="flex items-center gap-4">
              <ProgressRing progress={criteriaProgress} />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/60">İlerleme</div>
                <div className="mt-0.5 text-base font-black">{criteria.passed_count} / {criteria.total_count} kriter</div>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-2.5 py-1 text-[11px] font-black text-emerald-200">
                  <Zap size={12} />
                  {criteria.eligible ? 'Başvuruya hazır' : 'Devam ediyor'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VERIFIED BLOCK — hide application form entirely */}
      {isVerified ? (
        <section className="mb-fade-up relative overflow-hidden rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-xl sm:p-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="mb-float-a absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-300/30 blur-3xl" />
            <div className="mb-float-b absolute -bottom-12 -left-6 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl" />
          </div>
          <Sparkles size={14} className="mb-sparkle absolute right-10 top-8 text-emerald-400" />
          <Star size={12} className="mb-sparkle absolute left-10 top-16 text-cyan-400" style={{ animationDelay: '.8s' }} />
          <Sparkles size={16} className="mb-sparkle absolute bottom-10 right-24 text-violet-400" style={{ animationDelay: '1.4s' }} />

          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-emerald-400 blur-xl opacity-60" />
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-2xl shadow-emerald-200">
                  <BadgeCheck size={40} strokeWidth={2.2} />
                  <span className="absolute inset-0 rounded-3xl ring-4 ring-emerald-300/40 mb-ping-slow" />
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-700 shadow-sm">
                  <CheckCircle2 size={12} /> Doğrulanmış satıcı
                </div>
                <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                  Mağazan <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">onaylı</span>
                </h2>
                <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                  Tekrar başvuru göndermene gerek yok. Onaylı Satıcı rozeti, özel rütbeler ve mağaza avantajları profilinde aktif durumda.
                </p>
              </div>
            </div>
            <Link
              to={`/p/${user?.username}`}
              className="group inline-flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-300"
            >
              Profilimi Gör
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      ) : null}

      {/* BENEFITS — only show if NOT verified */}
      {!isVerified ? (
        <section className="mb-fade-up" style={{ animationDelay: '.1s' }}>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-violet-600">Avantajlar</div>
              <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">Onaylı mağaza olmanın getirileri</h2>
            </div>
          </div>
          <div className="mb-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${item.accent} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30`} />
                <div className={`relative mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <item.icon size={22} />
                </div>
                <div className="relative font-black text-slate-900">{item.title}</div>
                <p className="relative mt-1 text-sm font-semibold leading-6 text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* CRITERIA — only show if NOT verified */}
      {!isVerified ? (
        <section className="mb-fade-up relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6" style={{ animationDelay: '.15s' }}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-violet-600">Kriterler</div>
              <h2 className="mt-1 text-xl font-black text-slate-900">Başvuru kriterleri</h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">Tüm şartlar tamamlandığında doğrulama yükleme alanı aktif olur.</p>
            </div>
            {application?.status === 'rejected' && application.admin_note ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">
                <span className="font-black uppercase tracking-wide">Red sebebi:</span> {application.admin_note}
              </div>
            ) : null}
          </div>

          {/* gradient progress bar */}
          <div className="mb-5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
              <span>İlerleme</span>
              <span className="text-slate-900">{criteriaProgress}%</span>
            </div>
            <div className="mb-shimmer-wrap h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-500 transition-all duration-1000"
                style={{ width: `${criteriaProgress}%` }}
              />
            </div>
          </div>

          <div className="mb-stagger grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {criteria.items?.map((item) => (
              <div
                key={item.key}
                className={`flex gap-3 rounded-2xl border p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                  item.passed ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/70'
                }`}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ${
                  item.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {item.passed ? <CheckCircle2 size={18} /> : <Lock size={18} />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-900">{item.title}</div>
                  <p className="text-xs font-semibold leading-5 text-slate-500">{item.description}</p>
                  {item.required !== undefined ? (
                    <div className={`mt-1 text-[11px] font-black ${item.passed ? 'text-emerald-600' : 'text-slate-400'}`}>
                      Mevcut: {item.current} / Gerekli: {item.required}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* PENDING STATE */}
      {!isVerified && isPending ? (
        <section className="mb-fade-up relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/30 blur-2xl mb-float-a" />
          <div className="relative flex items-start gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200">
              <Clock size={26} />
              <span className="absolute inset-0 rounded-2xl ring-2 ring-amber-300 mb-ping-slow" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Başvurun incelemede</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                Ekibimiz kimlik ve selfie görsellerini değerlendiriyor. Sonuç çıktığında bildirim göndereceğiz; bu sırada yeni bir başvuru oluşturamazsın.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* APPLICATION FORM */}
      {canApply ? (
        <section className="mb-fade-up relative overflow-hidden rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 shadow-sm sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl mb-float-a" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl mb-float-b" />

          <div className="relative mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-violet-600">Doğrulama</div>
              <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">Görselleri yükle ve başvur</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Kimlik ve selfie WebP formatına çevrilir, özel klasörde saklanır ve yalnızca admin tarafından görüntülenir.
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="group relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-violet-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 disabled:pointer-events-none disabled:opacity-60"
            >
              <span className="absolute inset-0 mb-shimmer-wrap opacity-0 transition-opacity group-hover:opacity-100" />
              {submitting ? (<><Loader2 size={16} className="animate-spin" /> Gönderiliyor...</>) : (<><Send size={16} /> Başvuruyu Gönder</>)}
            </button>
          </div>

          {/* Example image */}
          <div className="relative mb-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-amber-700">
                <ImageIcon size={14} /> Örnek Görsel
              </div>
              <p className="text-[11px] font-semibold text-slate-500">Önerilen poz ve kadraj</p>
            </div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setExampleOpen(true)}
                className="group w-full max-w-sm shrink-0 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-amber-300 sm:w-64"
                title="Büyük göster"
              >
                <div className="aspect-[2816/1536] w-full overflow-hidden">
                  <img
                    src="https://api.oyuncukantinim.com.tr/uploads/store-badges/selfieandid.webp"
                    alt="Örnek kimlik ve selfie doğrulama"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </button>
              <p className="text-xs font-semibold leading-5 text-slate-600">
                Kimliğini tutan eliyle birlikte yüzünün net göründüğü bir selfie örneği. Aynı pozda net ve iyi aydınlatılmış bir fotoğraf yüklemen başvurunun hızlı onaylanmasını sağlar.
              </p>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1.2fr]">
            <FileDrop id="identity-image" label="Kimlik görseli" description="Kimliğin net göründüğü görsel" file={identityImage} onChange={setIdentityImage} />
            <FileDrop id="selfie-image" label="Selfie doğrulama" description="Kimlikle birlikte selfie görseli" file={selfieImage} onChange={setSelfieImage} />
            <div className="relative flex flex-col">
              <textarea
                value={userNote}
                onChange={(event) => setUserNote(event.target.value.slice(0, 200))}
                rows={4}
                maxLength={200}
                placeholder="Admin için kısa not bırakmak istersen yazabilirsin."
                className="min-h-[130px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition-all focus:-translate-y-0.5 focus:border-violet-400 focus:shadow-lg focus:shadow-violet-100"
              />
              <div className="mt-1 text-right text-[11px] font-semibold text-slate-400">{userNote.length}/200</div>
            </div>
          </div>
        </section>
      ) : null}

      {/* EXAMPLE LIGHTBOX */}
      {exampleOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 mb-fade-in backdrop-blur-sm"
          onClick={() => setExampleOpen(false)}
        >
          <button
            type="button"
            onClick={() => setExampleOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:scale-110 hover:bg-white/20"
            title="Kapat"
          >
            <XCircle size={22} />
          </button>
          <img
            src="https://api.oyuncukantinim.com.tr/uploads/store-badges/selfieandid.webp"
            alt="Örnek kimlik ve selfie doğrulama - büyük"
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}

      {/* BADGES */}
      <section className="mb-fade-up rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6" style={{ animationDelay: '.2s' }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-violet-600">Koleksiyon</div>
            <h2 className="mt-1 text-xl font-black text-slate-900">Rozet koleksiyonu</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">Satış rütbeleri ve özel üye rozetleri başarımlar alanında birlikte görünür.</p>
          </div>
          <Link
            to={`/p/${user?.username}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition-all hover:-translate-y-0.5 hover:bg-slate-200"
          >
            Profilimi Gör
            <ChevronRight size={14} />
          </Link>
        </div>
        <div className="mb-stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <VerifiedAchievementCard isVerified={isVerified} forceUnlocked />
          {(overview.badges || []).map((badge) => (
            <AchievementCard key={badge.id} badge={badge} forceUnlocked />
          ))}
          {(!overview.badges || overview.badges.length === 0) ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
              Henüz admin tarafından rozet oluşturulmamış.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
