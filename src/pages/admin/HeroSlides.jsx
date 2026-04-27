import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Plus,
  Ruler,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminDeleteUploadedImage,
  adminGetHeroBackgrounds,
  adminGetHeroSlides,
  adminSaveHeroBackgrounds,
  adminSaveHeroSlides,
  adminUploadImage,
} from '../../lib/adminApi';

// Slide hero art sits on the right ~55% of the card. At 2x retina that area
// spans roughly 1350×440 CSS pixels, so a ~3:1 source at this native size
// gives a crisp result with the left-fade mask still hiding any seam.
const RECOMMENDED_WIDTH = 1350;
const RECOMMENDED_HEIGHT = 440;
const RECOMMENDED_RATIO = RECOMMENDED_WIDTH / RECOMMENDED_HEIGHT; // ~3.07
const RECOMMENDED_RATIO_LABEL = '3:1';
const RECOMMENDED_SIZE_LABEL = '1350x440px';
const MAX_RECOMMENDED_BYTES = 500 * 1024; // 500 KB
const MIN_RECOMMENDED_WIDTH = 1200; // below this the hero canvas softens on desktop
const RATIO_TOLERANCE = 0.25; // accepts 16:10 / 3:2 / 21:9 gracefully

// Background pool is rendered full-bleed behind the card with heavy dimming,
// so wide cinematic landscape screenshots work best.
const BG_RECOMMENDED_WIDTH = 1910;
const BG_RECOMMENDED_HEIGHT = 460;
const BG_RECOMMENDED_SIZE_LABEL = '1910x460px';

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
    cta_label: 'Oyuncu Pazarı',
    cta_url: '/market',
    image_url: '',
    icon_url: '',
    accent_color: ACCENT_PRESETS[0].value,
    is_active: 1,
  };
}

