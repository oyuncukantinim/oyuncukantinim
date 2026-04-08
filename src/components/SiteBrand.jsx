import { Link } from 'react-router-dom';
import { Gamepad2, Shield } from 'lucide-react';

export default function SiteBrand({
  siteName = 'Oyuncu Kantinim',
  siteLogo = '',
  siteLogoText = '',
  to,
  fallback = 'gamepad',
  subtitle = '',
  containerClassName = '',
  imageClassName = '',
  iconWrapperClassName = '',
  titleClassName = '',
  subtitleClassName = '',
  showNameWithLogo = false,
}) {
  const FallbackIcon = fallback === 'shield' ? Shield : Gamepad2;
  const hasLogo = Boolean(siteLogo);
  const visibleTitle = siteLogoText || siteName;
  const shouldShowTitle = !hasLogo || showNameWithLogo || Boolean(subtitle) || Boolean(siteLogoText);

  const content = (
    <div className={`flex items-center gap-3 ${containerClassName}`.trim()}>
      {hasLogo ? (
        <div className="flex h-10 w-[220px] max-w-[220px] items-center">
          <img
            src={siteLogo}
            alt={visibleTitle}
            width="220"
            height="40"
            decoding="async"
            className={imageClassName || 'h-10 w-auto max-w-[220px] object-contain'}
          />
        </div>
      ) : (
        <div className={iconWrapperClassName}>
          <FallbackIcon className="text-white" size={22} />
        </div>
      )}

      {shouldShowTitle && (
        <div className="min-w-0">
          {shouldShowTitle && (
            <div className={titleClassName}>{visibleTitle}</div>
          )}
          {subtitle ? <div className={subtitleClassName}>{subtitle}</div> : null}
        </div>
      )}
    </div>
  );

  return to ? (
    <Link to={to} className="group">
      {content}
    </Link>
  ) : (
    content
  );
}
