import { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import {
  adminDeleteStoreBadge,
  adminGetStoreManagement,
  adminReorderStoreBadges,
  adminSaveStoreCriteriaSettings,
  adminSaveStoreBadge,
  adminUpdateStoreApplication,
  adminUploadImage,
} from '../../lib/adminApi';

const emptyBadge = {
  title: '',
  description: '',
  image_url: '',
  badge_type: 'sales_rank',
  required_sales: 0,
  member_limit: 1000,
  sort_order: 0,
  is_active: 1,
};

const defaultCriteriaSettings = {
  min_account_age_days: 7,
  min_successful_sales: 5,
  min_avg_rating: 4.5,
  require_email_verified: 1,
  require_profile_complete: 1,
  require_approved_bank: 1,
  require_clean_moderation: 1,
};

const statusMeta = {
  pending: { label: 'Bekliyor', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved: { label: 'Onaylandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  rejected: { label: 'Reddedildi', className: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
};

export default function AdminStoreManagement() {
  const [data, setData] = useState({ badges: [], applications: [], pending_count: 0 });
  const [status, setStatus] = useState('all');
  const [form, setForm] = useState(emptyBadge);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState('');
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState({});
  const [activePanel, setActivePanel] = useState('applications');
  const [criteriaForm, setCriteriaForm] = useState(defaultCriteriaSettings);
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [draggingBadgeId, setDraggingBadgeId] = useState(null);
  const [savingBadgeOrder, setSavingBadgeOrder] = useState(false);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const load = useCallback(() => {
    adminGetStoreManagement({ status })
      .then((response) => {
        const nextData = response.data || { badges: [], applications: [] };
        setData(nextData);
        setCriteriaForm({ ...defaultCriteriaSettings, ...(nextData.criteria_settings || {}) });
      })
      .catch((error) => showToast(error.message));
  }, [status, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const editBadge = (badge) => {
    setForm({
      id: badge.id,
      title: badge.title || '',
      description: badge.description || '',
      image_url: badge.image_url || '',
      badge_type: badge.badge_type || 'sales_rank',
      required_sales: Number(badge.required_sales || 0),
      member_limit: Number(badge.member_limit || 0) || 1000,
      sort_order: Number(badge.sort_order || 0),
      is_active: Number(badge.is_active) === 1 ? 1 : 0,
    });
  };

  const saveBadge = async () => {
    setSaving(true);
    try {
      await adminSaveStoreBadge(form);
      setForm(emptyBadge);
      showToast('Rozet kaydedildi.');
      load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteBadge = async (badgeId) => {
    if (!confirm('Bu rozeti silmek istediğinize emin misiniz?')) return;
    setBusyId(`badge-${badgeId}`);
    try {
      await adminDeleteStoreBadge(badgeId);
      showToast('Rozet silindi.');
      load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const reorderBadges = async (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId || savingBadgeOrder) return;
    const badges = data.badges || [];
    const sourceIndex = badges.findIndex((badge) => Number(badge.id) === Number(sourceId));
    const targetIndex = badges.findIndex((badge) => Number(badge.id) === Number(targetId));
    if (sourceIndex < 0 || targetIndex < 0) return;

    const nextBadges = [...badges];
    const [moved] = nextBadges.splice(sourceIndex, 1);
    nextBadges.splice(targetIndex, 0, moved);
    const normalized = nextBadges.map((badge, index) => ({ ...badge, sort_order: index + 1 }));
    setData((prev) => ({ ...prev, badges: normalized }));
    setSavingBadgeOrder(true);

    try {
      await adminReorderStoreBadges(normalized.map((badge) => badge.id));
      showToast('Rozet sırası kaydedildi.');
    } catch (error) {
      showToast(error.message);
      load();
    } finally {
      setSavingBadgeOrder(false);
      setDraggingBadgeId(null);
    }
  };

  const uploadBadgeImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await adminUploadImage(file, 'store-badges');
      setForm((prev) => ({ ...prev, image_url: url }));
      showToast('Rozet görseli yüklendi.');
    } catch (error) {
      showToast(error.message);
    } finally {
      setUploading(false);
    }
  };

  const updateApplication = async (application, nextStatus) => {
    setBusyId(`app-${application.id}`);
    try {
      await adminUpdateStoreApplication({
        application_id: application.id,
        status: nextStatus,
        admin_note: notes[application.id] || '',
      });
      showToast(nextStatus === 'approved' ? 'Başvuru onaylandı.' : 'Başvuru reddedildi.');
      load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const updateCriteriaField = (field, value) => {
    setCriteriaForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveCriteriaSettings = async () => {
    setSavingCriteria(true);
    try {
      const response = await adminSaveStoreCriteriaSettings(criteriaForm);
      setCriteriaForm({ ...defaultCriteriaSettings, ...(response.data || criteriaForm) });
      showToast('Başvuru kriterleri kaydedildi.');
      load();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSavingCriteria(false);
    }
  };

  return (
    <AdminLayout>
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                <ShieldCheck size={14} /> Onaylı Mağaza
              </div>
              <h1 className="mt-3 text-2xl font-black text-slate-900">Mağaza Yönetimi</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">Onaylı mağaza başvuruları, satış rütbeleri ve özel üye rozetleri.</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">
              {data.pending_count || 0} bekleyen başvuru
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-100 p-1">
          <div className="grid gap-1 sm:grid-cols-3">
            {[
              { id: 'applications', label: 'Başvurular', count: data.pending_count || 0 },
              { id: 'badges', label: 'Rozet Yönetimi', count: data.badges?.length || 0 },
              { id: 'criteria', label: 'Kriter Ayarları', count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={`rounded-xl px-4 py-3 text-sm font-black transition-all ${
                  activePanel === tab.id
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {tab.count !== null ? <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{tab.count}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {activePanel === 'criteria' ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-black text-slate-900">Başvuru Kriter Ayarları</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">Sıfır girilen sayısal kriterler devre dışı kalır. Anahtarlar kapatılırsa ilgili şart kullanıcıdan istenmez.</p>
              </div>
              <button
                onClick={saveCriteriaSettings}
                disabled={savingCriteria}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-500 disabled:opacity-50"
              >
                <Save size={15} /> {savingCriteria ? 'Kaydediliyor...' : 'Kriterleri Kaydet'}
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Minimum Hesap Yaşı</span>
                <input
                  type="number"
                  min="0"
                  value={criteriaForm.min_account_age_days}
                  onChange={(event) => updateCriteriaField('min_account_age_days', Number(event.target.value || 0))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400"
                />
                <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">Gün cinsinden. 0 ise hesap yaşı şartı kapanır.</span>
              </label>
              <label className="block rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Minimum Başarılı Satış</span>
                <input
                  type="number"
                  min="0"
                  value={criteriaForm.min_successful_sales}
                  onChange={(event) => updateCriteriaField('min_successful_sales', Number(event.target.value || 0))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400"
                />
                <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">Tamamlanmış satış sayısı. 0 ise satış şartı kapanır.</span>
              </label>
              <label className="block rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Minimum Ortalama Puan</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={criteriaForm.min_avg_rating}
                  onChange={(event) => updateCriteriaField('min_avg_rating', Number(event.target.value || 0))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400"
                />
                <span className="mt-1.5 block text-[11px] font-semibold text-slate-400">0 ile 5 arası. 0 ise puan şartı kapanır.</span>
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['require_email_verified', 'E-posta doğrulaması zorunlu olsun'],
                ['require_profile_complete', 'Profil bilgileri tamamlanmış olsun'],
                ['require_approved_bank', 'Onaylı banka hesabı zorunlu olsun'],
                ['require_clean_moderation', 'Ban/kısıtlama olmaması zorunlu olsun'],
              ].map(([field, label]) => (
                <label key={field} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm font-bold text-slate-700 shadow-sm">
                  <input
                    type="checkbox"
                    checked={Number(criteriaForm[field]) === 1}
                    onChange={(event) => updateCriteriaField(field, event.target.checked ? 1 : 0)}
                    className="h-4 w-4 accent-violet-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {activePanel === 'applications' ? (
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-black text-slate-900">Onaylı Mağaza Başvuruları</h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">Kimlik ve selfie görselleri sadece admin token ile görüntülenir.</p>
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-violet-400"
            >
              <option value="all">Tüm başvurular</option>
              <option value="pending">Bekleyen</option>
              <option value="approved">Onaylanan</option>
              <option value="rejected">Reddedilen</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-black">Kullanıcı</th>
                  <th className="px-4 py-3 font-black">Durum</th>
                  <th className="px-4 py-3 font-black">Kriter</th>
                  <th className="px-4 py-3 font-black">Görseller</th>
                  <th className="px-4 py-3 font-black">Admin Notu</th>
                  <th className="px-4 py-3 font-black">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.applications?.map((application) => {
                  const meta = statusMeta[application.status] || statusMeta.pending;
                  const StatusIcon = meta.icon;
                  const criteria = application.criteria_snapshot;
                  const busy = busyId === `app-${application.id}`;

                  return (
                    <tr key={application.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="font-black text-slate-900">{application.username}</div>
                        <div className="text-xs font-semibold text-slate-400">#{application.user_id} · {application.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${meta.className}`}>
                          <StatusIcon size={13} /> {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-black text-slate-700">
                          {criteria?.passed_count ?? '-'} / {criteria?.total_count ?? '-'} tamam
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-400">
                          Satış: {criteria?.sales ?? 0} · Puan: {criteria?.avg_rating ?? '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <a href={application.identity_image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-black text-violet-700 hover:bg-violet-100">
                            <Eye size={13} /> Kimlik
                          </a>
                          <a href={application.selfie_image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-black text-cyan-700 hover:bg-cyan-100">
                            <Eye size={13} /> Selfie
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <textarea
                          value={notes[application.id] ?? application.admin_note ?? ''}
                          onChange={(event) => setNotes((prev) => ({ ...prev, [application.id]: event.target.value }))}
                          rows={2}
                          placeholder="Opsiyonel not"
                          className="min-w-[190px] rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-violet-400"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => updateApplication(application, 'approved')}
                            disabled={busy}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500 disabled:opacity-50"
                          >
                            {busy ? <Loader2 size={13} className="animate-spin" /> : 'Onayla'}
                          </button>
                          <button
                            onClick={() => updateApplication(application, 'rejected')}
                            disabled={busy}
                            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white hover:bg-rose-500 disabled:opacity-50"
                          >
                            Reddet
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!data.applications || data.applications.length === 0) ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center text-sm font-semibold text-slate-400">
                      Başvuru bulunmuyor.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
        ) : null}

        {activePanel === 'badges' ? (
        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BadgeCheck size={18} className="text-violet-600" />
              <h2 className="font-black text-slate-900">{form.id ? 'Rozeti Düzenle' : 'Rozet Ekle'}</h2>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">Rozet Türü</span>
                <select
                  value={form.badge_type || 'sales_rank'}
                  onChange={(event) => setForm((prev) => ({ ...prev, badge_type: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-black outline-none focus:border-violet-400"
                >
                  <option value="sales_rank">Satış rütbesi</option>
                  <option value="founding_member">İlk üye rozeti</option>
                </select>
              </label>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Rozet adı"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400"
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Rozet açıklaması"
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400"
              />
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                    {(form.badge_type || 'sales_rank') === 'founding_member' ? 'Üye Limiti' : 'Gerekli Satış Sayısı'}
                  </span>
                  <input
                  type="number"
                  min="0"
                  value={(form.badge_type || 'sales_rank') === 'founding_member' ? form.member_limit : form.required_sales}
                  onChange={(event) => {
                    const value = Number(event.target.value || 0);
                    setForm((prev) => (prev.badge_type || 'sales_rank') === 'founding_member'
                      ? { ...prev, member_limit: value }
                      : { ...prev, required_sales: value });
                  }}
                  placeholder={(form.badge_type || 'sales_rank') === 'founding_member' ? 'Örn: 1000' : 'Gerekli satış'}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-violet-400"
                  />
                  <span className="mt-1 block text-[11px] font-semibold text-slate-400">
                    {(form.badge_type || 'sales_rank') === 'founding_member'
                      ? 'Kullanıcı ID değeri bu limit içinde olan üyelerde otomatik açılır.'
                      : 'Bu satış sayısına ulaşan kullanıcıda rozet açılır.'}
                  </span>
                </label>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                    {form.image_url ? <img src={form.image_url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="text-slate-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      value={form.image_url}
                      onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
                      placeholder="Görsel URL"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-violet-400"
                    />
                  </div>
                </div>
                <input
                  id="store-badge-image"
                  type="file"
                  accept="image/*,.webp"
                  className="hidden"
                  onChange={(event) => {
                    uploadBadgeImage(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
                <label htmlFor="store-badge-image" className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Görsel Yükle
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={Number(form.is_active) === 1}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked ? 1 : 0 }))}
                />
                Aktif rozet
              </label>
              <div className="flex gap-2">
                <button onClick={saveBadge} disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-500 disabled:opacity-50">
                  <Save size={15} /> Kaydet
                </button>
                <button onClick={() => setForm(emptyBadge)} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-200">
                  <Plus size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black text-slate-900">Rozetler</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">Sıralamayı değiştirmek için rozet kartlarını sürükleyip bırakın.</p>
              </div>
              {savingBadgeOrder ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">
                  <Loader2 size={13} className="animate-spin" /> Sıra kaydediliyor
                </span>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {data.badges?.map((badge) => (
                <div
                  key={badge.id}
                  draggable
                  onDragStart={(event) => {
                    setDraggingBadgeId(badge.id);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', String(badge.id));
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId = Number(draggingBadgeId || event.dataTransfer.getData('text/plain'));
                    reorderBadges(sourceId, badge.id);
                  }}
                  onDragEnd={() => setDraggingBadgeId(null)}
                  className={`rounded-2xl border bg-slate-50/70 p-4 transition ${
                    Number(draggingBadgeId) === Number(badge.id)
                      ? 'border-violet-300 opacity-60 ring-2 ring-violet-100'
                      : 'border-slate-100 hover:border-violet-200 hover:bg-white'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex h-14 w-7 shrink-0 cursor-grab items-center justify-center rounded-2xl bg-white text-slate-300 active:cursor-grabbing">
                      <GripVertical size={17} />
                    </div>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                      {badge.image_url ? <img src={badge.image_url} alt="" className="h-full w-full object-cover" /> : badge.badge_type === 'founding_member' ? <Users className="text-emerald-400" /> : <BadgeCheck className="text-violet-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-slate-900">{badge.title}</div>
                      <div className={`text-xs font-black ${badge.badge_type === 'founding_member' ? 'text-emerald-600' : 'text-violet-600'}`}>
                        {badge.badge_type === 'founding_member' ? `İlk ${badge.member_limit || 1000} üye` : `${badge.required_sales} satış`}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{badge.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => editBadge(badge)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-100">
                      Düzenle
                    </button>
                    <button onClick={() => deleteBadge(badge.id)} disabled={busyId === `badge-${badge.id}`} className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-100 disabled:opacity-50">
                      <Trash2 size={13} /> Sil
                    </button>
                  </div>
                </div>
              ))}
              {(!data.badges || data.badges.length === 0) ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400">
                  Henüz rozet eklenmemiş. Örn: 500 satış rozeti veya ilk 1000 üye rozeti ekleyebilirsiniz.
                </div>
              ) : null}
            </div>
          </div>
        </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
