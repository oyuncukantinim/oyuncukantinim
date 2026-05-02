import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  Facebook,
  FileText,
  Flame,
  Headphones,
  Instagram,
  Mail,
  MessageCircle,
  Music2,
  Phone,
  Send,
  Twitter,
  Youtube,
  Zap,
} from 'lucide-react';
import { getContractPages } from '../lib/api';
import {
  DEFAULT_FOOTER_CONTACT_ITEMS,
  DEFAULT_FOOTER_POPULAR_LINKS,
  DEFAULT_FOOTER_QUICK_LINKS,
  normalizeFooterContactItems,
  normalizeFooterLinks,
  normalizeFooterSocialLinks,
} from '../lib/footerConfig';

const socialIconMap = {
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  x: Twitter,
  discord: MessageCircle,
  tiktok: Music2,
  telegram: Send,
  link: Zap,
};

const contactIconMap = {
  support: Headphones,
  whatsapp: MessageCircle,
  phone: Phone,
  mail: Mail,
  link: Zap,
};

function isExternalUrl(url) {
  return /^https?:\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url) || /^whatsapp:/i.test(url);
}

function SmartLink({ to, className = '', children, title }) {
  if (!to) return null;
  if (isExternalUrl(to)) {
    return (
      <a href={to} className={className} target={to.startsWith('http') ? '_blank' : undefined} rel={to.startsWith('http') ? 'noreferrer' : undefined} title={title}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className} title={title}>
      {children}
    </Link>
  );
}

function LinkColumn({ title, icon: Icon, links }) {
  return (
    <div>
      <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
        <Icon size={15} className="text-violet-600 dark:text-violet-300" />
        {title}
      </div>
      <div className="space-y-2.5">
        {links.map((item, index) => (
          <SmartLink
            key={`${item.label}-${index}`}
            to={item.url}
            className="group flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-violet-700 dark:text-slate-400 dark:hover:text-violet-100"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 transition group-hover:bg-violet-500 dark:bg-slate-600 dark:group-hover:bg-violet-300" />
            <span className="truncate">{item.label}</span>
          </SmartLink>
        ))}
      </div>
    </div>
  );
}

