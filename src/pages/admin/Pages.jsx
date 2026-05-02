import { useEffect, useMemo, useState } from 'react';
import { Copy, Eye, FileText, Globe2, Plus, Save, Search, ShieldCheck, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import RichPageEditor from '../../components/RichPageEditor';
import {
  adminDeletePage,
  adminDeletePageImage,
  adminGetPage,
  adminGetPages,
  adminSavePage,
  adminUploadPageImage,
} from '../../lib/adminApi';

const emptyForm = {
  id: 0,
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  seo_title: '',
  seo_description: '',
  is_contract: 1,
  is_active: 1,
  sort_order: 0,
};

function makeSlug(value) {
  return String(value || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function publicUrl(slug) {
  return `/${makeSlug(slug)}`;
}

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);

  const loadPages = () => {
    setLoading(true);
    const query = {};
    if (search.trim()) query.search = search.trim();
    if (filter === 'contracts') query.contract = 1;
    if (filter === 'standalone') query.contract = 0;
    if (filter === 'active') query.active = 1;
    if (filter === 'passive') query.active = 0;
    adminGetPages(query)
      .then((response) => setPages(response.data || []))
      .catch((error) => setMessage(error.message || 'Sayfalar alınamadı.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const selectedPage = useMemo(() => pages.find((page) => Number(page.id) === Number(form.id)), [form.id, pages]);

  const updateField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && autoSlug && !prev.id) {
        next.slug = makeSlug(value);
      }
      if (key === 'slug') {
        next.slug = makeSlug(value);
        setAutoSlug(false);
      }
      return next;
    });
  };

  const startNew = () => {
    setForm(emptyForm);
    setAutoSlug(true);
    setMessage('');
  };

  const editPage = async (id) => {
    setMessage('');
    try {
      const response = await adminGetPage(id);
      const page = response.data || {};
      setForm({
        id: Number(page.id || 0),
        title: page.title || '',
        slug: page.slug || '',
        excerpt: page.excerpt || '',
        content: page.content || '',
        seo_title: page.seo_title || '',
        seo_description: page.seo_description || '',
        is_contract: Number(page.is_contract || 0),
        is_active: Number(page.is_active || 0),
        sort_order: Number(page.sort_order || 0),
      });
      setAutoSlug(false);
    } catch (error) {
      setMessage(error.message || 'Sayfa açılmadı.');
    }
  };

  const savePage = async () => {
    if (!form.title.trim()) {
      setMessage('Sayfa başlığı gerekli.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        ...form,
        slug: makeSlug(form.slug || form.title),
        seo_title: form.title,
        seo_description: form.excerpt,
        is_contract: form.is_contract ? 1 : 0,
        is_active: form.is_active ? 1 : 0,
        sort_order: Number(form.sort_order || 0),
      };
      const response = await adminSavePage(payload);
      setForm((prev) => ({ ...prev, id: response.data?.id || prev.id, slug: response.data?.slug || payload.slug }));
      setMessage('Sayfa kaydedildi.');
      loadPages();
    } catch (error) {
      setMessage(error.message || 'Sayfa kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const removePage = async (page) => {
    if (!window.confirm(`${page.title} sayfası silinsin mi?`)) return;
    setMessage('');
    try {
      await adminDeletePage(page.id);
      if (Number(form.id) === Number(page.id)) startNew();
      setMessage('Sayfa silindi.');
      loadPages();
    } catch (error) {
      setMessage(error.message || 'Sayfa silinemedi.');
    }
  };

  const copyLink = async () => {
    const link = publicUrl(form.slug || form.title);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${link}`);
      setMessage('Sayfa bağlantısı kopyalandı.');
    } catch {
      setMessage(link);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              <FileText size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Sayfalar</h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Kurumsal metinler, sözleşmeler ve özel içerik sayfaları.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5"
          >
            <Plus size={17} />
            Yeni Sayfa
          </button>
        </div>

        {message ? (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') loadPages();
                  }}
                  placeholder="Sayfa ara..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ['all', 'Tümü'],
                  ['contracts', 'Sözleşme'],
                  ['active', 'Yayında'],
                  ['passive', 'Pasif'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                      filter === value
                        ? 'border-violet-500 bg-violet-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="border-b border-slate-100 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:border-slate-800">
                Sayfa Listesi
              </div>
              <div className="max-h-[720px] overflow-y-auto p-2">
                {loading ? (
                  <div className="p-4 text-sm font-bold text-slate-400">Yükleniyor...</div>
                ) : pages.length === 0 ? (
                  <div className="p-4 text-sm font-bold text-slate-400">Sayfa bulunamadı.</div>
                ) : (
                  pages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => editPage(page.id)}
                      className={`mb-2 w-full rounded-2xl border p-3 text-left transition ${
                        Number(form.id) === Number(page.id)
                          ? 'border-violet-400 bg-violet-50 dark:border-violet-500/60 dark:bg-violet-500/10'
                          : 'border-transparent bg-slate-50 hover:border-slate-200 dark:bg-slate-900/70 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-slate-900 dark:text-white">{page.title}</div>
                          <div className="mt-1 truncate text-xs font-semibold text-slate-400">/{page.slug}</div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {Number(page.is_contract) === 1 ? <ShieldCheck size={15} className="text-emerald-500" /> : null}
                          {Number(page.is_active) === 1 ? <Globe2 size={15} className="text-cyan-500" /> : null}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Başlık</label>
                  <input
                    value={form.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    placeholder="Kişisel Verilerin Korunması ve İşlenmesi Politikası"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Sıra</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(event) => updateField('sort_order', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Sayfa Linki</label>
                  <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                    <span className="flex items-center border-r border-slate-200 px-3 text-sm font-black text-slate-400 dark:border-slate-700">/</span>
                    <input
                      value={form.slug}
                      onChange={(event) => updateField('slug', event.target.value)}
                      placeholder="kvkk"
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-bold text-slate-800 outline-none dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <a
                    href={publicUrl(form.slug || form.title)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <Eye size={16} />
                    Önizle
                  </a>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-4 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                    title="Bağlantıyı kopyala"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <span>
                    <span className="block text-sm font-black text-emerald-800 dark:text-emerald-200">Sözleşme</span>
                    <span className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-300/80">Footer Kurumsal sütununda gösterilir.</span>
                  </span>
                  <input type="checkbox" checked={Boolean(form.is_contract)} onChange={(event) => updateField('is_contract', event.target.checked ? 1 : 0)} className="h-5 w-5 accent-emerald-600" />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 dark:border-cyan-500/30 dark:bg-cyan-500/10">
                  <span>
                    <span className="block text-sm font-black text-cyan-800 dark:text-cyan-200">Yayında</span>
                    <span className="text-xs font-semibold text-cyan-600/80 dark:text-cyan-300/80">Pasif olursa sayfa açılmaz.</span>
                  </span>
                  <input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => updateField('is_active', event.target.checked ? 1 : 0)} className="h-5 w-5 accent-cyan-600" />
                </label>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Kısa Açıklama</label>
                <textarea
                  value={form.excerpt}
                  onChange={(event) => updateField('excerpt', event.target.value)}
                  rows={2}
                  maxLength={420}
                  placeholder="Sayfanın kısa özeti..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <RichPageEditor
              value={form.content}
              pageId={form.id}
              onChange={(html) => updateField('content', html)}
              onUploadImage={adminUploadPageImage}
              onDeleteManagedImage={adminDeletePageImage}
            />

            <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-950/90 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {selectedPage ? `Düzenleniyor: ${selectedPage.title}` : 'Yeni sayfa oluşturuluyor'}
              </div>
              <div className="flex gap-2">
                {form.id ? (
                  <button
                    type="button"
                    onClick={() => removePage(form)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                    Sil
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={savePage}
                  disabled={saving}
                  className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save size={16} />}
                  Kaydet
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
