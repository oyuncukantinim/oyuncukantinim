import { Link } from 'react-router-dom';
import SiteBrand from './SiteBrand';

export default function Footer({
  siteName = 'Oyuncu Kantinim',
  siteLogo = '',
  siteLogoText = '',
  footerTagline = 'Oyuncular için güvenli alım satım platformu.',
  footerCopyright = '© Oyuncu Kantinim. Tüm hakları saklıdır.',
}) {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div>
            <SiteBrand
              to="/"
              siteName={siteName}
              siteLogo={siteLogo}
              siteLogoText={siteLogoText}
              imageClassName="h-10 w-auto max-w-[220px] object-contain"
              iconWrapperClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-neon-purple to-neon-cyan shadow-neon-purple"
              titleClassName="text-xl font-black tracking-tight text-slate-700"
            />
            <div className="mt-2 text-sm text-gray-500">{footerTagline}</div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <Link to="/store" className="transition-colors hover:text-violet-700">E-Pin</Link>
            <Link to="/market" className="transition-colors hover:text-violet-700">Pazar</Link>
            <span className="cursor-default">SSS</span>
            <Link to="/support" className="transition-colors hover:text-violet-700">Destek</Link>
          </div>

          <div className="text-sm text-gray-500">
            {footerCopyright}
          </div>
        </div>
      </div>
    </footer>
  );
}
