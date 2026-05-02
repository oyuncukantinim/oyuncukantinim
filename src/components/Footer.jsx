import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import SiteBrand from './SiteBrand';
import { getContractPages } from '../lib/api';

export default function Footer({
  siteName = 'Oyuncu Kantinim',
  siteLogo = '',
  siteLogoText = '',
  footerTagline = 'Oyuncular için güvenli alım satım platformu.',
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
    <footer className="mt-16 border-t border-gray-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_220px_260px_minmax(180px,auto)] md:items-start">
          <div className="max-w-md">
            <SiteBrand
              to="/"
              siteName={siteName}
              siteLogo={siteLogo}
              siteLogoText={siteLogoText}
              imageClassName="h-10 w-auto max-w-[220px] object-contain"
              iconWrapperClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-neon-purple to-neon-cyan shadow-neon-purple"
              titleClassName="text-xl font-black tracking-tight bg-gradient-to-r from-neon-purple to-neon-cyan bg-clip-text text-transparent"
            />
            <div className="mt-2 text-sm font-medium text-gray-500 dark:text-slate-400">{footerTagline}</div>
          </div>

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
                <Building2 size={14} />
                Kurumsal
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

          <div className="text-sm font-medium text-gray-500 dark:text-slate-400 md:text-right">
            {footerCopyright}
          </div>
        </div>
      </div>
    </footer>
  );
}
