import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save, Gamepad2 } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

const ADMIN_API = 'https://api.oyuncukantinim.com.tr/api.php';

async function adminReq(action, body = null) {
  const url = new URL(ADMIN_API);
  url.searchParams.set('action', action);
  const opts = {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url.toString(), opts);
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.message);
  return json.data;
}

const COLOR_OPTIONS = [
  { label: 'Kırmızı', value: 'from-red-500 to-rose-600' },
  { label: 'Mavi', value: 'from-blue-500 to-cyan-600' },
  { label: 'Mor', value: 'from-violet-500 to-purple-600' },
  { label: 'Yeşil', value: 'from-emerald-500 to-green-600' },
  { label: 'Turuncu', value: 'from-orange-500 to-red-500' },
  { label: 'Sarı', value: 'from-yellow-400 to-orange-500' },
  { label: 'Pembe', value: 'from-pink-500 to-fuchsia-600' },
  { label: 'Gri', value: 'from-zinc-500 to-zinc-700' },
  { label: 'Camgöbeği', value: 'from-cyan-500 to-blue-600' },
  { label: 'Fuchsia', value: 'from-fuchsia-500 to-purple-600' },
];

export default function AdminPopularGames() {
  const [games, setGames] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    adminReq('get_popular_games')
      .then(d => setGames(d || []))
      .catch(() => {});
  }, []);

  const addGame = () => setGames(g => [...g, { id: Date.now(), name: '', emoji: '🎮', color: 'from-violet-500 to-purple-600' }]);
  const removeGame = (id) => setGames(g => g.filter(x => x.id !== id));
  const updateGame = (id, field, val) => setGames(g => g.map(x => x.id === id ? { ...x, [field]: val } : x));

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminReq('admin_save_popular_games', { games });
      showToast('Kaydedildi!');
    } catch (e) { showToast(e.message); }
    finally { setSaving(false); }
  };

  // Drag & drop reorder
  const handleDrop = (toIdx) => {
    if (dragIdx === null || dragIdx === toIdx) return;
    const reordered = [...games];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setGames(reordered);
  };

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="max-w-3xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 size={18} className="text-violet-600" />
              <h3 className="font-extrabold text-gray-800">Popüler Oyunlar</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={addGame} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                <Plus size={13} /> Oyun Ekle
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
                <Save size={13} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>

          {games.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-400 text-sm">
              Henüz oyun eklenmemiş. "Oyun Ekle" butonuna tıklayın.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {games.map((game, idx) => (
                <div
                  key={game.id}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
                  onDragOver={e => { e.preventDefault(); setDropIdx(idx); }}
                  onDragLeave={() => setDropIdx(null)}
                  onDrop={() => { handleDrop(idx); setDropIdx(null); }}
                  className={`flex items-center gap-3 px-4 py-3 transition-all ${dragIdx === idx ? 'opacity-40' : ''} ${dropIdx === idx && dragIdx !== idx ? 'border-l-4 border-l-violet-400 bg-violet-50' : ''}`}
                >
                  <GripVertical size={16} className="text-gray-300 cursor-grab flex-shrink-0" />

                  {/* Emoji */}
                  <input
                    value={game.emoji}
                    onChange={e => updateGame(game.id, 'emoji', e.target.value)}
                    className="w-12 text-center text-2xl border border-gray-200 rounded-xl py-1 focus:outline-none focus:border-violet-400"
                  />

                  {/* Name */}
                  <input
                    value={game.name}
                    onChange={e => updateGame(game.id, 'name', e.target.value)}
                    placeholder="Oyun adı..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
                  />

                  {/* Color */}
                  <select
                    value={game.color}
                    onChange={e => updateGame(game.id, 'color', e.target.value)}
                    className="border border-gray-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-violet-400 bg-white"
                  >
                    {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>

                  {/* Preview */}
                  <div className={`w-10 h-10 bg-gradient-to-br ${game.color} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                    {game.emoji}
                  </div>

                  <button onClick={() => removeGame(game.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-3 px-1">Ana sayfada görünecek popüler oyunları düzenleyebilirsiniz. Sıralamak için sürükleyip bırakın.</p>
      </div>
    </AdminLayout>
  );
}
