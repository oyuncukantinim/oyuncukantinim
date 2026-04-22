import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { isImageAvatar, normalizeAvatarSrc } from '../lib/avatar';

export default function UserAvatar({ value, fallback = '👤', className = '', imageClassName = '', iconSize = 18 }) {
  const avatar = String(value || fallback || '').trim();
  const [imageFailed, setImageFailed] = useState(false);
  const shouldShowImage = isImageAvatar(avatar) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [avatar]);

  return (
    <div className={`overflow-hidden ${className}`}>
      {shouldShowImage ? (
        <img
          src={normalizeAvatarSrc(avatar)}
          alt=""
          className={`h-full w-full object-cover ${imageClassName}`}
          onError={() => setImageFailed(true)}
        />
      ) : avatar ? (
        <span className="leading-none">{isImageAvatar(avatar) ? fallback : avatar}</span>
      ) : (
        <User size={iconSize} className="text-slate-400" />
      )}
    </div>
  );
}
