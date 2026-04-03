import { useEffect, useMemo, useState } from 'react';
import { AlertOctagon, KeyRound, Save, Shield, Sparkles } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminBootstrap, adminSaveAccessControl } from '../../lib/adminApi';

const ROLE_ORDER = ['founder', 'manager', 'moderator', 'support'];

const PERMISSION_LABELS = {
  'dashboard.view': 'Dashboard görüntüleme',
  'users.view': 'Kullanıcı görüntüleme',
  'users.manage': 'Kullanıcı yönetimi',
  'users.notes': 'Kullanıcı iç notları',
  'users.restrict': 'Kısıtlı mod yönetimi',
  'listings.view': 'İlan görüntüleme',
  'listings.manage': 'İlan düzenleme',
  'listings.bulk': 'Toplu ilan işlemleri',
  'listings.moderate': 'Moderasyon kuyruğu',
  'orders.view': 'Sipariş görüntüleme',
  'orders.manage': 'Sipariş yönetimi',
  'orders.disputes': 'Anlaşmazlık yönetimi',
  'orders.notes': 'Sipariş iç notları',
  'orders.bulk': 'Toplu sipariş işlemleri',
  'finance.view': 'Finans paneli',
  'finance.export': 'Finans dışa aktarma',
  'messages.view': 'Mesaj görüntüleme',
  'messages.manage': 'Mesaj yönetimi',
  'messages.templates': 'Hazır cevaplar',
  'announcements.send': 'Bildirim gönderimi',
  'settings.view': 'Ayar görüntüleme',
  'settings.manage': 'Ayar değiştirme',
  'audit.view': 'Denetim kayıtları',
};

const CRITICAL_ACTION_LABELS = {
  'user.make_admin': 'Kullanıcıyı admin yap',
  'user.update_role': 'Rol değiştir',
  'user.update_balance': 'Bakiye değiştir',
  'listing.delete': 'İlan sil',
  'listing.bulk': 'Toplu ilan işlemi',
  'order.refund': 'Sipariş iadesi',
  'order.cancel': 'Sipariş iptali',
  'order.force_pay_seller': 'Satıcıya manuel ödeme',
  'order.bulk': 'Toplu sipariş işlemi',
  'settings.save': 'Ayar kaydetme',
  'feature_flags.save': 'Özellik bayrağı kaydetme',
};

