import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, ChevronLeft, MessageCircle, Search, Check, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getConversations, getMessages, sendMessage } from '../lib/api';

export default function MessagesPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) { navigate('/login'); return null; }

  return userId
    ? <ChatView userId={userId} currentUser={user} />
    : <ConversationList currentUser={user} />;
}

/* ── Conversation List ─────────────────────────────────────── */
function ConversationList({ currentUser }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getConversations()
      .then(r => setConversations(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter(c =>
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Mesajlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">{conversations.length} konuşma</p>
        </div>
        <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
          <MessageCircle size={20} className="text-white" />
        </div>
      </div>

      {/* Search */}
      {conversations.length > 2 && (
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Konuşma ara..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-violet-400 shadow-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-14 text-center shadow-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={30} className="text-gray-300" />
          </div>
          <p className="font-bold text-gray-600 mb-1.5">
            {search ? 'Konuşma bulunamadı' : 'Henüz mesajın yok'}
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Bir satıcının ilanına giderek mesaj gönderebilirsin.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(conv => (
            <ConvCard key={conv.user_id} conv={conv} />
          ))}
        </div>
      )}
    </div>
  );
}

const AVATAR_COLORS = [
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
];

function avatarColor(username) {
  return AVATAR_COLORS[(username?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

function ConvCard({ conv }) {
  const initials = conv.username?.[0]?.toUpperCase() || '?';

  return (
    <Link
      to={`/messages/${conv.user_id}`}
      className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-4 py-4 hover:border-violet-200 hover:shadow-md hover:shadow-violet-50 transition-all group"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-[52px] h-[52px] bg-gradient-to-br ${avatarColor(conv.username)} rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-sm`}>
          {initials}
        </div>
        {conv.unread_count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-violet-600 text-white text-[10px] font-extrabold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 shadow-sm">
            {conv.unread_count > 9 ? '9+' : conv.unread_count}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`font-bold text-sm ${conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'} group-hover:text-violet-700 transition-colors`}>
            {conv.username}
          </span>
          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.last_message_time)}</span>
        </div>
        <p className={`text-sm truncate leading-snug ${conv.unread_count > 0 ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
          {conv.last_message || 'Henüz mesaj yok'}
        </p>
      </div>

      {conv.unread_count > 0 && (
        <div className="w-2.5 h-2.5 bg-violet-500 rounded-full flex-shrink-0" />
      )}
    </Link>
  );
}

/* ── Chat View ─────────────────────────────────────────────── */
function ChatView({ userId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherName, setOtherName] = useState(`Kullanıcı #${userId}`);
  const [initialized, setInitialized] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const fetchMessages = (isInitial = false) => {
    getMessages(userId).then(r => {
      const msgs = r.data || [];
      setMessages(msgs);
      const other = msgs.find(m => String(m.sender_id) !== String(currentUser.id));
      if (other) setOtherName(other.sender_name || otherName);
      if (isInitial) {
        setTimeout(() => {
          endRef.current?.scrollIntoView({ behavior: 'instant' });
          setInitialized(true);
        }, 50);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!initialized) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage({ receiver_id: parseInt(userId), message: text.trim() });
      setText('');
      fetchMessages(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { }
    finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Group by date
  const grouped = [];
  let lastDate = null;
  messages.forEach(msg => {
    const d = new Date(msg.created_at).toLocaleDateString('tr-TR');
    if (d !== lastDate) { grouped.push({ type: 'date', label: d }); lastDate = d; }
    grouped.push({ type: 'msg', data: msg });
  });

  const otherInitial = otherName?.[0]?.toUpperCase() || '?';

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 mb-3 shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate('/messages')}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors -ml-1"
        >
          <ChevronLeft size={20} />
        </button>
        <div className={`w-10 h-10 bg-gradient-to-br ${avatarColor(otherName)} rounded-xl flex items-center justify-center text-white font-extrabold text-base flex-shrink-0`}>
          {otherInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-gray-900 text-sm">{otherName}</div>
          <div className="text-[11px] text-emerald-500 font-semibold">Çevrimiçi</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-2 px-1">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
              <MessageCircle size={28} className="text-gray-200" />
            </div>
            <p className="text-sm font-semibold text-gray-400">İlk mesajı sen gönder!</p>
          </div>
        )}

        {grouped.map((item, idx) => {
          if (item.type === 'date') {
            return (
              <div key={`d${idx}`} className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] text-gray-400 font-semibold bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                  {item.label}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            );
          }

          const msg = item.data;
          const isAdmin = msg.is_admin_msg == 1;
          const isMine = !isAdmin && String(msg.sender_id) === String(currentUser.id);

          if (isAdmin) {
            return (
              <div key={msg.id} className="flex justify-center py-1 px-1 mb-1">
                <div className="max-w-[80%] bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Shield size={11} className="text-amber-600" />
                    <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wide">Yönetici Mesajı</span>
                  </div>
                  <p className="text-sm text-amber-900 font-medium">{msg.message}</p>
                  <p className="text-[10px] text-amber-500 mt-1">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-1 mb-1`}>
              {!isMine && (
                <div className={`w-7 h-7 bg-gradient-to-br ${avatarColor(otherName)} rounded-full flex items-center justify-center text-white text-xs font-extrabold mr-2 flex-shrink-0 self-end mb-5`}>
                  {otherInitial}
                </div>
              )}
              <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                  isMine
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-br-sm shadow-sm shadow-violet-200'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.message}
                </div>
                <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                  {isMine && <Check size={10} className="text-gray-400" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2.5 flex-shrink-0 mt-2 bg-white border border-gray-100 rounded-2xl px-3 py-2 shadow-sm"
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Mesajını yaz..."
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none py-1.5 px-1"
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shadow-sm shadow-violet-200 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'şimdi';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'dk';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'sa';
  return d.toLocaleDateString('tr-TR');
}