function getMetaKey(slideKey) {
  return slideKey;
}

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState([]);
  const [backgrounds, setBackgrounds] = useState([]); // [{ _key, image_url }]
  const [bgBusy, setBgBusy] = useState(false);
  const [bgSaving, setBgSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [busyKey, setBusyKey] = useState(null);
  const [imageMeta, setImageMeta] = useState({}); // key -> { width, height, bytes }
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  };

  const setBusyTarget = (slideKey, target) => {
    setBusyKey(`${slideKey}:${target}`);
  };

  useEffect(() => {
    Promise.allSettled([adminGetHeroSlides(), adminGetHeroBackgrounds()])
      .then(([slidesRes, bgRes]) => {
        if (slidesRes.status === 'fulfilled') {
          const data = Array.isArray(slidesRes.value.data) ? slidesRes.value.data : [];
          const mapped = data.map((slide, i) => ({
            _key: `s-${slide.id || i}-${Math.random()}`,
            ...slide,
            is_active: Number(slide.is_active ?? 1) ? 1 : 0,
          }));
          setSlides(mapped);
          // Probe remote image dimensions once so we can show size hints on load.
          mapped.forEach((s) => {
            if (!s.image_url) return;
            const img = new Image();
            img.onload = () => {
              setImageMeta((prev) => ({
                ...prev,
                [s._key]: { width: img.naturalWidth, height: img.naturalHeight, bytes: null },
              }));
            };
            img.src = s.image_url;
          });
        }
        if (bgRes.status === 'fulfilled') {
          const bgData = Array.isArray(bgRes.value.data) ? bgRes.value.data : [];
          setBackgrounds(bgData.map((b, i) => ({
            _key: `bg-${b.id || i}-${Math.random()}`,
            image_url: b.image_url || '',
          })));
        }
      })
      .finally(() => setLoading(false));
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const updateSlide = (key, patch) =>
    setSlides((prev) => prev.map((s) => (s._key === key ? { ...s, ...patch } : s)));

  const addSlide = () => setSlides((prev) => [...prev, createEmptySlide()]);

  const removeSlide = async (slide) => {
    if (slide.image_url || slide.icon_url) {
      setBusyTarget(slide._key, 'remove');
      try {
        if (slide.image_url) await adminDeleteUploadedImage(slide.image_url);
      } catch { /* ignore */ }
      try {
        if (slide.icon_url) await adminDeleteUploadedImage(slide.icon_url);
      } catch { /* ignore */ }
      setBusyKey(null);
    }
    setSlides((prev) => prev.filter((s) => s._key !== slide._key));
    setImageMeta((prev) => {
      const next = { ...prev };
      delete next[slide._key];
      return next;
    });
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

  const readLocalDimensions = (file) =>
    new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
          URL.revokeObjectURL(url);
        };
        img.onerror = () => {
          resolve(null);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } catch {
        resolve(null);
      }
    });

  const handleImageUpload = async (slide, file) => {
    if (!file) return;
    setBusyTarget(slide._key, 'image');
    try {
      // Capture local dimensions + size before upload for instant feedback.
      const dims = await readLocalDimensions(file);
      const prevUrl = slide.image_url || '';
      const url = await adminUploadImage(file, 'hero-slider');
      updateSlide(slide._key, { image_url: url });
      setImageMeta((prev) => ({
        ...prev,
        [slide._key]: {
          width: dims?.width ?? null,
          height: dims?.height ?? null,
          bytes: file.size,
        },
      }));
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

  const _handleMobileImageUpload = async (slide, file) => {
    if (!file) return;
    setBusyTarget(slide._key, 'mobile');
    try {
      const dims = await readLocalDimensions(file);
      const prevUrl = slide.mobile_image_url || '';
      const url = await adminUploadImage(file, 'hero-slider-mobile');
      updateSlide(slide._key, { mobile_image_url: url });
      setImageMeta((prev) => ({
        ...prev,
        [getMetaKey(slide._key, 'mobile')]: {
          width: dims?.width ?? null,
          height: dims?.height ?? null,
          bytes: file.size,
        },
      }));
      if (prevUrl && prevUrl !== url) {
        try { await adminDeleteUploadedImage(prevUrl); } catch { /* ignore */ }
      }
      showToast('Mobil görsel yüklendi.');
    } catch (err) {
      showToast(err.message || 'Mobil görsel yüklenemedi.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleIconUpload = async (slide, file) => {
    if (!file) return;
    setBusyTarget(slide._key, 'icon');
    try {
      const prevUrl = slide.icon_url || '';
      const url = await adminUploadImage(file, 'hero-slider-icons');
      updateSlide(slide._key, { icon_url: url });
      if (prevUrl && prevUrl !== url) {
        try { await adminDeleteUploadedImage(prevUrl); } catch { /* ignore */ }
      }
      showToast('İkon yüklendi.');
    } catch (err) {
      showToast(err.message || 'İkon yüklenemedi.');
    } finally {
      setBusyKey(null);
    }
  };

  const clearIcon = async (slide) => {
    if (!slide.icon_url) return;
    setBusyTarget(slide._key, 'icon');
    try {
      await adminDeleteUploadedImage(slide.icon_url);
      showToast('İkon dosyadan silindi.');
    } catch {
      showToast('İkon kaldırıldı (dosya silinemedi).');
    }
    updateSlide(slide._key, { icon_url: '' });
    setBusyKey(null);
  };

  const clearImage = async (slide) => {
    if (!slide.image_url) return;
    setBusyTarget(slide._key, 'image');
    try {
      await adminDeleteUploadedImage(slide.image_url);
      showToast('Görsel dosyadan silindi.');
    } catch {
      showToast('Görsel kaldırıldı (dosya silinemedi).');
    }
    updateSlide(slide._key, { image_url: '' });
    setImageMeta((prev) => {
      const next = { ...prev };
      delete next[getMetaKey(slide._key, 'desktop')];
      return next;
    });
    setBusyKey(null);
  };

  const _clearMobileImage = async (slide) => {
    if (!slide.mobile_image_url) return;
    setBusyTarget(slide._key, 'mobile');
    try {
      await adminDeleteUploadedImage(slide.mobile_image_url);
      showToast('Mobil görsel dosyadan silindi.');
    } catch {
      showToast('Mobil görsel kaldırıldı (dosya silinemedi).');
    }
    updateSlide(slide._key, { mobile_image_url: '' });
    setImageMeta((prev) => {
      const next = { ...prev };
      delete next[getMetaKey(slide._key, 'mobile')];
      return next;
    });
    setBusyKey(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = slides.map((s) => ({
        title: s.title,
        subtitle: s.subtitle,
        eyebrow: s.eyebrow,
        tab_label: '',
        badge_text: '',
        cta_label: s.cta_label,
        cta_url: s.cta_url,
        secondary_label: '',
        secondary_url: '',
        image_url: s.image_url,
        mobile_image_url: '',
        icon_url: s.icon_url,
        accent_color: s.accent_color,
        stat_label: '',
        stat_value: '',
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

  // -------- Background pool handlers --------
  const addBackgroundFile = async (file) => {
    if (!file) return;
    setBgBusy(true);
    try {
      const url = await adminUploadImage(file, 'hero-slider-bg');
      setBackgrounds((prev) => [...prev, { _key: `bg-new-${Date.now()}-${Math.random()}`, image_url: url }]);
      showToast('Arka plan yüklendi (kaydetmeyi unutma).');
    } catch (err) {
      showToast(err.message || 'Arka plan yüklenemedi.');
    } finally {
      setBgBusy(false);
    }
  };

  const removeBackground = async (bg) => {
    setBgBusy(true);
    try {
      if (bg.image_url) await adminDeleteUploadedImage(bg.image_url);
    } catch { /* ignore */ }
    setBackgrounds((prev) => prev.filter((b) => b._key !== bg._key));
    setBgBusy(false);
  };

  const saveBackgrounds = async () => {
    setBgSaving(true);
    try {
      await adminSaveHeroBackgrounds(backgrounds.map((b) => ({ image_url: b.image_url })));
      showToast('Arka plan havuzu kaydedildi.');
    } catch (err) {
      showToast(err.message || 'Kaydedilemedi.');
    } finally {
      setBgSaving(false);
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

        {/* ============== Background pool manager ============== */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                <ImageIcon size={16} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 text-sm font-black text-slate-800 dark:text-white">
                  Arka Plan Havuzu
                  <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-white dark:bg-slate-700">
                    {BG_RECOMMENDED_SIZE_LABEL}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Sayfa her yenilendiğinde bu havuzdan rastgele bir görsel arkada gösterilir (slayt değişirken değişmez).
                  Çok koyu olmayan, yatay kadrajlı arka planlar en temiz sonucu verir.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="hero-bg-upload"
                type="file"
                accept="image/*,.webp"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  for (const f of files) {
                    await addBackgroundFile(f);
                  }
                  e.target.value = '';
                }}
              />
              <label
                htmlFor="hero-bg-upload"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-700"
              >
                {bgBusy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                Görsel Yükle
              </label>
              <button
                type="button"
                onClick={saveBackgrounds}
                disabled={bgSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-3 py-2 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-60 dark:from-slate-700 dark:to-slate-800"
              >
                {bgSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Kaydet
              </button>
            </div>
          </div>

          {backgrounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              <ImageIcon size={24} className="text-slate-300 dark:text-slate-600" />
              <div className="font-semibold">Henüz arka plan yok.</div>
              <div className="text-[11px]">
                Önerilen: {BG_RECOMMENDED_SIZE_LABEL} · birden fazla ekleyebilirsin (rastgele seçilir).
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {backgrounds.map((bg) => (
                <div
                  key={bg._key}
                  className="group/bg relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                  style={{ aspectRatio: '10 / 3' }}
                >
                  <img src={bg.image_url} alt="" className="h-full w-full object-contain bg-slate-950/80 p-1" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover/bg:opacity-100" />
                  <button
                    type="button"
                    onClick={() => removeBackground(bg)}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-rose-600/90 text-white opacity-0 shadow-lg transition-opacity hover:bg-rose-500 group-hover/bg:opacity-100"
                    title="Kaldır"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
              const isImageBusy = busyKey === `${slide._key}:image`;
              const isIconBusy = busyKey === `${slide._key}:icon`;
              const _isMobileBusy = busyKey === `${slide._key}:mobile`;
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
                      <div className="flex min-w-0 items-center gap-3">
                        {slide.icon_url ? (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15 p-2 backdrop-blur">
                            <img src={slide.icon_url} alt="" className="h-full w-full object-contain" />
                          </div>
                        ) : null}
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
                        Kart Görseli <span className="font-semibold normal-case tracking-normal text-slate-400">· {RECOMMENDED_SIZE_LABEL}</span>
                      </label>
                      <div className={`relative flex aspect-[3/1] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-gradient-to-br ${slide.accent_color} border-transparent`}>
                        {slide.image_url ? (
                          <img src={slide.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-white/90">
                            <ImageIcon size={26} />
                            <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
                              {RECOMMENDED_SIZE_LABEL}
                            </span>
                          </div>
                        )}
                        {isImageBusy ? (
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
                      <ImageSizeHint meta={imageMeta[getMetaKey(slide._key)]} hasImage={!!slide.image_url} />
                    </div>

                    {/* Text fields */}
                    <div className="space-y-3">
                      {/* Tab icon — this IS the tab header on the front-end */}
                      <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-300">
                          <ImageIcon size={12} /> Alt Sekme İkonu
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="shrink-0">
                            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                              {slide.icon_url ? (
                                <img src={slide.icon_url} alt="" className="h-full w-full object-contain p-2" />
                              ) : (
                                <ImageIcon size={24} className="text-slate-300" />
                              )}
                              {isIconBusy ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                                  <Loader2 className="animate-spin" size={20} />
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <input
                                id={`hero-slide-icon-${slide._key}`}
                                type="file"
                                accept="image/png,image/webp,image/svg+xml,image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  handleIconUpload(slide, f);
                                  e.target.value = '';
                                }}
                              />
                              <label
                                htmlFor={`hero-slide-icon-${slide._key}`}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-violet-500"
                              >
                                <Upload size={11} />
                                {slide.icon_url ? 'Değiştir' : 'İkon Yükle'}
                              </label>
                              {slide.icon_url ? (
                                <button
                                  type="button"
                                  onClick={() => clearIcon(slide)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1.5 text-[11px] font-black text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                                >
                                  <X size={11} /> Kaldır
                                </button>
                              ) : null}
                            </div>
                            <p className="text-[10px] font-semibold leading-snug text-slate-500 dark:text-slate-400">
                              Şeffaf arka planlı PNG / SVG öner. Yükleme sonrası otomatik 48×48 px tuvale
                              dönüştürülür; slider'ın alt sekmesinde başlık yerine geçer ve aktifken slayt
                              renginde parlar.
                            </p>
                          </div>
                        </div>
                      </div>

                      <Field label="Üst Etiket (Eyebrow)" hint="ör: YENİ SEZON — başlığın üstünde küçük etiket olarak çıkar">
                        <input
                          value={slide.eyebrow || ''}
                          onChange={(e) => updateSlide(slide._key, { eyebrow: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </Field>

                      <Field label="Başlık">
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

                      <Field label="Renk Teması" hint="Sol accent çizgisi, CTA butonu, aktif sekme zemini ve sekme parlamasında kullanılır">
                        <select
                          value={slide.accent_color || ACCENT_PRESETS[0].value}
                          onChange={(e) => updateSlide(slide._key, { accent_color: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          {ACCENT_PRESETS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="px-1 text-[11px] text-slate-400 dark:text-slate-500">
          Slide'ları yukarı/aşağı okları ile sırala. Gizli slide'lar ana sayfada görünmez.
          Kart görseli için {RECOMMENDED_SIZE_LABEL}, arka plan havuzu için {BG_RECOMMENDED_SIZE_LABEL} önerilir.
        </p>
      </div>
    </AdminLayout>
  );
}

function ImageSizeHint({ meta, hasImage }) {
  if (!hasImage) {
    return (
      <p className="mt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
        Önerilen görsel boyutu: {RECOMMENDED_SIZE_LABEL}.
      </p>
    );
  }

  if (!meta || !meta.width) {
    return (
      <p className="mt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
        Görsel analiz ediliyor…
      </p>
    );
  }

  const ratio = meta.width / meta.height;
  const ratioOk = Math.abs(ratio - RECOMMENDED_RATIO) / RECOMMENDED_RATIO <= RATIO_TOLERANCE;
  const widthOk = meta.width >= MIN_RECOMMENDED_WIDTH;
  const sizeOk = meta.bytes == null || meta.bytes <= MAX_RECOMMENDED_BYTES;
  const allOk = ratioOk && widthOk && sizeOk;

  const ratioLabel = ratio >= 1 ? `${ratio.toFixed(2)}:1` : `1:${(1 / ratio).toFixed(2)}`;

  return (
    <div className={`mt-2 rounded-xl border px-2.5 py-2 text-[10px] font-semibold leading-snug ${
      allOk
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'
        : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200'
    }`}>
      <div className="flex flex-wrap items-center gap-1.5 font-black uppercase tracking-wider">
        <Ruler size={11} />
        <span>{meta.width} × {meta.height}</span>
        <span className="opacity-70">· {ratioLabel}</span>
        {meta.bytes != null ? (
          <span className="opacity-70">· {(meta.bytes / 1024).toFixed(0)} KB</span>
        ) : null}
      </div>
      {!allOk ? (
        <ul className="mt-1 space-y-0.5 normal-case tracking-normal">
          {!ratioOk ? <li>· Oran {RECOMMENDED_RATIO_LABEL}'a yakın olmalı (önerilen {RECOMMENDED_WIDTH}×{RECOMMENDED_HEIGHT}).</li> : null}
          {!widthOk ? <li>· En az {MIN_RECOMMENDED_WIDTH} px genişlik önerilir, aksi halde arka plan yumuşar.</li> : null}
          {!sizeOk ? <li>· Dosya boyutu {(MAX_RECOMMENDED_BYTES / 1024).toFixed(0)} KB altına düşerse daha hızlı yüklenir.</li> : null}
        </ul>
      ) : (
        <div className="mt-0.5 normal-case tracking-normal opacity-80">Önerilen boyuta uygun.</div>
      )}
    </div>
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


