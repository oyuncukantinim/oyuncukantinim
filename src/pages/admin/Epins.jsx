import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetEpins, adminSaveEpin, adminDeleteEpin } from '../../lib/adminApi';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const EMPTY = { title:'', game_name:'', price:'', old_price:'', description:'', icon:'💎', badge:'' };

export default function AdminEpins() {
  const [epins, setEpins] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => adminGetEpins().then(r => setEpins(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(null); setForm(EMPTY); setModal(true); };
  const openEdit = (e) => { setEditId(e.id); setForm({ title: e.title, game_name: e.game_name, price: e.price, old_price: e.old_price || '', description: e.description || '', icon: e.icon || '💎', badge: e.badge || '' }); setModal(true); };

  const handleSave = async () => {
    if (!form.title || !form.game_name || !form.price) { showToast('Başlık, oyun ve fiyat zorunlu.'); return; }
    setSaving(true);
    try {
      await adminSaveEpin({ ...form, id: editId || null });
      showToast(editId ? 'E-Pin güncellendi.' : 'E-Pin eklendi.');
      setModal(false); load();
    } catch (e) { showToast(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('E-Pini sil?')) return;
    try { await adminDeleteEpin(id); showToast('Silindi.'); load(); }
    catch (e) { showToast(e.message); }
  };

  const fmtMoney = (n) => Number(n || 0).toFixed(2) + ' ₺';
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={openNew} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
            <Plus size={16} /> Yeni E-Pin
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {epins.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">Henüz E-Pin yok.</div>}
          {epins.map(ep => (
            <div key={ep.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{ep.icon}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(ep)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(ep.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="font-bold text-gray-800 text-sm mb-0.5">{ep.title}</div>
              <div className="text-xs text-gray-500 mb-2">{ep.game_name}</div>
              {ep.badge && <span className="text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">{ep.badge}</span>}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-extrabold text-emerald-600">{fmtMoney(ep.price)}</span>
                {ep.old_price && <span className="text-xs text-gray-400 line-through">{fmtMoney(ep.old_price)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <Modal title={editId ? 'E-Pin Düzenle' : 'Yeni E-Pin'} onClose={() => setModal(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">İkon</label>
                <input value={form.icon} onChange={e => set('icon', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-center text-2xl focus:outline-none focus:border-violet-400" />
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Başlık *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Örn: 1000 Valorant VP" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Oyun *</label>
              <input value={form.game_name} onChange={e => set('game_name', e.target.value)} placeholder="Valorant" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Fiyat (₺) *</label>
                <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="149.90" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Eski Fiyat (₺)</label>
                <input type="number" value={form.old_price} onChange={e => set('old_price', e.target.value)} placeholder="199.90" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Rozet (opsiyonel)</label>
              <input value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="İndirim, Yeni, Popüler..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Açıklama</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none" />
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 mt-2">
              {saving ? 'Kaydediliyor...' : (editId ? 'Güncelle' : 'Ekle')}
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