export default function Footer({
  footerCopyright = '© Oyuncu Kantinim. Tüm hakları saklıdır.',
  footerPopularLinks,
  footerQuickLinks,
  footerSocialLinks,
  footerContactItems,
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

  const popularLinks = useMemo(
    () => normalizeFooterLinks(footerPopularLinks, DEFAULT_FOOTER_POPULAR_LINKS),
    [footerPopularLinks],
  );
  const quickLinks = useMemo(
    () => normalizeFooterLinks(footerQuickLinks, DEFAULT_FOOTER_QUICK_LINKS),
    [footerQuickLinks],
  );
  const socialLinks = useMemo(
    () => normalizeFooterSocialLinks(footerSocialLinks, []),
    [footerSocialLinks],
  );
  const contactItems = useMemo(
    () => normalizeFooterContactItems(footerContactItems, DEFAULT_FOOTER_CONTACT_ITEMS),
    [footerContactItems],
  );

  return (
    <footer className="relative mt-16 overflow-hidden bg-[#f8fafc] text-slate-900 dark:bg-[#080b14] dark:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/60 via-slate-100/60 to-[#f8fafc] dark:from-slate-900/0 dark:via-slate-900/60 dark:to-[#080b14]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16] dark:opacity-[0.055]"
        style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.22) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent dark:via-violet-400/30" />

      <div className="relative mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/88 shadow-[0_26px_90px_-66px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/[0.03] backdrop-blur dark:border-slate-700/70 dark:bg-slate-950/82 dark:shadow-[0_26px_90px_-62px_rgba(15,23,42,0.95)] dark:ring-white/[0.03]">
          <section className="border-b border-slate-200/80 p-5 sm:p-6 dark:border-slate-800/90">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/55 bg-violet-50 text-violet-700 shadow-[0_10px_30px_-24px_rgba(124,58,237,0.8)] dark:border-violet-400/25 dark:bg-violet-500/10 dark:text-violet-200">
                <Flame size={17} />
              </span>
              Popüler Linkler
            </div>
              <div className="hidden h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent sm:block dark:from-slate-700" />
            </div>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {popularLinks.map((item, index) => (
                <SmartLink
                  key={`${item.label}-${index}`}
                  to={item.url}
                  className="group flex min-w-0 items-center gap-2 rounded-lg py-1.5 text-sm font-semibold text-slate-600 transition hover:text-violet-700 dark:text-slate-400 dark:hover:text-violet-100"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 transition group-hover:bg-violet-500 dark:bg-slate-600 dark:group-hover:bg-violet-300" />
                  <span className="truncate">{item.label}</span>
                </SmartLink>
              ))}
            </div>
          </section>

          <section className="grid gap-0 lg:grid-cols-[minmax(180px,1fr)_minmax(220px,1.15fr)_220px_minmax(260px,1.15fr)]">
            <div className="border-b border-slate-200/80 p-5 sm:p-6 dark:border-slate-800/80 lg:border-b-0 lg:border-r">
              <LinkColumn title="Hızlı Erişim" icon={Zap} links={quickLinks} />
            </div>

            <div className="border-b border-slate-200/80 p-5 sm:p-6 dark:border-slate-800/80 lg:border-b-0 lg:border-r">
              <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              <FileText size={15} className="text-violet-600 dark:text-violet-300" />
              Sözleşme
            </div>
            <div className="space-y-2.5">
              {contractPages.map((page) => (
                <Link key={page.id} to={`/${page.slug}`} className="group flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-violet-700 dark:text-slate-400 dark:hover:text-violet-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 transition group-hover:bg-violet-500 dark:bg-slate-600 dark:group-hover:bg-violet-300" />
                  <span className="truncate">{page.title}</span>
                </Link>
              ))}
            </div>
          </div>

            <div className="border-b border-slate-200/80 p-5 sm:p-6 dark:border-slate-800/80 lg:border-b-0 lg:border-r">
              <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              <MessageCircle size={15} className="text-violet-600 dark:text-violet-300" />
              Sosyal Medya
            </div>
            <div className="flex flex-wrap gap-2.5">
              {socialLinks.length ? socialLinks.map((item, index) => {
                const Icon = socialIconMap[item.type] || Zap;
                return (
                  <SmartLink
                    key={`${item.type}-${index}`}
                    to={item.url}
                    title={item.type}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:shadow-none dark:hover:border-violet-400/55 dark:hover:bg-violet-500/10 dark:hover:text-violet-100"
                  >
                    <Icon size={18} />
                  </SmartLink>
                );
              }) : (
                <div className="text-sm font-semibold text-slate-500">Sosyal medya linki eklenmedi.</div>
              )}
            </div>
          </div>

            <div className="p-5 sm:p-6">
              <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              <Headphones size={15} className="text-violet-600 dark:text-violet-300" />
              İletişim
            </div>
            <div className="space-y-3">
              {contactItems.map((item, index) => {
                const Icon = contactIconMap[item.type] || Zap;
                const content = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-violet-200">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-900 dark:text-slate-100">{item.label || item.value}</span>
                      {item.value && item.value !== item.label ? (
                        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{item.value}</span>
                      ) : null}
                    </span>
                  </>
                );
                return item.url ? (
                  <SmartLink
                    key={`${item.label}-${index}`}
                    to={item.url}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3 transition hover:border-violet-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-violet-400/35 dark:hover:bg-slate-900"
                  >
                    {content}
                  </SmartLink>
                ) : (
                  <div key={`${item.label}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
          </section>

          <div className="border-t border-slate-200/80 px-5 py-4 text-center text-xs font-semibold text-slate-500 dark:border-slate-800/90 sm:px-6">
            {footerCopyright}
          </div>
        </div>
      </div>
    </footer>
  );
}
