import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Send, MessageCircle, Search, Check, CheckCheck, Shield, ArrowLeft, ShoppingBag, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { getConversations, getMessages, getSharedOrders, getSiteSettings, sendMessage } from '../lib/api';
import UserAvatar from '../components/UserAvatar';
import { IdentityVerifiedIcon } from '../components/StoreBadges';
import { isIdentityVerified } from '../lib/identityVerification';

const AVATAR_COLORS = [
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
];
function avatarColor(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

function fallbackUsername(userId) {
  return `Kullanıcı #${userId}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Date.now() - d;
  if (diff < 60000) return 'şimdi';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'dk';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'sa';
  return d.toLocaleDateString('tr-TR');
}

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function isUserOnline(lastSeen) {
  if (!lastSeen) return false;
  const seenAt = new Date(lastSeen).getTime();
  if (Number.isNaN(seenAt)) return false;
  return Date.now() - seenAt <= ONLINE_WINDOW_MS;
}

function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'Son görülme bilgisi yok';

  const seenAt = new Date(lastSeen);
  if (Number.isNaN(seenAt.getTime())) return 'Son görülme bilgisi yok';

  const diff = Date.now() - seenAt.getTime();
  if (diff < 60000) return 'Az önce';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} sa önce`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    seenAt.getDate() === yesterday.getDate() &&
    seenAt.getMonth() === yesterday.getMonth() &&
    seenAt.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Dün ${seenAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return seenAt.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessagesPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routedUserId = location.state?.activeUserId || userId || null;

  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(routedUserId ? String(routedUserId) : null);
  const [messageSettings, setMessageSettings] = useState({
    maxLength: 2000,
    sharedOrdersEnabled: true,
  });
  // On mobile: if a user is selected, show chat; else show list.
  const [mobileShowChat, setMobileShowChat] = useState(Boolean(routedUserId));

  const loadConversations = useCallback(() => {
    return getConversations()
      .then(r => setConversations(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setLoadingConvs(true);
    loadConversations()
      .finally(() => setLoadingConvs(false));
    const interval = setInterval(loadConversations, 15000);
    return () => clearInterval(interval);
  }, [user, navigate, loadConversations]);

  useEffect(() => {
    getSiteSettings()
      .then((response) => {
        const data = response.data || {};
        const sharedOrdersEnabledValue = data.conversation_order_panel_enabled;
        setMessageSettings({
          maxLength: Number(data.message_max_length || 2000),
          sharedOrdersEnabled: !(sharedOrdersEnabledValue === 0 || sharedOrdersEnabledValue === '0' || sharedOrdersEnabledValue === false),
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!routedUserId) {
      setSelectedUserId(null);
      setMobileShowChat(false);
      return;
    }
    setSelectedUserId(String(routedUserId));
    setMobileShowChat(true);
    if (userId) {
      navigate('/messages', { replace: true, state: { activeUserId: String(routedUserId) } });
    }
  }, [routedUserId, userId, navigate]);

  if (!user) return null;

  const filtered = conversations.filter(c =>
    !search || c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const activeUserId = selectedUserId ? String(selectedUserId) : null;
  const activeConversation = conversations.find(conv => String(conv.user_id) === activeUserId) || null;

  const handleSelectConv = (conv) => {
    setSelectedUserId(String(conv.user_id));
    navigate('/messages', { state: { activeUserId: String(conv.user_id) } });
    setMobileShowChat(true);
  };

  return (
    <div className="mx-auto max-w-[1800px]">
      <div className="flex bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 9rem)' }}>

        {/* ── LEFT: Conversation List ── */}
        <div className={`w-full lg:w-80 flex-shrink-0 flex flex-col border-r border-gray-100 ${mobileShowChat ? 'hidden lg:flex' : 'flex'}`}>
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <MessageCircle size={15} className="text-white" />
                </div>
                <span className="font-extrabold text-gray-800">Mesajlar</span>
              </div>
              <span className="text-xs text-gray-400">{conversations.length} konuşma</span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ara..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loadingConvs ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm px-4">
                {search ? 'Konuşma bulunamadı.' : 'Henüz mesajın yok.\nBir satıcıya mesaj gönder.'}
              </div>
            ) : filtered.map(conv => {
              const initial = conv.username?.[0]?.toUpperCase() || '?';
              const isActive = activeUserId === String(conv.user_id);
              return (
                <button
                  key={conv.user_id}
                  onClick={() => handleSelectConv(conv)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${isActive ? 'bg-violet-50' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <UserAvatar value={conv.avatar || initial} className={`w-11 h-11 bg-gradient-to-br ${avatarColor(conv.username)} rounded-xl flex items-center justify-center text-white font-extrabold text-base`} />
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[9px] font-extrabold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-bold text-sm inline-flex items-center gap-1 ${isActive ? 'text-violet-700' : 'text-gray-800'}`}>
                        {conv.username}
                        {isIdentityVerified(conv) ? <IdentityVerifiedIcon compact /> : null}
                        {Number(conv.is_verified_store) === 1 ? <BadgeCheck size={13} className="fill-emerald-500 text-white" aria-label="Onaylı Satıcı" /> : null}
                      </span>
                      <span className="text-[11px] text-gray-400 flex-shrink-0 ml-1">{formatTime(conv.last_message_time)}</span>
                    </div>
                    <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
                      {conv.last_message || 'Henüz mesaj yok'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Chat ── */}
        <div className={`flex-1 flex min-w-0 ${mobileShowChat ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex-1 flex flex-col min-w-0">
            {activeUserId
              ? <ChatPanel userId={activeUserId} currentUser={user} activeConversation={activeConversation} messageMaxLength={messageSettings.maxLength} onBack={() => { setSelectedUserId(null); navigate('/messages', { replace: true }); setMobileShowChat(false); }} />
              : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                    <MessageCircle size={30} className="text-gray-200" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-500 mb-1">Sohbet Seçin</p>
                    <p className="text-sm">Sol listeden bir konuşmaya tıklayın.</p>
                  </div>
                </div>
              )
            }
          </div>
          {activeUserId && messageSettings.sharedOrdersEnabled ? <SharedOrdersPanel userId={activeUserId} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ── Shared Orders Panel ─────────────────────────────────────── */
const ORDER_STATUS = ['Bekliyor', 'Teslim Edildi', 'Tamamlandı', 'Anlaşmazlık', 'İptal'];
const ORDER_STATUS_COLORS = ['text-gray-500', 'text-blue-500', 'text-emerald-600', 'text-red-500', 'text-gray-400'];

function SharedOrdersPanel({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    setLoading(true);
    setOrders([]);
    getSharedOrders(userId)
      .then(r => setOrders(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (!loading && orders.length === 0) return null;

  return (
    <div className="hidden xl:flex flex-col w-48 flex-shrink-0 border-l border-gray-100 bg-gray-50/30">
      <div className="px-3 py-3 border-b border-gray-100 flex items-center gap-2">
        <ShoppingBag size={14} className="text-violet-500" />
        <span className="text-xs font-extrabold text-gray-700">Ortak Siparişler</span>
        {!loading && <span className="ml-auto text-[10px] text-gray-400 font-semibold">{orders.length}</span>}
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : orders.map(o => {
          const isBuyer = String(o.buyer_id) === String(currentUser?.id);
          return (
            <div key={o.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              {o.item_image && (
                <img src={o.item_image} alt="" className="w-full h-16 object-cover"/>
              )}
              <div className="p-1.5">
                <div className="mb-1 text-[10px] font-bold text-gray-700 line-clamp-2">{o.item_title || '—'}</div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-extrabold text-emerald-600">{Number(o.amount).toFixed(2)} ₺</span>
                  <span className={`text-[8px] font-bold ${ORDER_STATUS_COLORS[o.delivery_status] || 'text-gray-400'}`}>
                    {ORDER_STATUS[o.delivery_status] || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-gray-400">{o.id}</span>
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${isBuyer ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    {isBuyer ? 'Alıcı' : 'Satıcı'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Chat Panel ──────────────────────────────────────────────── */
function ChatPanel({ userId, currentUser, activeConversation, onBack, messageMaxLength }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [otherName, setOtherName] = useState(activeConversation?.username || fallbackUsername(userId));
  const [otherLastSeen, setOtherLastSeen] = useState(activeConversation?.last_seen || null);
  const [otherIdentityVerified, setOtherIdentityVerified] = useState(isIdentityVerified(activeConversation));
  const [initialized, setInitialized] = useState(false);
  const inputRef = useRef(null);
  const messageListRef = useRef(null);

  const scrollMessagesToBottom = (behavior = 'auto') => {
    const container = messageListRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  const fetchMessages = useCallback((isInitial = false) => {
    getMessages(userId).then(r => {
      const responseData = r.data || {};
      const msgs = Array.isArray(responseData) ? responseData : (responseData.messages || []);
      const otherUser = Array.isArray(responseData) ? null : responseData.other_user;
      setMessages(msgs);
      const other = msgs.find(m => String(m.sender_id) !== String(currentUser.id));
      setOtherName(otherUser?.username || other?.sender_name || activeConversation?.username || fallbackUsername(userId));
      setOtherLastSeen(otherUser?.last_seen || activeConversation?.last_seen || null);
      setOtherIdentityVerified(isIdentityVerified(otherUser) || isIdentityVerified(activeConversation));
      if (isInitial) {
        setTimeout(() => {
          scrollMessagesToBottom('auto');
          setInitialized(true);
        }, 50);
      }
    }).catch(() => {});
  }, [userId, currentUser.id, activeConversation]);

  useEffect(() => {
    setOtherName(activeConversation?.username || fallbackUsername(userId));
    setOtherLastSeen(activeConversation?.last_seen || null);
    setOtherIdentityVerified(isIdentityVerified(activeConversation));
  }, [activeConversation, userId]);

  useEffect(() => {
    setInitialized(false);
    setMessages([]);
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (!initialized) return;
    scrollMessagesToBottom('smooth');
  }, [initialized, messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    if (text.trim().length > messageMaxLength) {
      setSendError(`Mesaj en fazla ${messageMaxLength} karakter olabilir.`);
      return;
    }
    setSending(true);
    setSendError('');
    try {
      await sendMessage({ receiver_id: parseInt(userId), message: text.trim() });
      setText('');
      fetchMessages(false);
      setTimeout(() => scrollMessagesToBottom('smooth'), 100);
    } catch (error) {
      setSendError(error?.message || 'Mesaj gönderilemedi.');
    }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  // Group by date
  const grouped = [];
  let lastDate = null;
  messages.forEach(msg => {
    const d = new Date(msg.created_at).toLocaleDateString('tr-TR');
    if (d !== lastDate) { grouped.push({ type: 'date', label: d }); lastDate = d; }
    grouped.push({ type: 'msg', data: msg });
  });

  const displayName = otherName || activeConversation?.username || fallbackUsername(userId);
  const canOpenProfile = displayName && !displayName.startsWith('Kullanıcı #');
  const otherInitial = displayName?.[0]?.toUpperCase() || '?';
  const otherIsOnline = isUserOnline(otherLastSeen);
  const presenceLabel = otherIsOnline ? 'Çevrimiçi' : `Son görülme: ${formatLastSeen(otherLastSeen)}`;
  const presenceTone = otherIsOnline ? 'text-emerald-500' : 'text-gray-400';
  const remainingCharacters = Math.max(messageMaxLength - text.length, 0);
  const counterTone =
    text.length >= messageMaxLength
      ? 'text-rose-600'
      : text.length >= Math.max(Math.floor(messageMaxLength * 0.85), messageMaxLength - 50)
        ? 'text-amber-600'
        : 'text-gray-400';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3 flex-shrink-0 bg-white">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 lg:hidden">
          <ArrowLeft size={18} />
        </button>
        <UserAvatar value={activeConversation?.avatar || otherInitial} className={`w-9 h-9 bg-gradient-to-br ${avatarColor(displayName)} rounded-xl flex items-center justify-center text-white font-extrabold text-base flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          {canOpenProfile ? (
            <Link
              to={`/p/${displayName}`}
              className="inline-flex items-center gap-1 truncate font-extrabold text-gray-900 text-sm transition-colors hover:text-violet-600"
              title={`${displayName} profiline git`}
            >
              <span className="truncate">{displayName}</span>
              {otherIdentityVerified ? <IdentityVerifiedIcon compact /> : null}
              {Number(activeConversation?.is_verified_store) === 1 ? <BadgeCheck size={14} className="shrink-0 fill-emerald-500 text-white" aria-label="Onaylı Satıcı" /> : null}
            </Link>
          ) : (
            <div className="font-extrabold text-gray-900 text-sm truncate">{displayName}</div>
          )}
          <div className={`text-[11px] font-semibold ${presenceTone}`}>{presenceLabel}</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messageListRef} className="flex-1 overflow-y-auto p-4 bg-gray-50/40">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm">
              <MessageCircle size={24} className="text-gray-200" />
            </div>
            <p className="text-sm font-semibold text-gray-400">İlk mesajı sen gönder!</p>
          </div>
        )}
        {grouped.map((item, idx) => {
          if (item.type === 'date') {
            return (
              <div key={`d${idx}`} className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-semibold bg-white px-3 py-1 rounded-full border border-gray-100">
                  {item.label}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            );
          }
          const msg = item.data;
          const isAdmin = msg.is_admin_msg == 1;
          const isMine = !isAdmin && String(msg.sender_id) === String(currentUser.id);

          if (isAdmin) {
            return (
              <div key={msg.id} className="flex justify-center py-1 mb-1">
                <div className="max-w-[80%] min-w-0 overflow-hidden bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Shield size={11} className="text-amber-600" />
                    <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wide">Yönetici Mesajı</span>
                  </div>
                  <p className="text-sm font-medium text-amber-900 whitespace-pre-wrap break-all [overflow-wrap:anywhere]">{msg.message}</p>
                  <p className="text-[10px] text-amber-500 mt-1">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1.5`}>
              {!isMine && (
                <UserAvatar value={activeConversation?.avatar || otherInitial} className={`w-7 h-7 bg-gradient-to-br ${avatarColor(displayName)} rounded-full flex items-center justify-center text-white text-xs font-extrabold mr-2 flex-shrink-0 self-end mb-5`} />
              )}
              <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className={`min-w-0 max-w-full px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] ${
                  isMine
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-br-sm shadow-sm shadow-violet-200'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.message}
                </div>
                <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                  {isMine && (
                    msg.is_read == 1
                      ? <CheckCheck size={11} className="text-sky-500" />
                      : <Check size={10} className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2.5 px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0"
      >
        <div className="flex-1 min-w-0">
          {sendError ? <div className="mb-2 text-xs font-semibold text-rose-600">{sendError}</div> : null}
          <div className="flex items-center gap-2.5">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => { setText(e.target.value); if (sendError) setSendError(''); }}
          placeholder="Mesajını yaz..."
          maxLength={messageMaxLength}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400"
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
        >
          <Send size={16} />
        </button>
          </div>
          <div className={`mt-1 flex items-center justify-between text-[11px] font-semibold ${counterTone}`}>
            <span className="text-gray-400">Karakter limiti</span>
            <span>{text.length}/{messageMaxLength} · Kalan {remainingCharacters}</span>
          </div>
        </div>
      </form>
    </div>
  );
}