function Section({ title, icon: Icon, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
          <Icon size={16} />
        </div>
        <div>
          <h3 className="font-extrabold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AccessControl() {
  const founderId = 3;
  const [boot, setBoot] = useState(null);
  const [adminRoles, setAdminRoles] = useState({});
  const [rolePermissions, setRolePermissions] = useState({});
  const [criticalActions, setCriticalActions] = useState({});
  const [featureFlags, setFeatureFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    adminBootstrap()
      .then((res) => {
        setBoot(res.data);
        const nextRoles = {};
        (res.data.admins || []).forEach((item) => {
          nextRoles[item.id] = item.admin_role;
        });
        setAdminRoles(nextRoles);
        setRolePermissions(res.data.role_permissions || {});
        setCriticalActions(res.data.critical_actions || {});
        setFeatureFlags(res.data.feature_flags || {});
      })
      .catch((e) => showToast(e.message))
      .finally(() => setLoading(false));
  }, []);

  const permissionCatalog = useMemo(
    () => Array.from(new Set(Object.values(rolePermissions || {}).flatMap((items) => items || []).filter((item) => item && item !== '*'))).sort(),
    [rolePermissions],
  );

  const togglePermission = (roleKey, permission) => {
    setRolePermissions((prev) => {
      const current = Array.isArray(prev[roleKey]) ? prev[roleKey] : [];
      const next = current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission];
      return { ...prev, [roleKey]: next.sort() };
    });
  };

  const toggleCriticalRole = (actionKey, roleKey) => {
    setCriticalActions((prev) => {
      const current = prev[actionKey] || { allowed_roles: [], require_confirmation: 1 };
      const roles = Array.isArray(current.allowed_roles) ? current.allowed_roles : [];
      const nextRoles = roles.includes(roleKey)
        ? roles.filter((item) => item !== roleKey)
        : [...roles, roleKey];
      return {
        ...prev,
        [actionKey]: { ...current, allowed_roles: nextRoles },
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminSaveAccessControl({
        admin_roles: adminRoles,
        role_permissions: rolePermissions,
        critical_actions: criticalActions,
        feature_flags: featureFlags,
      });
      showToast('Erişim kontrolü kaydedildi.');
    } catch (e) {
      showToast(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl">{toast}</div>}

      <div className="space-y-5">
        <Section title="Yönetici Rolleri" icon={Shield} subtitle="Kurucu, admin hesaplarının rolünü ve panel kapsamını bu sayfadan yönetir.">
          <div className="space-y-3">
            {(boot?.admins || []).map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <div className="font-bold text-gray-900">
                    {item.username}
                    {item.id === founderId && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Site Kurucusu · ID 3</span>}
                  </div>
                  <div className="text-xs text-gray-500">{item.email || 'E-posta yok'}</div>
                </div>
                <select
                  value={item.id === founderId ? 'founder' : (adminRoles[item.id] || item.admin_role)}
                  onChange={(e) => setAdminRoles((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  disabled={item.id === founderId}
                  className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400"
                >
                  {ROLE_ORDER.map((roleKey) => (
                    <option key={roleKey} value={roleKey}>
                      {boot?.roles?.[roleKey]?.label || roleKey}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Rol Yetkileri" icon={KeyRound} subtitle="Her rol için hangi yönetim alanlarının açılacağını belirleyin.">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {ROLE_ORDER.map((roleKey) => (
              <div key={roleKey} className="border border-gray-100 rounded-2xl p-4">
                <h4 className="font-extrabold text-gray-900 mb-3">{boot?.roles?.[roleKey]?.label || roleKey}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {permissionCatalog.map((permission) => {
                    const active = (rolePermissions[roleKey] || []).includes(permission);
                    return (
                      <button
                        key={`${roleKey}-${permission}`}
                        onClick={() => togglePermission(roleKey, permission)}
                        className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${active ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-violet-200'}`}
                      >
                        {PERMISSION_LABELS[permission] || permission}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Kritik İşlem Yetkileri" icon={AlertOctagon} subtitle="Hangi rollerin kritik işlemleri yapabileceğini ve açık onay zorunluluğunu ayarlayın.">
          <div className="space-y-3">
            {Object.entries(criticalActions || {}).map(([actionKey, config]) => (
              <div key={actionKey} className="border border-gray-100 rounded-2xl p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div className="font-bold text-gray-900">{CRITICAL_ACTION_LABELS[actionKey] || actionKey}</div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={Boolean(config?.require_confirmation)}
                      onChange={(e) => setCriticalActions((prev) => ({
                        ...prev,
                        [actionKey]: { ...(prev[actionKey] || {}), require_confirmation: e.target.checked ? 1 : 0 },
                      }))}
                    />
                    Açık onay zorunlu
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROLE_ORDER.map((roleKey) => {
                    const active = (config?.allowed_roles || []).includes(roleKey);
                    return (
                      <button
                        key={`${actionKey}-${roleKey}`}
                        onClick={() => toggleCriticalRole(actionKey, roleKey)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${active ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                      >
                        {boot?.roles?.[roleKey]?.label || roleKey}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Özellik Bayrakları" icon={Sparkles} subtitle="Panel veya site tarafında kontrollü açma-kapama için özellik bayrakları.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.keys(featureFlags || {}).length === 0 && (
              <div className="text-sm text-gray-500">Kayıtlı özellik bayrağı bulunmuyor.</div>
            )}
            {Object.entries(featureFlags || {}).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setFeatureFlags((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={`px-4 py-3 rounded-2xl text-left border transition-colors ${value ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                <div className="font-bold text-sm">{key}</div>
                <div className="text-xs mt-1">{value ? 'Aktif' : 'Pasif'}</div>
              </button>
            ))}
          </div>
        </Section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={16} /> Erişim Kontrolünü Kaydet</>}
        </button>
      </div>
    </AdminLayout>
  );
}

