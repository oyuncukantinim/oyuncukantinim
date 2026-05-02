import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { getContractPages } from '../lib/api';

export default function Footer({
  footerCopyright = '© Oyuncu Kantinim. Tüm hakları saklıdır.',
}) {
  const [contractPages, setContractPages] = useState([]);

  useEffect(() => {
    let active = true;
    getContractPages()
      .then((response) => {
        if (active) setContractPages(response.data || []);
      })
      .catch(() => {
        if (active) setContractPages([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <footer className="relative mt-16 bg-gradient-to-b from-slate-100/45 via-white to-white py-10 dark:from-slate-900/45 dark:via-slate-950 dark:to-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-200/35 to-transparent dark:from-slate-700/20" />
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[220px_minmax(260px,1fr)] lg:items-start">
          <div>
            <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">Site</div>
            <div className="space-y-2 text-sm font-semibold text-gray-500 dark:text-slate-400">
              <Link to="/market" className="block transition-colors hover:text-violet-700 dark:hover:text-violet-300">Pazar</Link>
              <Link to="/categories" className="block transition-colors hover:text-violet-700 dark:hover:text-violet-300">Kategoriler</Link>
              <Link to="/support" className="block transition-colors hover:text-violet-700 dark:hover:text-violet-300">Destek</Link>
            </div>
          </div>

          {contractPages.length > 0 ? (
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
                <FileText size={14} />
                Sözleşme
              </div>
              <div className="space-y-2 text-sm font-semibold text-gray-500 dark:text-slate-400">
                {contractPages.map((page) => (
                  <Link key={page.id} to={`/${page.slug}`} className="block transition-colors hover:text-violet-700 dark:hover:text-violet-300">
                    {page.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>

        <div className="mt-8 border-t border-gray-100 pt-5 text-center text-xs font-semibold text-gray-400 dark:border-slate-800 dark:text-slate-500">
          {footerCopyright}
        </div>
      </div>
    </footer>
  );
}
