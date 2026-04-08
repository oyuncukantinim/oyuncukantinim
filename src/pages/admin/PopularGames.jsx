import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Save, Gamepad2, Image as ImageIcon, Upload, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetPopularGames, adminSavePopularGames, adminUploadImage } from '../../lib/adminApi';

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
  const [uploadingId, setUploadingId] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    adminGetPopularGames()
      .then((response) => setGames(Array.isArray(response.data) ? response.data : []))
      .catch(() => {});
  }, []);

  const addGame = () => setGames((g) => [
    ...g,
    { id: Date.now(), name: '', image_url: '', category_slug: '', color: 'from-violet-500 to-purple-600' },
  ]);

  const removeGame = (id) => setGames((g) => g.filter((x) => x.id !== id));
  const updateGame = (id, field, val) => setGames((g) => g.map((x) => (x.id === id ? { ...x, [field]: val } : x)));

  const clearImage = (id) => updateGame(id, 'image_url', '');

  const handleImageUpload = async (id, file) => {
    if (!file) return;
    setUploadingId(id);
    try {
      const url = await adminUploadImage(file, 'branding', { preserveOriginal: true });
      updateGame(id, 'image_url', url);
      showToast('Görsel yüklendi.');
    } catch (error) {
      showToast(error.message || 'Görsel yüklenemedi.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminSavePopularGames(games);
      showToast('Kaydedildi!');
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (toIdx) => {
    if (dragIdx === null || dragIdx === toIdx) return;
    const reordered = [...games];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setGames(reordered);
  };

  return (
    <AdminLayout>
      {toast ? (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Gamepad2 size={18} className="text-violet-600" />
              <h3 className="font-extrabold text-gray-800">Popüler Oyunlar</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addGame}
                className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-200"
              >
                <Plus size={13} /> Oyun Ekle
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
              >
                <Save size={13} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>

          {games.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              Henüz oyun eklenmemiş. &quot;Oyun Ekle&quot; butonuna tıklayın.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {games.map((game, idx) => {
                const fileInputId = `popular-game-image-${game.id}`;
                const isUploading = uploadingId === game.id;

                return (
                  <div
                    key={game.id}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragEnd={() => {
                      setDragIdx(null);
                      setDropIdx(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropIdx(idx);
                    }}
                    onDragLeave={() => setDropIdx(null)}
                    onDrop={() => {
                      handleDrop(idx);
                      setDropIdx(null);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 transition-all ${dragIdx === idx ? 'opacity-40' : ''} ${dropIdx === idx && dragIdx !== idx ? 'border-l-4 border-l-violet-400 bg-violet-50' : ''}`}
                  >
                    <GripVertical size={16} className="shrink-0 cursor-grab text-gray-300" />

                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${game.color}`}>
                      {game.image_url ? (
                        <img src={game.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={18} className="text-white/70" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <input
                        value={game.name}
                        onChange={(e) => updateGame(game.id, 'name', e.target.value)}
                        placeholder="Oyun adı..."
                        className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm focus:border-violet-400 focus:outline-none"
                      />

                      <div className="flex gap-1.5">
                        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-2 py-1.5">
                          <input
                            id={fileInputId}
                            type="file"
                            accept="image/*,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleImageUpload(game.id, file);
                              e.target.value = '';
                            }}
                          />
                          <label
                            htmlFor={fileInputId}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 transition-colors hover:bg-violet-100"
                          >
                            <Upload size={12} />
                            {game.image_url ? 'Değiştir' : 'Görsel Yükle'}
                          </label>
                          {game.image_url ? (
                            <button
                              type="button"
                              onClick={() => clearImage(game.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-100"
                            >
                              <X size={11} />
                              Kaldır
                            </button>
                          ) : null}
                          <span className="truncate text-[11px] text-gray-400">
                            {isUploading ? 'Yükleniyor...' : game.image_url ? 'Görsel hazır' : 'WebP önerilir'}
                          </span>
                        </div>

                        <input
                          value={game.category_slug || ''}
                          onChange={(e) => updateGame(game.id, 'category_slug', e.target.value)}
                          placeholder="slug-id (ör: fortnite-12)"
                          className="w-36 rounded-xl border border-gray-200 px-3 py-1.5 text-xs focus:border-violet-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <select
                      value={game.color}
                      onChange={(e) => updateGame(game.id, 'color', e.target.value)}
                      className="shrink-0 rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs focus:border-violet-400 focus:outline-none"
                    >
                      {COLOR_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => removeGame(game.id)}
                      className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="mt-3 px-1 text-xs text-gray-400">
          Ana sayfada görünecek popüler oyunları düzenleyebilirsiniz. Sıralamak için sürükleyip bırakın. Görselleri doğrudan yükleyin; düşük boyut için mümkünse WebP kullanın. Kategori slug formatı: <strong>slug-id</strong> (ör: fortnite-12).
        </p>
      </div>
    </AdminLayout>
  );
}
