import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell, CheckCheck, ShoppingBag, ShoppingCart, MessageCircle,
  Wallet, Megaphone, Info, TrendingDown, Star, Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationsRead } from '../lib/api';

const TYPE_CONFIG = {
  sale:         { icon: ShoppingBag,   bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Satış' },
  purchase:     { icon: ShoppingCart,  bg: 'bg-violet-100',  text: 'text-violet-600',  label: 'Alım' },
  message:      { icon: MessageCircle, bg: 'bg-cyan-100',    text: 'text-cyan-600',    label: 'Mesaj' },
  balance:      { icon: Wallet,        bg: 'bg-yellow-100',  text: 'text-yellow-600',  label: 'Bakiye' },
  payment:      { icon: Wallet,        bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Ödeme' },
  announcement: { icon: Megaphone,     bg: 'bg-orange-100',  text: 'text-orange-600',  label: 'Duyuru' },
  review:       { icon: Star,          bg: 'bg-yellow-100',  text: 'text-yellow-600',  label: 'Yorum' },
  refund:       { icon: Gift,          bg: 'bg-blue-100',    text: 'text-blue-600',    label: 'İade' },
  price_drop:   { icon: TrendingDown,  bg: 'bg-rose-100',    text: 'text-rose-600',    label: 'Fiyat Düştü' },
  info:         { icon: Info,          bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'Bilgi' },
};

function typeCfg(type) { return TYPE_CONFIG[type] || TYPE_CONFIG.info; }

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
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getNotifications()
      .then(r => {
        setNotifications(r.data || []);
        // Auto-mark all as read when page is visited
        const hasUnread = (r.data || []).some(n => !n.is_read);
        if (hasUnread) {
          markNotificationsRead().catch(() => {});
          window.dispatchEvent(new CustomEvent('notifications-read'));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleMarkRead = async () => {
    try {
      await markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      window.dispatchEvent(new CustomEvent('notifications-read'));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayed = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Header Card */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg shadow-violet-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Bell size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Bildirimler</h1>
              <p className="text-violet-200 text-sm mt-0.5">
                {notifications.length} bildirim
                {unreadCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} yeni</span>}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkRead}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors backdrop-blur-sm"
            >
              <CheckCheck size={14} /> Tümünü Okundu İşaretle
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm">
        {[{ id: 'all', label: 'Tümü', count: notifications.length }, { id: 'unread', label: 'Okunmamış', count: unreadCount }].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${filter === f.id ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-full ${filter === f.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <Bell size={28} className="text-gray-200" />
          </div>
          <h3 className="font-extrabold text-gray-300 text-lg">
            {filter === 'unread' ? 'Okunmamış bildirim yok' : 'Henüz bildirim yok'}
          </h3>
          <p className="text-sm text-gray-300 mt-1">Yeni bildirimler burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(n => {
            const cfg = typeCfg(n.type);
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`relative bg-white border rounded-2xl p-4 flex items-start gap-4 transition-all shadow-sm ${
                  !n.is_read ? 'border-violet-100 shadow-violet-50/50' : 'border-gray-100 opacity-75'
                }`}
              >
                {/* Unread indicator */}
                {!n.is_read && (
                  <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full" />
                )}

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon size={18} className={cfg.text} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[11px] text-gray-300">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className={`text-sm font-extrabold ${n.is_read ? 'text-gray-500' : 'text-gray-800'}`}>{n.title}</p>
                  <p className={`text-sm mt-0.5 leading-relaxed ${n.is_read ? 'text-gray-400' : 'text-gray-500'}`}>{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
