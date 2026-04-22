import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpWideNarrow,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Crown,
  Gamepad2,
  Headphones,
  Image,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getStoreApplicationOverview, submitStoreApplication } from '../lib/api';
import { AchievementCard, VerifiedAchievementCard, VerifiedStoreBadge } from '../components/StoreBadges';

const statusMeta = {
  pending: { label: 'İncelemede', className: 'border-amber-200 bg-amber-50 text-amber-700', icon: Clock },
  approved: { label: 'Onaylandı', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Reddedildi', className: 'border-rose-200 bg-rose-50 text-rose-700', icon: XCircle },
};

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Güven Rozeti',
    text: 'Satıcı kartında yeşil Onaylı Mağaza rozetiyle daha net güven sinyali verirsin.',
  },
  {
    icon: ArrowUpWideNarrow,
    title: 'Daha Üst Görünürlük',
    text: 'Mağaza ilanların pazar alanında standart üyelere göre daha güçlü konumlandırılabilir.',
  },
  {
    icon: Crown,
    title: 'Satış Rütbeleri',
    text: 'Satış başarına göre özel rütbe rozetleri kazanır ve profilinde sergilersin.',
  },
  {
    icon: Sparkles,
    title: 'Özel Rozetler',
    text: 'Admin tarafından oluşturulan şirin oyuncu temalı rozetler mağaza kimliğini güçlendirir.',
  },
  {
    icon: Image,
    title: 'Dosya Profil Resmi',
    text: 'Onaylı mağazalar emoji yerine dosya olarak özel profil resmi yükleyebilir.',
  },
  {
    icon: Headphones,
    title: 'Öncelikli Destek',
    text: 'Destek taleplerin mağaza modülü yönetim akışında daha hızlı takip edilebilir.',
  },
  {
    icon: MessageCircle,
    title: 'Discord Rolü',
    text: 'Discord sunucusunda Mağaza Üye rolüyle topluluk içinde daha görünür olursun.',
  },
  {
    icon: Users,
    title: 'Profesyonel Vitrin',
    text: 'Başarımlar, doğrulama ve rütbe alanları mağazanı daha kurumsal gösterir.',
  },
  {
    icon: Gamepad2,
    title: 'Oyuncu Teması',
    text: 'Rozetler ve başarımlar pazarın oyun odaklı görsel diline uygun şekilde sergilenir.',
  },
];

