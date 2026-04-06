import { useState } from 'react';
import { Megaphone, Send, Users, User, ShoppingBag, Store } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminBroadcast } from '../../lib/adminApi';

const SEGMENTS = [
  { value: 'all', label: 'Tüm Kullanıcılar', icon: Users, desc: 'Tüm kayıtlı kullanıcılara gönder' },
  { value: 'buyers', label: 'Alıcılar', icon: ShoppingBag, desc: 'En az 1 satın alma yapanlar' },
  { value: 'sellers', label: 'Satıcılar', icon: Store, desc: 'En az 1 ilanı olanlar' },
  { value: 'new_users', label: 'Yeni Üyeler', icon: User, desc: 'Son 30 günde katılanlar' },
];

export default function AdminAnnouncements() {
  const [target, setTarget] = useState('all'); // 'all' | 'user'
  const [segment, setSegment] = useState('all');
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const handleSend = async () => {
    if (!title || !message) { setResult('Başlık ve mesaj zorunlu.'); return; }
    if (target === 'user' && !username.trim()) { setResult('Kullanıcı adı girin.'); return; }
    setSending(true); setResult('');
    try {
      const body = { title, message };
      if (target === 'user') {
        body.username = username.trim();
      } else {
        body.segment = segment;
      }
      const res = await adminBroadcast(body);
      setResult(res.message);
      setTitle(''); setMessage(''); setUsername('');
    } catch (e) { setResult(e.message); }
    finally { setSending(false); }
  };

  const selectedSegment = SEGMENTS.find((s) => s.value === segment);

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Megaphone size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900">Duyuru Gönder</h2>
              <p className="text-sm text-gray-500">Kullanıcı segmentlerine veya belirli bir kişiye bildirim gönder</p>
            </div>
          </div>

          {/* Hedef türü */}
          <div className="flex gap-3 mb-5">
            {[
              { value: 'all', label: 'Segment', icon: Users },
              { value: 'user', label: 'Belirli Kullanıcı', icon: User },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setTarget(opt.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all ${target === opt.value ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'}`}
              >
                <opt.icon size={16} /> {opt.label}
              </button>
            ))}
          </div>

          {/* Segment seçimi */}
          {target === 'all' && (
            <div className="mb-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">Hedef Kitle</label>
              <div className="grid grid-cols-2 gap-2">
                {SEGMENTS.map((seg) => (
                  <button
                    key={seg.value}
                    type="button"
                    onClick={() => setSegment(seg.value)}
                    className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      segment === seg.value
                        ? 'border-violet-400 bg-violet-50 text-violet-800'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-violet-200'
                    }`}
                  >
                    <seg.icon size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-bold leading-tight">{seg.label}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{seg.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Kullanıcı Adı (belirli kullanıcıysa) */}
          {target === 'user' && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Örn: ahmet123"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Başlık *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Önemli Duyuru"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Mesaj *</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="Kullanıcılara iletmek istediğiniz duyuruyu buraya yazın..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 resize-none"
            />
            <div className="text-right text-xs text-gray-400 mt-1">{message.length} karakter</div>
          </div>

          {result && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold ${result.includes('hata') || result.includes('gerekli') || result.includes('Hata') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
              {result}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >
            {sending
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Send size={16} /> {target === 'user' ? 'Gönder' : `${selectedSegment?.label ?? 'Tümü'}ne Gönder`}</>
            }
          </button>

          {target === 'all' && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Seçili segmente dahil aktif kullanıcılara bildirim olarak iletilecektir.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
