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
        <img           src={siteLogo}
          alt={visibleTitle}
          className={imageClassName || 'h-10 w-auto object-contain'}
        />
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
