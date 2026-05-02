import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, FileText, ShieldCheck } from 'lucide-react';
import { getPage } from '../lib/api';
import { useSeo } from '../hooks/useSeo';

function formatDate(value) {
  if (!value) return '';
  return new Date(String(value).replace(' ', 'T')).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function Page() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getPage(slug)
      .then((response) => {
        if (!active) return;
        setPage(response.data || null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Sayfa bulunamadı.');
        setPage(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useSeo({
    title: page?.seo_title || (page?.title ? `${page.title} - Oyuncu Kantinim` : 'Oyuncu Kantinim'),
    description: page?.seo_description || page?.excerpt || 'Oyuncu Kantinim sayfası.',
    canonical: page?.slug ? `/${page.slug}` : undefined,
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 h-12 w-2/3 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-4 rounded-full bg-slate-100 dark:bg-slate-800" style={{ width: `${92 - index * 6}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
          <FileText size={24} />
        </div>
        <h1 className="text-2xl font-black text-slate-950 dark:text-white">Sayfa bulunamadı</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{error || 'Bu bağlantıya ait aktif bir sayfa yok.'}</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
          <ArrowLeft size={16} />
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400" />
        <div className="mb-7 flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          {Number(page.is_contract) === 1 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck size={13} />
              Sözleşme
            </span>
          ) : null}
          {Number(page.is_contract) !== 1 && page.updated_at ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} />
              Son güncelleme: {formatDate(page.updated_at)}
            </span>
          ) : null}
        </div>

        <header className="mb-8">
          <h1 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
            {page.title}
          </h1>
          {page.excerpt ? (
            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-500 dark:text-slate-300">
              {page.excerpt}
            </p>
          ) : null}
        </header>

        <div className="page-content" dangerouslySetInnerHTML={{ __html: page.content || '' }} />
      </div>
    </article>
  );
}
