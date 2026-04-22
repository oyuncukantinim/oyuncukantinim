import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminDeleteUploadedImage,
  adminGetHeroSlides,
  adminSaveHeroSlides,
  adminUploadImage,
} from '../../lib/adminApi';

const ACCENT_PRESETS = [
  { label: 'Neon Mor', value: 'from-violet-600 via-purple-600 to-cyan-500' },
  { label: 'Kızıl Alev', value: 'from-rose-600 via-red-600 to-orange-500' },
  { label: 'Zümrüt Pist', value: 'from-emerald-600 via-teal-600 to-cyan-500' },
  { label: 'Siber Pembe', value: 'from-fuchsia-600 via-pink-600 to-rose-500' },
  { label: 'Altın Saat', value: 'from-amber-500 via-orange-500 to-red-500' },
  { label: 'Buz Mavisi', value: 'from-sky-600 via-blue-600 to-indigo-600' },
  { label: 'Matrix Yeşili', value: 'from-lime-500 via-emerald-500 to-teal-500' },
  { label: 'Galaksi', value: 'from-indigo-700 via-violet-700 to-fuchsia-600' },
];

function createEmptySlide() {
  return {
    _key: `new-${Date.now()}-${Math.random()}`,
    title: '',
    subtitle: '',
    eyebrow: '',
    badge_text: '',
    cta_label: 'Oyuncu Pazarı',
    cta_url: '/market',
    secondary_label: 'Kategorileri Keşfet',
    secondary_url: '/categories',
    image_url: '',
    accent_color: ACCENT_PRESETS[0].value,
    stat_label: '',
    stat_value: '',
    is_active: 1,
  };
}

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [busyKey, setBusyKey] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  };

  useEffect(() => {
    adminGetHeroSlides()
      .then((response) => {
        const data = Array.isArray(response.data) ? response.data : [];
        setSlides(
          data.map((slide, i) => ({
            _key: `s-${slide.id || i}-${Math.random()}`,
            ...slide,
            is_active: Number(slide.is_active ?? 1) ? 1 : 0,
          })),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const updateSlide = (key, patch) =>
    setSlides((prev) => prev.map((s) => (s._key === key ? { ...s, ...patch } : s)));

  const addSlide = () => setSlides((prev) => [...prev, createEmptySlide()]);

  const removeSlide = async (slide) => {
    if (slide.image_url) {
      setBusyKey(slide._key);
      try { await adminDeleteUploadedImage(slide.image_url); } catch { /* ignore */ }
      setBusyKey(null);
    }
    setSlides((prev) => prev.filter((s) => s._key !== slide._key));
  };

  const move = (index, delta) => {
    setSlides((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleImageUpload = async (slide, file) => {
    if (!file) return;
    setBusyKey(slide._key);
    try {
      const prevUrl = slide.image_url || '';
      const url = await adminUploadImage(file, 'branding', { preserveOriginal: true });
      updateSlide(slide._key, { image_url: url });
      if (prevUrl && prevUrl !== url) {
        try { await adminDeleteUploadedImage(prevUrl); } catch { /* ignore */ }
      }
      showToast('Görsel yüklendi.');
    } catch (err) {
      showToast(err.message || 'Görsel yüklenemedi.');
    } finally {
      setBusyKey(null);
    }
  };

  const clearImage = async (slide) => {
    if (!slide.image_url) return;
    setBusyKey(slide._key);
    try { await adminDeleteUploadedImage(slide.image_url); } catch { /* ignore */ }
    updateSlide(slide._key, { image_url: '' });
    setBusyKey(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = slides.map((s) => ({
        title: s.title,
        subtitle: s.subtitle,
        eyebrow: s.eyebrow,
        badge_text: s.badge_text,
        cta_label: s.cta_label,
        cta_url: s.cta_url,
        secondary_label: s.secondary_label,
        secondary_url: s.secondary_url,
        image_url: s.image_url,
        accent_color: s.accent_color,
        stat_label: s.stat_label,
        stat_value: s.stat_value,
        is_active: s.is_active ? 1 : 0,
      }));
      await adminSaveHeroSlides(payload);
      showToast('Slider güncellendi.');
    } catch (err) {
      showToast(err.message || 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-5">
        <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 shadow-sm dark:border-violet-900/40 dark:from-violet-950/30 dark:via-slate-900 dark:to-cyan-950/30">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white">Ana Sayfa Slider</h1>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Hero bölümündeki slide'ları ekle, sırala ve yayınla.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addSlide}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800 dark:text-white dark:ring-slate-700"
              >
                <Plus size={14} /> Slide Ekle
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-slate-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : slides.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Henüz slide yok. <button className="font-black text-violet-600 hover:underline" onClick={addSlide}>Bir tane ekle</button>.
          </div>
        ) : (
          <div className="space-y-4">
            {slides.map((slide, idx) => {
              const isBusy = busyKey === slide._key;
              const fileInputId = `hero-slide-image-${slide._key}`;
              return (
                <div
                  key={slide._key}
                  className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition dark:bg-slate-900 ${
                    slide.is_active
                      ? 'border-slate-200 dark:border-slate-700'
                      : 'border-slate-200 opacity-70 dark:border-slate-800'
                  }`}
                >
                  {/* Preview strip */}
                  <div className={`relative h-24 overflow-hidden bg-gradient-to-r ${slide.accent_color || 'from-violet-600 via-purple-600 to-cyan-500'}`}>
                    {slide.image_url ? (
                      <img
                        src={slide.image_url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-overlay"
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
                    <div className="relative z-10 flex h-full items-center justify-between px-5">
                      <div className="min-w-0">
                        {slide.eyebrow ? (
                          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/80">
                            {slide.eyebrow}
                          </div>
                        ) : null}
                        <div className="mt-0.5 truncate text-lg font-black text-white drop-shadow">
                          {slide.title || <span className="italic text-white/60">Başlıksız slide</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => move(idx, -1)}
                          disabled={idx === 0}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur transition hover:bg-white/30 disabled:opacity-40"
                          title="Yukarı taşı"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(idx, 1)}
                          disabled={idx === slides.length - 1}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur transition hover:bg-white/30 disabled:opacity-40"
                          title="Aşağı taşı"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSlide(slide._key, { is_active: slide.is_active ? 0 : 1 })}
                          className="flex h-8 items-center gap-1 rounded-lg bg-white/20 px-2 text-xs font-black text-white backdrop-blur transition hover:bg-white/30"
                        >
                          {slide.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                          {slide.is_active ? 'Aktif' : 'Gizli'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSlide(slide)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur transition hover:bg-red-500/70"
                          title="Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Editor */}
                  <div className="grid gap-4 p-5 lg:grid-cols-[260px_1fr]">
                    {/* Image uploader */}
                    <div>
                      <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Arka Plan Görseli
                      </label>
                      <div className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-gradient-to-br ${slide.accent_color} border-transparent`}>
                        {slide.image_url ? (
                          <img src={slide.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={28} className="text-white/80" />
                        )}
                        {isBusy ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                            <Loader2 className="animate-spin" size={22} />
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <input
                          id={fileInputId}
                          type="file"
                          accept="image/*,.webp"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            handleImageUpload(slide, file);
                            event.target.value = '';
                          }}
                        />
                        <label
                          htmlFor={fileInputId}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-black text-white shadow-sm transition hover:bg-violet-500"
                        >
                          <Upload size={12} />
                          {slide.image_url ? 'Değiştir' : 'Yükle'}
                        </label>
                        {slide.image_url ? (
                          <button
                            type="button"
                            onClick={() => clearImage(slide)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1.5 text-[11px] font-black text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                          >
                            <X size={11} /> Kaldır
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Text fields */}
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Üst Etiket (Eyebrow)" hint="ör: YENİ SEZON">
                          <input
                            value={slide.eyebrow || ''}
                            onChange={(e) => updateSlide(slide._key, { eyebrow: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </Field>
                        <Field label="Rozet (Badge)" hint="ör: LV 99 · PRO">
                          <input
                            value={slide.badge_text || ''}
                            onChange={(e) => updateSlide(slide._key, { badge_text: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </Field>
                      </div>

                      <Field label="Başlık" required>
                        <input
                          value={slide.title || ''}
                          onChange={(e) => updateSlide(slide._key, { title: e.target.value })}
                          placeholder="Ana başlık"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-black focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </Field>

                      <Field label="Açıklama">
                        <textarea
                          value={slide.subtitle || ''}
                          onChange={(e) => updateSlide(slide._key, { subtitle: e.target.value })}
                          rows={2}
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </Field>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="CTA Buton Metni">
                          <input
                            value={slide.cta_label || ''}
                            onChange={(e) => updateSlide(slide._key, { cta_label: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </Field>
                        <Field label="CTA Link">
                          <input
                            value={slide.cta_url || ''}
                            onChange={(e) => updateSlide(slide._key, { cta_url: e.target.value })}
                            placeholder="/market"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </Field>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="İkincil Buton">
                          <input
                            value={slide.secondary_label || ''}
                            onChange={(e) => updateSlide(slide._key, { secondary_label: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </Field>
                        <Field label="İkincil Buton Link">
                          <input
                            value={slide.secondary_url || ''}
                            onChange={(e) => updateSlide(slide._key, { secondary_url: e.target.value })}
                            placeholder="/categories"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </Field>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="İstatistik Değeri" hint="ör: 50.000+">
                          <input
                            value={slide.stat_value || ''}
                            onChange={(e) => updateSlide(slide._key, { stat_value: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </Field>
                        <Field label="İstatistik Etiketi" hint="ör: Oyuncu">
                          <input
                            value={slide.stat_label || ''}
                            onChange={(e) => updateSlide(slide._key, { stat_label: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        </Field>
                        <Field label="Renk Teması">
                          <select
                            value={slide.accent_color || ACCENT_PRESETS[0].value}
                            onChange={(e) => updateSlide(slide._key, { accent_color: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            {ACCENT_PRESETS.map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="px-1 text-[11px] text-slate-400 dark:text-slate-500">
          Slide'ları yukarı/aşağı okları ile sırala. Gizli slide'lar ana sayfada görünmez.
          Rozet ve istatistik alanları isteğe bağlıdır; boş bırakılırsa gösterilmez.
        </p>
      </div>
    </AdminLayout>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
        {hint ? <span className="font-semibold normal-case tracking-normal text-slate-400">· {hint}</span> : null}
      </div>
      {children}
    </label>
  );
}
