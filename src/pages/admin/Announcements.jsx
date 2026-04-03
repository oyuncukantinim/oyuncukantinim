import { useState } from 'react';
import { Megaphone, Send, Users, UserRound, ShieldAlert } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminSendSegmentedBroadcast } from '../../lib/adminApi';

const SEGMENTS = [
  { value: 'all', label: 'Tüm Kullanıcılar', icon: Users },
  { value: 'sellers', label: 'Satıcılar', icon: UserRound },
  { value: 'buyers', label: 'Alıcılar', icon: Users },
  { value: 'restricted', label: 'Kısıtlı Hesaplar', icon: ShieldAlert },
];

export default function AdminAnnouncements() {
  const [segment, setSegment] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [minBalance, setMinBalance] = useState('');
  const [activeDays, setActiveDays] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const handleSend = async () => {
    if (!title || !message) {
      setResult('Başlık ve mesaj zorunlu.');
      return;
    }
    setSending(true);
    setResult('');
    try {
      const res = await adminSendSegmentedBroadcast({
        segment,
        title,
        message,
        min_balance: minBalance || undefined,
        active_days: activeDays || undefined,
      });
      setResult(res.message);
      setTitle('');
      setMessage('');
    } catch (e) {
      setResult(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Megaphone size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900">Segmentli Bildirim Merkezi</h2>
              <p className="text-sm text-gray-500">Duyuruları kullanıcı kitlesine, bakiyeye veya son aktiviteye göre filtreleyin.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
            {SEGMENTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSegment(opt.value)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all ${segment === opt.value ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'}`}
              >
                <opt.icon size={16} /> {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Min. Bakiye</label>
              <input
                value={minBalance}
                onChange={(e) => setMinBalance(e.target.value)}
                placeholder="Örn: 100"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Son Aktivite (gün)</label>
              <input
                value={activeDays}
                onChange={(e) => setActiveDays(e.target.value)}
                placeholder="Örn: 7"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Başlık</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Önemli Duyuru"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Mesaj</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Hedef kitlenize göndermek istediğiniz duyuru..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 resize-none"
            />
          </div>

          {result && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold ${result.toLowerCase().includes('hata') || result.toLowerCase().includes('zorunlu') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
              {result}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >
            {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send size={16} /> Bildirimi Gönder</>}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

