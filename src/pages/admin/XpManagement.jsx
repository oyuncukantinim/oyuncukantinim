import { useEffect, useState } from 'react';
import { Gamepad2, Save, Sparkles } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetXpSettings, adminSaveXpSettings } from '../../lib/adminApi';

export default function XpManagement() {
  const [settings, setSettings] = useState({ base_level_xp: 100, level_growth_percent: 5, actions: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    adminGetXpSettings()
      .then((response) => setSettings(response.data || { base_level_xp: 100, level_growth_percent: 5, actions: [] }))
      .catch((error) => showToast(error.message))
      .finally(() => setLoading(false));
  }, []);

  const updateAction = (key, patch) => {
    setSettings((prev) => ({
      ...prev,
      actions: (prev.actions || []).map((action) => (action.key === key ? { ...action, ...patch } : action)),
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await adminSaveXpSettings(settings);
      setSettings(response.data || { base_level_xp: 100, level_growth_percent: 5, actions: [] });
      showToast('XP ayarları kaydedildi.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      {toast ? <div className="fixed right-4 top-4 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl">{toast}</div> : null}
      <div className="space-y-5">
        <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-slate-950 via-violet-950 to-cyan-900 p-6 text-white shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">
            <Gamepad2 size={14} /> XP Yönetim Alanı
          </div>
          <h1 className="mt-3 text-2xl font-black">Seviye ve XP Kuralları</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/65">
            Seviye üst sınırı yoktur. Sonraki seviye için gereken XP, önceki seviyeye göre belirlediğin yüzde kadar artar.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" /></div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">Seviye 1 başlangıç XP</span>
                <input
                  type="number"
                  min="1"
                  value={settings.base_level_xp}
                  onChange={(event) => setSettings((prev) => ({ ...prev, base_level_xp: Number(event.target.value || 100) }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-violet-400"
                />
              </label>
              <label className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">Sonraki seviye artış oranı (%)</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={settings.level_growth_percent}
                  onChange={(event) => setSettings((prev) => ({ ...prev, level_growth_percent: Number(event.target.value || 5) }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-violet-400"
                />
              </label>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-black text-slate-900">İşlem XP Değerleri</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Negatif XP girerek kayıp işlemlerini de yönetebilirsin.</p>
                </div>
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-500 disabled:opacity-50">
                  <Save size={15} /> {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </button>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {(settings.actions || []).map((action) => (
                  <div key={action.key} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-black text-slate-900">
                        <Sparkles size={15} className="text-violet-500" /> {action.label}
                      </div>
                      <label className="flex items-center gap-2 text-xs font-black text-slate-500">
                        <input type="checkbox" checked={Number(action.is_active) === 1} onChange={(event) => updateAction(action.key, { is_active: event.target.checked ? 1 : 0 })} />
                        Aktif
                      </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label>
                        <span className="text-[11px] font-black uppercase text-slate-400">XP</span>
                        <input type="number" value={action.xp} onChange={(event) => updateAction(action.key, { xp: Number(event.target.value || 0) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-violet-400" />
                      </label>
                      <label>
                        <span className="text-[11px] font-black uppercase text-slate-400">Günlük Maks XP</span>
                        <input type="number" min="0" value={action.daily_limit} onChange={(event) => updateAction(action.key, { daily_limit: Number(event.target.value || 0) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-violet-400" />
                      </label>
                      <label className="flex items-end gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-500">
                        <input type="checkbox" checked={Number(action.once) === 1} onChange={(event) => updateAction(action.key, { once: event.target.checked ? 1 : 0 })} />
                        Tek sefer
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
