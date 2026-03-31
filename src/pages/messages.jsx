import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, ChevronLeft, MessageCircle } from 'lucide-react';
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

  useEffect(() => {
    getConversations()
      .then(r => setConversations(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
        <MessageCircle className="text-neon-cyan" size={24} /> Mesajlar
      </h1>

      {conversations.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-lg font-bold text-gray-300 mb-1">Henuz mesajin yok</h3>
          <p className="text-gray-500 text-sm">Bir saticinın ilanina giderek mesaj gonderebilirsin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => (
            <Link
              key={conv.user_id}
              to={`/messages/${conv.user_id}`}
              className="card p-4 flex items-center gap-4 block hover:bg-white/5"
            >
              <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {conv.avatar || '👤'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">{conv.username}</span>
                  <span className="text-xs text-gray-600">{formatTime(conv.last_message_time)}</span>
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">{conv.last_message}</p>
              </div>
              {conv.unread_count > 0 && (
                <span className="bg-neon-pink text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                  {conv.unread_count}
                </span>
              )}
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
  const endRef = useRef(null);
  const navigate = useNavigate();

  const fetchMessages = () => {
    getMessages(userId).then(r => setMessages(r.data || [])).catch(() => {});
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage({ receiver_id: parseInt(userId), message: text.trim() });
      setText('');
      fetchMessages();
    } catch {
    } finally {
      setSending(false);
    }
  };

  const otherUser = messages.find(m => m.sender_id !== currentUser.id);

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="card p-4 flex items-center gap-3 mb-4 flex-shrink-0">
        <button onClick={() => navigate('/messages')} className="text-gray-400 hover:text-neon-purple transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center text-xl">
          {otherUser?.sender_avatar || '👤'}
        </div>
        <span className="font-bold text-gray-800">{otherUser?.sender_name || `Kullanici #${userId}`}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-2 pb-4">
        {messages.map(msg => {
          const isMine = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed ${
                isMine
                  ? 'bg-neon-purple text-white rounded-br-md'
                  : 'bg-surface-100 text-gray-700 border border-gray-100 rounded-bl-md'
              }`}>
                {msg.message}
                <div className={`text-[10px] mt-1 ${isMine ? 'text-purple-200' : 'text-gray-600'}`}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="card p-3 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Mesajini yaz..."
          className="input-field flex-1"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="btn-primary py-3 px-4 disabled:opacity-50"
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
  if (diff < 60000) return 'simdi';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'dk';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'sa';
  return d.toLocaleDateString('tr-TR');
}
