import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, markNotificationsRead } from '../lib/api';

const TYPE_ICONS = {
  sale: '💰',
  purchase: '🛒',
  message: '💬',
  balance: '💳',
  info: 'ℹ️',
};

const TYPE_COLORS = {
  sale: 'border-neon-green/20',
  purchase: 'border-neon-purple/20',
  message: 'border-neon-cyan/20',
  balance: 'border-yellow-500/20',
  info: 'border-gray-100',
};

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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Bell className="text-neon-pink" size={24} /> Bildirimler
        </h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkRead} className="btn-secondary py-2 px-4 text-sm flex items-center gap-1">
            <Check size={14} /> Tumunu Oku
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <h3 className="text-lg font-bold text-gray-300">Henuz bildirim yok</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`card p-4 flex items-start gap-4 ${
                !n.is_read ? 'bg-surface-100 ' + (TYPE_COLORS[n.type] || '') : 'opacity-60'
              }`}
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {TYPE_ICONS[n.type] || 'ℹ️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-sm">{n.title}</span>
                  {!n.is_read && <span className="w-2 h-2 bg-neon-pink rounded-full flex-shrink-0" />}
                </div>
                <p className="text-sm text-gray-400 mt-1">{n.message}</p>
                <span className="text-xs text-gray-600 mt-2 block">{formatDate(n.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
