import { User } from 'lucide-react';
import { isImageAvatar } from '../lib/avatar';

export default function UserAvatar({ value, fallback = '👤', className = '', imageClassName = '', iconSize = 18 }) {
  const avatar = String(value || fallback || '').trim();

  return (
    <div className={`overflow-hidden ${className}`}>
      {isImageAvatar(avatar) ? (
        <img src={avatar} alt="" className={`h-full w-full object-cover ${imageClassName}`} />
      ) : avatar ? (
        <span className="leading-none">{avatar}</span>
      ) : (
        <User size={iconSize} className="text-slate-400" />
      )}
    </div>
  );
}
