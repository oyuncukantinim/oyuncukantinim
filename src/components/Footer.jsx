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
      <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-300">
        <Icon size={15} className="text-cyan-300" />
        {title}
      </div>
      <div className="space-y-2.5">
        {links.map((item, index) => (
          <SmartLink
            key={`${item.label}-${index}`}
            to={item.url}
            className="group flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70 shadow-[0_0_12px_rgba(34,211,238,0.45)] transition group-hover:bg-fuchsia-300" />
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
    <footer className="relative mt-16 overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

      <div className="relative mx-auto max-w-screen-2xl px-4 py-11 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_26px_80px_-58px_rgba(34,211,238,0.65)] backdrop-blur sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 text-sm font-black text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.18)]">
                <Flame size={17} />
              </span>
              Popüler Linkler
            </div>
            <div className="hidden h-px flex-1 bg-gradient-to-r from-cyan-300/25 to-transparent sm:block" />
          </div>
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
            {popularLinks.map((item, index) => (
              <SmartLink
                key={`${item.label}-${index}`}
                to={item.url}
                className="group flex min-w-0 items-center gap-2 rounded-xl px-1 py-1.5 text-sm font-semibold text-slate-400 transition hover:text-white"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300 shadow-[0_0_12px_rgba(196,181,253,0.55)] transition group-hover:bg-cyan-300" />
                <span className="truncate">{item.label}</span>
              </SmartLink>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-7 lg:grid-cols-[minmax(180px,1fr)_minmax(220px,1.15fr)_220px_minmax(260px,1.15fr)]">
          <LinkColumn title="Hızlı Erişim" icon={Zap} links={quickLinks} />

          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              <FileText size={15} className="text-cyan-300" />
              Sözleşme
            </div>
            <div className="space-y-2.5">
              {contractPages.map((page) => (
                <Link key={page.id} to={`/${page.slug}`} className="group flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70 shadow-[0_0_12px_rgba(34,211,238,0.45)] transition group-hover:bg-fuchsia-300" />
                  <span className="truncate">{page.title}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              <MessageCircle size={15} className="text-cyan-300" />
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
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-300/10 hover:text-cyan-100 hover:shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                  >
                    <Icon size={18} />
                  </SmartLink>
                );
              }) : (
                <div className="text-sm font-semibold text-slate-500">Sosyal medya linki eklenmedi.</div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              <Headphones size={15} className="text-cyan-300" />
              İletişim
            </div>
            <div className="space-y-3">
              {contactItems.map((item, index) => {
                const Icon = contactIconMap[item.type] || Zap;
                const content = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-cyan-200">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-100">{item.label || item.value}</span>
                      {item.value && item.value !== item.label ? (
                        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-400">{item.value}</span>
                      ) : null}
                    </span>
                  </>
                );
                return item.url ? (
                  <SmartLink
                    key={`${item.label}-${index}`}
                    to={item.url}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition hover:border-cyan-300/35 hover:bg-white/[0.075]"
                  >
                    {content}
                  </SmartLink>
                ) : (
                  <div key={`${item.label}-${index}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mt-9 border-t border-white/10 pt-5 text-center text-xs font-semibold text-slate-500">
          {footerCopyright}
        </div>
      </div>
    </footer>
  );
}
