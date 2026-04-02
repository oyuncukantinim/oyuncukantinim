import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight, Send, Shield, Search, ArrowLeft } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetConversations, adminGetChat, adminSendChat } from '../../lib/adminApi';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'şimdi';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'dk önce';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'sa önce';
  return d.toLocaleDateString('tr-TR');
}

function ChatPanel({ conv, onBack }) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const initializedRef = useRef(false);

  const load = useCallback((isInitial = false) => {
    adminGetChat(conv.uid1, conv.uid2)
      .then(r => {
        setMessages(r.data.messages || []);
        setUsers(r.data.users || {});
        if (isInitial) {
          setTimeout(() => {
            endRef.current?.scrollIntoView({ behavior: 'instant' });
            initializedRef.current = true;
          }, 50);
        } else if (initializedRef.current) {
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conv.uid1, conv.uid2]);

  useEffect(() => {
    initializedRef.current = false;
    setLoading(true);
    setMessages([]);
    load(true);
    const interval = setInterval(() => load(false), 4000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await adminSendChat(conv.uid1, conv.uid2, text.trim());
      setText('');
      load(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  messages.forEach(msg => {
    const d = new Date(msg.created_at).toLocaleDateString('tr-TR');
    if (d !== lastDate) { grouped.push({ type: 'date', label: d }); lastDate = d; }
    grouped.push({ type: 'msg', data: msg });
  });

  const u1 = users[conv.uid1] || { username: conv.user1 };
  const u2 = users[conv.uid2] || { username: conv.user2 };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3 flex-shrink-0 bg-white">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 lg:hidden">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 bg-violet-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-violet-700 flex-shrink-0">
              {u1.username?.[0]?.toUpperCase()}
            </div>
            <div className="w-8 h-8 bg-cyan-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-cyan-700 flex-shrink-0">
              {u2.username?.[0]?.toUpperCase()}
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 text-sm truncate">{conv.user1} ↔ {conv.user2}</div>
            <div className="text-[11px] text-gray-400">{messages.length} mesaj</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1 flex-shrink-0">
          <Shield size={12} /> Admin Görünümü
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50/50">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
          </div>
        )}
        {!loading && grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-12">
            <MessageSquare size={36} />
            <p className="text-sm font-semibold">Bu konuşmada mesaj yok.</p>
          </div>
        )}
        {grouped.map((item, idx) => {
          if (item.type === 'date') {
            return (
              <div key={`d${idx}`} className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-semibold px-2 flex-shrink-0">{item.label}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            );
          }
          const msg = item.data;
          const isAdmin = msg.is_admin_msg == 1;
          const isUser1 = String(msg.sender_id) === String(conv.uid1);
          const senderName = isAdmin ? null : (isUser1 ? conv.user1 : conv.user2);

          if (isAdmin) {
            return (
              <div key={msg.id} className="flex justify-center py-1">
                <div className="max-w-[80%] bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Shield size={11} className="text-amber-600" />
                    <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wide">Admin Mesajı</span>
                  </div>
                  <p className="text-sm text-amber-900 font-medium">{msg.message}</p>
                  <p className="text-[10px] text-amber-500 mt-1">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isUser1 ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[72%] ${isUser1 ? 'items-start' : 'items-end'} flex flex-col`}>
                <div className="text-[10px] text-gray-400 font-semibold mb-1 px-1">{senderName}</div>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isUser1
                    ? 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
                    : 'bg-violet-600 text-white shadow-sm shadow-violet-200 rounded-br-md'
                }`}>
                  {msg.message}
                </div>
                <div className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1 flex-shrink-0">
          <Shield size={11} /> Admin
        </div>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Sohbete admin mesajı yaz..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-10 h-10 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

export default function AdminMessages() {
  const [convs, setConvs] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminGetConversations({ page })
      .then(r => setConvs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = convs.filter(c =>
    !search || c.user1?.toLowerCase().includes(search.toLowerCase()) || c.user2?.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d) => d ? new Date(d).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Left: Conversation List */}
        <div className={`w-full lg:w-80 flex-shrink-0 flex flex-col border-r border-gray-100 ${selected ? 'hidden lg:flex' : 'flex'}`}>
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-violet-600" />
              <h3 className="font-extrabold text-gray-800">Konuşmalar</h3>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Kullanıcı ara..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Konuşma bulunamadı.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(c)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                      selected?.uid1 === c.uid1 && selected?.uid2 === c.uid2 ? 'bg-violet-50' : ''
                    }`}
                  >
                    <div className="flex -space-x-2 flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 bg-violet-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-violet-700">
                        {c.user1?.[0]?.toUpperCase()}
                      </div>
                      <div className="w-8 h-8 bg-cyan-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-cyan-700">
                        {c.user2?.[0]?.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-gray-800 text-sm truncate">
                          {c.user1} <span className="text-gray-300 font-normal">↔</span> {c.user2}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 truncate">{c.last_message || '—'}</div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-gray-400">{fmtDate(c.created_at)}</span>
                        <span className="text-[10px] font-bold text-gray-500">{c.message_count} mesaj</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
            <span className="text-xs text-gray-500">Sayfa {page}</span>
            <button onClick={() => setPage(p => p+1)} disabled={convs.length < 20} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Right: Chat */}
        <div className={`flex-1 flex flex-col ${selected ? 'flex' : 'hidden lg:flex'}`}>
          {selected ? (
            <ChatPanel conv={selected} onBack={() => setSelected(null)} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                <MessageSquare size={32} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-500 mb-1">Sohbet Seçin</p>
                <p className="text-sm">Sol listeden bir konuşmaya tıklayın.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