function FileDrop({ id, label, description, file, onChange }) {
  return (
    <label
      htmlFor={id}
      className="group flex min-h-[120px] cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-violet-200 bg-white/80 p-4 transition-all hover:border-violet-400 hover:bg-violet-50"
    >
      <input
        id={id}
        type="file"
        accept="image/*,.webp"
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-200">
        {file ? <CheckCircle2 size={22} /> : <Upload size={22} />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-black text-slate-900">{label}</div>
        <div className="mt-1 truncate text-xs font-semibold leading-5 text-slate-400">{file ? file.name : description}</div>
      </div>
    </label>
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

  if (loading || !overview) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  const criteria = overview.criteria || {};
  const application = overview.application;
  const appMeta = application ? statusMeta[application.status] : null;
  const AppIcon = appMeta?.icon || Clock;
  const canApply = criteria.eligible && !overview.is_verified_store && application?.status !== 'pending';
  const criteriaProgress = criteria.total_count > 0
    ? Math.round((criteria.passed_count / criteria.total_count) * 100)
    : 100;

  return (
    <div className="mx-auto max-w-screen-2xl space-y-8">
      <section className="seller-achievements-hero relative overflow-hidden rounded-[2rem] border border-violet-100 bg-gradient-to-br from-slate-950 via-violet-950 to-cyan-900 p-6 text-white shadow-2xl sm:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1.55fr_0.45fr] xl:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-cyan-100 backdrop-blur">
              <Gamepad2 size={14} /> Mağaza güçlendirme merkezi
            </div>
            <h1 className="max-w-5xl text-3xl font-black leading-tight sm:text-5xl">
              Onaylı Mağaza ol, oyunculara daha güvenli ve profesyonel görün.
            </h1>
            <p className="mt-4 max-w-4xl text-sm font-semibold leading-7 text-white/70">
              Yeşil verify rozeti, satış rütbeleri, özel rozetler ve mağaza odaklı avantajlarla satıcı profilini daha güçlü bir vitrine dönüştür.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {overview.is_verified_store ? <VerifiedStoreBadge /> : null}
              {application ? (
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${appMeta.className}`}>
                  <AppIcon size={14} /> Başvuru: {appMeta.label}
                </span>
              ) : null}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950">
                <BadgeCheck size={24} />
              </div>
              <div>
                <div className="text-lg font-black">Kriter durumu</div>
                <div className="text-xs font-bold text-white/60">{criteria.passed_count} / {criteria.total_count} kriter tamamlandı</div>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
                style={{ width: `${criteriaProgress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {benefits.map((item) => (
          <div key={item.title} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <item.icon size={24} className="mb-3 text-violet-600" />
            <div className="font-black text-slate-900">{item.title}</div>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{item.text}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Başvuru kriterleri</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">Tüm şartlar tamamlandığında doğrulama yükleme alanı aşağıda açılır.</p>
          </div>
          {application?.status === 'rejected' && application.admin_note ? (
            <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">Red sebebi: {application.admin_note}</div>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {criteria.items?.map((item) => (
            <div key={item.key} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {item.passed ? <CheckCircle2 size={18} /> : <Lock size={18} />}
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">{item.title}</div>
                <p className="text-xs font-semibold leading-5 text-slate-500">{item.description}</p>
                {item.required !== undefined ? (
                  <div className="mt-1 text-[11px] font-black text-slate-400">Mevcut: {item.current} / Gerekli: {item.required}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {canApply ? (
        <section className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-cyan-50 p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Doğrulama görsellerini yükle</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Kimlik ve selfie görselleri WebP formatına çevrilir, özel klasörde saklanır ve yalnızca admin tarafından görüntülenir.</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="theme-soft-action rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {submitting ? 'Başvuru gönderiliyor...' : 'Başvuruyu Gönder'}
            </button>
          </div>
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-black uppercase tracking-wide text-amber-700">Örnek Görsel</div>
              <p className="text-[11px] font-semibold text-slate-500">Önerilen poz ve kadraj</p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setExampleOpen(true)}
                className="group w-full max-w-sm shrink-0 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-amber-300 sm:w-64"
                title="Büyük göster"
              >
                <div className="aspect-[2816/1536] w-full">
                  <img
                    src="https://api.oyuncukantinim.com.tr/uploads/store-badges/selfieandid.webp"
                    alt="Örnek kimlik ve selfie doğrulama"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
              </button>
              <p className="text-xs font-semibold leading-5 text-slate-600">
                Kimliğini tutan eliyle birlikte yüzünün net göründüğü bir selfie örneği. Aynı pozda net, iyi aydınlatılmış bir fotoğraf yüklemen başvurunun hızlı onaylanmasını sağlar.
              </p>
            </div>
          </div>
          <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1.2fr]">
            <FileDrop
              id="identity-image"
              label="Kimlik görseli"
              description="Kimliğin net göründüğü görsel"
              file={identityImage}
              onChange={setIdentityImage}
            />
            <FileDrop
              id="selfie-image"
              label="Selfie doğrulama"
              description="Kimlikle birlikte selfie görseli"
              file={selfieImage}
              onChange={setSelfieImage}
            />
            <div className="relative flex flex-col">
              <textarea
                value={userNote}
                onChange={(event) => setUserNote(event.target.value.slice(0, 200))}
                rows={4}
                maxLength={200}
                placeholder="Admin için kısa not bırakmak istersen yazabilirsin."
                className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition-colors focus:border-violet-400"
              />
              <div className="mt-1 text-right text-[11px] font-semibold text-slate-400">
                {userNote.length}/200
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {overview.is_verified_store ? (
        <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-100">
                <BadgeCheck size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Mağazan zaten onaylı</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Tekrar başvuru göndermene gerek yok. Onaylı Satıcı rozeti ve uygun başarımların profilinde görünür.
                </p>
              </div>
            </div>
            <Link to={`/p/${user?.username}`} className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-500">
              Profilimi Gör
            </Link>
          </div>
        </section>
      ) : null}

      {exampleOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setExampleOpen(false)}
        >
          <button
            type="button"
            onClick={() => setExampleOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
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

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Rozet koleksiyonu</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">Satış rütbeleri ve özel üye rozetleri başarımlar alanında birlikte görünür.</p>
          </div>
          <Link to={`/p/${user?.username}`} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-200">
            Profilimi Gör
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <VerifiedAchievementCard isVerified={Boolean(overview.is_verified_store)} forceUnlocked />
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
