import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, ChevronLeft, MessageCircle, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getConversations, getMessages, sendMessage } from '../lib/api';

export default function MessagesPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) { navigate('/login'); return null; }

  return userId ? <ChatView userId={userId} currentUser={user} /> : <ConversationList currentUser={user} />;
}

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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
          <MessageCircle size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Mesajlar</h1>
          <p className="text-xs text-gray-400">{conversations.length} konuşma</p>
        </div>
      </div>

      {/* Search */}
      {conversations.length > 3 && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Konuşma ara..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={32} className="text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-700 mb-1">
            {search ? 'Konuşma bulunamadı' : 'Henüz mesajın yok'}
          </h3>
          <p className="text-gray-400 text-sm">Bir satıcının ilanına giderek mesaj gönderebilirsin.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {filtered.map((conv, i) => (
            <Link
              key={conv.user_id}
              to={`/messages/${conv.user_id}`}
              className={`flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors ${i !== 0 ? 'border-t border-gray-50' : ''}`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center text-2xl">
                  {conv.avatar || '👤'}
                </div>
                {conv.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[10px] font-extrabold h-5 w-5 rounded-full flex items-center justify-center">
                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`font-bold text-sm ${conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {conv.username}
                  </span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.last_message_time)}</span>
                </div>
                <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
                  {conv.last_message || '...'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatView({ userId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherName, setOtherName] = useState(`Kullanıcı #${userId}`);
  const [otherAvatar, setOtherAvatar] = useState('👤');
  const [initialized, setInitialized] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const fetchMessages = (isInitial = false) => {
    getMessages(userId).then(r => {
      const msgs = r.data || [];
      setMessages(msgs);
      // Karşı taraf bilgisini bul
      const other = msgs.find(m => String(m.sender_id) !== String(currentUser.id));
      if (other) {
        setOtherName(other.sender_name || otherName);
        setOtherAvatar(other.sender_avatar || '👤');
      }
      if (isInitial) {
        // İlk yüklemede anında scroll (jump yok)
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

  // Yeni mesaj gelince sadece zaten en alttaysa smooth scroll
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
    } catch {
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Tarihe göre mesaj grupları
  const groupedMessages = [];
  let lastDate = null;
  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at).toLocaleDateString('tr-TR');
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'date', label: msgDate });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: 'msg', data: msg });
  });

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 mb-4 shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate('/messages')}
          className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          {otherAvatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-sm">{otherName}</div>
          <div className="text-[11px] text-emerald-500 font-semibold">Çevrimiçi</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1 pb-3 space-y-1">
        {groupedMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
            <MessageCircle size={40} />
            <p className="text-sm font-semibold">Henüz mesaj yok. İlk sen yaz!</p>
          </div>
        )}
        {groupedMessages.map((item, idx) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${idx}`} className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] text-gray-400 font-semibold px-2">{item.label}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            );
          }
          const msg = item.data;
          const isMine = String(msg.sender_id) === String(currentUser.id);
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-1`}>
              {!isMine && (
                <div className="w-7 h-7 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                  {otherAvatar}
                </div>
              )}
              <div className={`max-w-[72%] ${isMine ? '' : ''}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-violet-600 text-white rounded-br-md shadow-sm shadow-violet-200'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                }`}>
                  {msg.message}
                </div>
                <div className={`text-[10px] mt-1 ${isMine ? 'text-right text-gray-400' : 'text-gray-400'} px-1`}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 flex-shrink-0 mt-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Mesajını yaz..."
          className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 shadow-sm"
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-12 h-12 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-colors shadow-sm shadow-violet-200 flex-shrink-0"
        >
          <Send size={18} />
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
