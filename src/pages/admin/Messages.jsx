import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Search, Send, Tags, FileText } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetChat,
  adminGetConversationMeta,
  adminGetConversations,
  adminGetQuickReplies,
  adminSaveConversationMeta,
  adminSaveQuickReply,
  adminSendChat,
} from '../../lib/adminApi';

export default function AdminMessages() {
  const [convs, setConvs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState({ labels: [] });
  const [quickReplies, setQuickReplies] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [replyTitle, setReplyTitle] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [toast, setToast] = useState('');
  const endRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadConversations = () => {
    adminGetConversations({ page: 1 })
      .then((res) => setConvs(res.data || []))
      .catch((e) => showToast(e.message));
  };

  const loadQuickReplies = () => {
    adminGetQuickReplies()
      .then((res) => setQuickReplies(res.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadConversations();
    loadQuickReplies();
  }, []);

  const openConversation = async (conv) => {
    setSelected(conv);
    const [chatRes, metaRes] = await Promise.all([
      adminGetChat(conv.uid1, conv.uid2).catch(() => null),
      adminGetConversationMeta(conv.uid1, conv.uid2).catch(() => null),
    ]);
    if (chatRes) setMessages(chatRes.data.messages || []);
    if (metaRes) {
      setMeta(metaRes.data || { labels: [] });
      setLabelInput((metaRes.data?.labels || []).join(', '));
    }
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const sendMessage = async () => {
    if (!selected || !text.trim()) return;
    try {
      await adminSendChat(selected.uid1, selected.uid2, text.trim());
      setText('');
      openConversation(selected);
    } catch (e) {
      showToast(e.message);
    }
  };

  const saveLabels = async () => {
    if (!selected) return;
    try {
      await adminSaveConversationMeta({
        uid1: selected.uid1,
        uid2: selected.uid2,
        labels: labelInput.split(',').map((item) => item.trim()).filter(Boolean),
      });
      openConversation(selected);
      showToast('Konuşma etiketleri kaydedildi.');
    } catch (e) {
      showToast(e.message);
    }
  };

  const saveQuickReply = async () => {
    if (!replyTitle.trim() || !replyContent.trim()) return;
    try {
      await adminSaveQuickReply({ title: replyTitle, content: replyContent });
      setReplyTitle('');
      setReplyContent('');
      loadQuickReplies();
      showToast('Hazır cevap kaydedildi.');
    } catch (e) {
      showToast(e.message);
    }
  };

  const filtered = convs.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.user1?.toLowerCase().includes(q) || item.user2?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[320px,1fr,340px] gap-4 h-[calc(100vh-10rem)]">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kullanıcı ara..." className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl" />
            </div>
          </div>
          <div className="overflow-y-auto h-full">
            {filtered.map((conv) => (
              <button
                key={`${conv.uid1}-${conv.uid2}`}
                onClick={() => openConversation(conv)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${selected?.uid1 === conv.uid1 && selected?.uid2 === conv.uid2 ? 'bg-violet-50' : ''}`}
              >
                <div className="font-bold text-gray-900">{conv.user1} ↔ {conv.user2}</div>
                <div className="text-xs text-gray-400 truncate mt-1">{conv.last_message || 'Mesaj yok'}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="font-extrabold text-gray-900">{selected ? `${selected.user1} ↔ ${selected.user2}` : 'Konuşma seçin'}</div>
            <div className="text-xs text-gray-500 mt-1">Destek görünümü, hazır cevap ve etiketleme ile birlikte.</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {!selected ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Bir konuşma seçin.</div>
            ) : messages.map((message) => (
              <div key={message.id} className={`flex ${message.is_admin_msg == 1 ? 'justify-center' : String(message.sender_id) === String(selected.uid1) ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${message.is_admin_msg == 1 ? 'bg-amber-50 text-amber-900 border border-amber-200' : String(message.sender_id) === String(selected.uid1) ? 'bg-white border border-gray-100' : 'bg-violet-600 text-white'}`}>
                  {message.message}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {selected && (
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Admin mesajı yaz..." className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              <button onClick={sendMessage} className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center"><Send size={16} /></button>
            </div>
          )}
        </div>

        <div className="space-y-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tags size={16} className="text-violet-600" />
              <div className="font-bold text-gray-900">Konuşma Etiketleri</div>
            </div>
            <input value={labelInput} onChange={(e) => setLabelInput(e.target.value)} placeholder="ödeme, teslimat, riskli" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3" />
            <button onClick={saveLabels} disabled={!selected} className="w-full px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold disabled:opacity-40">Etiketleri Kaydet</button>
            {(meta.labels || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {meta.labels.map((item) => <span key={item} className="text-xs font-bold px-2 py-1 rounded-full bg-violet-50 text-violet-700">{item}</span>)}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-violet-600" />
              <div className="font-bold text-gray-900">Hazır Cevaplar</div>
            </div>
            <div className="space-y-2 mb-4">
              {quickReplies.map((reply) => (
                <button key={reply.id} onClick={() => setText(reply.content)} className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2">
                  <div className="font-semibold text-gray-800 text-sm">{reply.title}</div>
                  <div className="text-xs text-gray-500 truncate mt-1">{reply.content}</div>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="font-semibold text-gray-800 mb-2">Yeni Hazır Cevap</div>
              <input value={replyTitle} onChange={(e) => setReplyTitle(e.target.value)} placeholder="Başlık" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-2" />
              <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={4} placeholder="Hazır cevap içeriği..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none mb-2" />
              <button onClick={saveQuickReply} className="w-full px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold">Hazır Cevabı Kaydet</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

