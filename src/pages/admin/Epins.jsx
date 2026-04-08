import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminDeleteEpin, adminGetEpins, adminSaveEpin } from '../../lib/adminApi';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const EMPTY = { title: '', price: '', old_price: '', description: '', icon: '💎', badge: '' };

export default function AdminEpins() {
  const [epins, setEpins] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = () => adminGetEpins().then((response) => setEpins(response.data || [])).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY);
    setModal(true);
  };

  const openEdit = (epin) => {
    setEditId(epin.id);
    setForm({
      title: epin.title,
      price: epin.price,
      old_price: epin.old_price || '',
      description: epin.description || '',
      icon: epin.icon || '💎',
      badge: epin.badge || '',
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.price) {
      showToast('Başlık ve fiyat zorunlu.');
      return;
    }

    setSaving(true);
    try {
      await adminSaveEpin({ ...form, id: editId || null });
      showToast(editId ? 'E-Pin güncellendi.' : 'E-Pin eklendi.');
      setModal(false);
      load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('E-Pin silinsin mi?')) return;
    try {
      await adminDeleteEpin(id);
      showToast('Silindi.');
      load();
    } catch (error) {
      showToast(error.message);
    }
  };

  const fmtMoney = (value) => `${Number(value || 0).toFixed(2)} ₺`;
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <AdminLayout>
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-end">
          <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-violet-500">
            <Plus size={16} /> Yeni E-Pin
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {epins.length === 0 && <div className="col-span-full py-12 text-center text-gray-400">Henüz E-Pin yok.</div>}
          {epins.map((epin) => (
            <div key={epin.id} className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <span className="text-3xl">{epin.icon}</span>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(epin)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(epin.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mb-2 text-sm font-bold text-gray-800">{epin.title}</div>
              {epin.badge && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">{epin.badge}</span>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-extrabold text-emerald-600">{fmtMoney(epin.price)}</span>
                {epin.old_price && <span className="text-xs text-gray-400 line-through">{fmtMoney(epin.old_price)}</span>}
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
                <label className="mb-1.5 block text-xs font-bold text-gray-600">İkon</label>
                <input
                  value={form.icon}
                  onChange={(event) => setField('icon', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-center text-2xl focus:border-violet-400 focus:outline-none"
                />
              </div>
              <div className="col-span-3">
                <label className="mb-1.5 block text-xs font-bold text-gray-600">Başlık *</label>
                <input
                  value={form.title}
                  onChange={(event) => setField('title', event.target.value)}
                  placeholder="Örn: 1000 VP"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-600">Fiyat (₺) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(event) => setField('price', event.target.value)}
                  placeholder="149.90"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-600">Eski Fiyat (₺)</label>
                <input
                  type="number"
                  value={form.old_price}
                  onChange={(event) => setField('old_price', event.target.value)}
                  placeholder="199.90"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-600">Rozet (opsiyonel)</label>
              <input
                value={form.badge}
                onChange={(event) => setField('badge', event.target.value)}
                placeholder="İndirim, Yeni, Popüler..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-600">Açıklama</label>
              <textarea
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-2 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : editId ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
