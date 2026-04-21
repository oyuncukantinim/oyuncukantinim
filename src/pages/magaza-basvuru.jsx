import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Crown,
  FileImage,
  Gamepad2,
  Lock,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getStoreApplicationOverview, submitStoreApplication } from '../lib/api';
import { AchievementCard, VerifiedStoreBadge } from '../components/StoreBadges';

const statusMeta = {
  pending: { label: 'İncelemede', className: 'border-amber-200 bg-amber-50 text-amber-700', icon: Clock },
  approved: { label: 'Onaylandı', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Reddedildi', className: 'border-rose-200 bg-rose-50 text-rose-700', icon: XCircle },
};

function FileDrop({ id, label, description, file, onChange }) {
  return (
    <label
      htmlFor={id}
      className="group flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-white/80 p-5 text-center transition-all hover:border-violet-400 hover:bg-violet-50"
    >
      <input
        id={id}
        type="file"
        accept="image/*,.webp"
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-200">
        {file ? <CheckCircle2 size={22} /> : <Upload size={22} />}
      </div>
      <div className="text-sm font-black text-slate-900">{label}</div>
      <div className="mt-1 text-xs font-semibold leading-5 text-slate-400">{file ? file.name : description}</div>
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

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-violet-100 bg-gradient-to-br from-slate-950 via-violet-950 to-cyan-900 p-6 text-white shadow-2xl shadow-violet-200 sm:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-cyan-100 backdrop-blur">
              <Gamepad2 size={14} /> Mağaza güçlendirme merkezi
            </div>
            <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Onaylı Mağaza ol, oyunculara daha güvenli görün.
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/70">
              Yeşil verify rozetiyle mağazanı öne çıkar, satış rütbelerini başarımlarında sergile ve profesyonel satıcı görünümünü güçlendir.
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
                style={{ width: `${Math.round((criteria.passed_count / criteria.total_count) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, title: 'Daha fazla güven', text: 'Satıcı bloğunda yeşil doğrulama rozetiyle güven sinyali ver.' },
          { icon: Crown, title: 'Rütbe sistemi', text: 'Satış sayına göre yalnızca en yüksek uygun rozet öne çıkar.' },
          { icon: Sparkles, title: 'Şirin oyuncu vitrini', text: 'Başarımlar sekmesinde rozetlerin açıklama ve ilerleme durumuyla görünür.' },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <item.icon size={24} className="mb-3 text-violet-600" />
            <div className="font-black text-slate-900">{item.title}</div>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{item.text}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-slate-900">Başvuru kriterleri</h2>
          <div className="space-y-3">
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
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Doğrulama görselleri</h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">Görseller WebP formatına çevrilir ve özel klasörde saklanır.</p>
            </div>
            <FileImage className="text-violet-500" />
          </div>

          {!canApply ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-semibold leading-6 text-slate-500">
              {overview.is_verified_store
                ? 'Mağazanız zaten onaylı. Rozetiniz profilinizde görünecek.'
                : application?.status === 'pending'
                  ? 'Başvurunuz incelemede. Admin onayından sonra yeşil rozet aktif olur.'
                  : 'Başvuru formu tüm kriterler tamamlandığında açılır.'}
              {application?.status === 'rejected' && application.admin_note ? (
                <div className="mt-3 rounded-xl bg-rose-50 p-3 text-rose-600">Red sebebi: {application.admin_note}</div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
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
              </div>
              <textarea
                value={userNote}
                onChange={(event) => setUserNote(event.target.value)}
                rows={3}
                placeholder="Admin için kısa not bırakmak istersen yazabilirsin."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none transition-colors focus:border-violet-400"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {submitting ? 'Başvuru gönderiliyor...' : 'Onaylı Mağaza Başvurusu Gönder'}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Satış rütbeleri</h2>
            <p className="mt-1 text-xs font-semibold text-slate-400">Profilde hiyerarşik olarak yalnızca en yüksek uygun satış rozeti öne çıkar.</p>
          </div>
          <Link to={`/p/${user?.username}`} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-200">
            Profilimi Gör
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(overview.badges || []).map((badge) => (
            <AchievementCard key={badge.id} badge={badge} currentSales={criteria.sales || 0} />
          ))}
          {(!overview.badges || overview.badges.length === 0) ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-400">
              Henüz admin tarafından satış rozeti oluşturulmamış.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
