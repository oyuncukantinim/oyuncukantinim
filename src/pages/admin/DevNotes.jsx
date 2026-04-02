import { useState, useEffect } from 'react';
import { Plus, Trash2, Pin, PinOff, Edit3, X, Check, StickyNote } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

const API = 'https://api.oyuncukantinim.com.tr/api.php';
const NOTE_COLORS = [
  { id: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'bg-yellow-100', dot: 'bg-yellow-400' },
  { id: 'blue',   bg: 'bg-blue-50',   border: 'border-blue-200',   title: 'bg-blue-100',   dot: 'bg-blue-400' },
  { id: 'green',  bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'bg-emerald-100', dot: 'bg-emerald-400' },
  { id: 'red',    bg: 'bg-red-50',    border: 'border-red-200',    title: 'bg-red-100',    dot: 'bg-red-400' },
  { id: 'purple', bg: 'bg-violet-50', border: 'border-violet-200', title: 'bg-violet-100', dot: 'bg-violet-400' },
  { id: 'gray',   bg: 'bg-gray-50',   border: 'border-gray-200',   title: 'bg-gray-100',   dot: 'bg-gray-400' },
];
function colorCfg(id) { return NOTE_COLORS.find(c => c.id === id) || NOTE_COLORS[0]; }

function api(action, body) {
  const token = localStorage.getItem('admin_token');
  return fetch(`${API}?action=${action}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then(r => r.json());
}

function NoteModal({ note, onClose, onSave }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState(note?.color || 'yellow');
  const [pinned, setPinned] = useState(note?.is_pinned == 1 || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const res = await api('admin_save_note', { id: note?.id || null, title, content, color, is_pinned: pinned ? 1 : 0 });
    setSaving(false);
    if (res.status === 'success') onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold text-gray-800 text-lg">{note?.id ? 'Notu Düzenle' : 'Yeni Not'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Not başlığı..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 font-semibold"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Not içeriği..."
            rows={6}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 resize-none"
          />

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500">Renk:</span>
            <div className="flex gap-2">
              {NOTE_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.dot} transition-all ${color === c.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div onClick={() => setPinned(p => !p)} className={`w-9 h-5 rounded-full transition-colors ${pinned ? 'bg-violet-500' : 'bg-gray-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${pinned ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-semibold text-gray-600 flex items-center gap-1.5"><Pin size={13} /> Sabitle</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">İptal</button>
            <button onClick={handleSave} disabled={saving || !title.trim()} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold disabled:opacity-50">
              {saving ? 'Kaydediliyor...' : <><Check size={14} className="inline mr-1" /> Kaydet</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDevNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | {} | note
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = () => {
    setLoading(true);
    api('admin_get_notes').then(r => {
      if (r.status === 'success') setNotes(r.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
    await api('admin_delete_note', { id });
    setNotes(prev => prev.filter(n => n.id !== id));
    showToast('Not silindi.');
  };

  const handleTogglePin = async (note) => {
    await api('admin_save_note', { ...note, is_pinned: note.is_pinned == 1 ? 0 : 1 });
    load();
  };

  const pinned = notes.filter(n => n.is_pinned == 1);
  const unpinned = notes.filter(n => n.is_pinned != 1);

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}
      {modal !== null && (
        <NoteModal
          note={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); showToast('Not kaydedildi.'); }}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
              <StickyNote size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">Geliştirme Notları</h1>
              <p className="text-xs text-gray-400">{notes.length} not</p>
            </div>
          </div>
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} /> Yeni Not
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <StickyNote size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg">Henüz not yok</p>
            <p className="text-sm mt-1">Geliştirme sürecinde hatırlatmak istediklerini buraya ekle.</p>
          </div>
        ) : (
          <>
            {/* Sabitlenmişler */}
            {pinned.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pin size={13} className="text-violet-500" />
                  <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Sabitlenmiş</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinned.map(n => <NoteCard key={n.id} note={n} onEdit={() => setModal(n)} onDelete={handleDelete} onPin={handleTogglePin} />)}
                </div>
              </div>
            )}

            {/* Diğerleri */}
            {unpinned.length > 0 && (
              <div>
                {pinned.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Diğer Notlar</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {unpinned.map(n => <NoteCard key={n.id} note={n} onEdit={() => setModal(n)} onDelete={handleDelete} onPin={handleTogglePin} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function NoteCard({ note, onEdit, onDelete, onPin }) {
  const c = colorCfg(note.color);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <div className={`${c.bg} ${c.border} border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col`}>
      {/* Başlık bandı */}
      <div className={`${c.title} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2 min-w-0">
          {note.is_pinned == 1 && <Pin size={12} className="text-gray-500 flex-shrink-0" />}
          <span className="font-extrabold text-gray-800 text-sm truncate">{note.title}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button onClick={() => onPin(note)} title={note.is_pinned == 1 ? 'Sabitlemeyi kaldır' : 'Sabitle'}
            className="p-1 hover:bg-white/60 rounded-lg text-gray-500 transition-colors">
            {note.is_pinned == 1 ? <PinOff size={13} /> : <Pin size={13} />}
          </button>
          <button onClick={onEdit} className="p-1 hover:bg-white/60 rounded-lg text-gray-500 transition-colors">
            <Edit3 size={13} />
          </button>
          <button onClick={() => onDelete(note.id)} className="p-1 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {/* İçerik */}
      <div className="px-4 py-3 flex-1">
        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-6">{note.content || '—'}</p>
      </div>
      <div className="px-4 pb-3">
        <span className="text-[10px] text-gray-400">{fmtDate(note.updated_at)}</span>
      </div>
    </div>
  );
}
