import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, ShoppingBag, ShoppingCart, MessageCircle, Wallet, Info, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationsRead } from '../lib/api';

const TYPE_CONFIG = {
  sale:         { icon: ShoppingBag,   color: 'bg-emerald-50 text-emerald-600',  ring: 'ring-emerald-200' },
  purchase:     { icon: ShoppingCart,  color: 'bg-violet-50 text-violet-600',    ring: 'ring-violet-200' },
  message:      { icon: MessageCircle, color: 'bg-cyan-50 text-cyan-600',        ring: 'ring-cyan-200' },
  balance:      { icon: Wallet,        color: 'bg-yellow-50 text-yellow-600',    ring: 'ring-yellow-200' },
  announcement: { icon: Megaphone,     color: 'bg-orange-50 text-orange-600',    ring: 'ring-orange-200' },
  info:         { icon: Info,          color: 'bg-gray-100 text-gray-500',       ring: 'ring-gray-200' },
};

function NotifIcon({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ${cfg.color} ${cfg.ring}`}>
      <Icon size={18} />
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Az önce';
  if (diff < 3600) return Math.floor(diff / 60) + ' dk önce';
  if (diff < 86400) return Math.floor(diff / 3600) + ' sa önce';
  if (diff < 604800) return Math.floor(diff / 86400) + ' gün önce';
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getNotifications()
      .then(r => setNotifications(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleMarkRead = async () => {
    try {
      await markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch {}
  };

  const unread = notifications.filter(n => !n.is_read);

  if (!user) return null;

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
            <Bell size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Bildirimler</h1>
            <p className="text-xs text-gray-400">{notifications.length} bildirim{unread.length > 0 && ` · ${unread.length} okunmamış`}</p>
          </div>
        </div>
        {unread.length > 0 && (
          <button
            onClick={handleMarkRead}
            className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-xl transition-colors border border-violet-100"
          >
            <CheckCheck size={14} /> Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {/* Okunmamış özet */}
      {unread.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 animate-pulse" />
          <p className="text-sm font-semibold text-violet-800">
            <span className="font-extrabold">{unread.length}</span> okunmamış bildiriminiz var.
          </p>
        </div>
      )}

      {/* Liste */}
      {notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-gray-300" />
          </div>
          <h3 className="font-extrabold text-gray-300 text-lg">Henüz bildirim yok</h3>
          <p className="text-sm text-gray-300 mt-1">Yeni bildirimler burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                !n.is_read
                  ? 'bg-white border-violet-100 shadow-sm shadow-violet-50'
                  : 'bg-white/50 border-gray-100 opacity-70'
              }`}
            >
              {/* Unread dot */}
              {!n.is_read && (
                <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full" />
              )}

              <NotifIcon type={n.type} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className={`font-extrabold text-sm ${n.is_read ? 'text-gray-500' : 'text-gray-800'}`}>
                    {n.title}
                  </span>
                </div>
                <p className={`text-sm mt-0.5 leading-relaxed ${n.is_read ? 'text-gray-400' : 'text-gray-500'}`}>
                  {n.message}
                </p>
                <span className="text-[11px] text-gray-300 mt-1.5 block">{timeAgo(n.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
