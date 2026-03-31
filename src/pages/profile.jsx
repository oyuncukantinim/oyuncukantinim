import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  List, Package, Settings, LogOut, Plus, ShieldCheck,
  Wallet, Trash2, Edit3, Image as ImageIcon, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMyListings, getOrders, updateProfile, addBalance, deleteListing } from '../lib/api';
import { AVATARS } from '../data/catalog';

export default function ProfilePage() {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('listings');
  const [myListings, setMyListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editUsername, setEditUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setEditUsername(user.username || '');
    setSelectedAvatar(user.avatar || '👤');
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'listings') {
      getMyListings().then(r => setMyListings(r.data || [])).catch(() => {});
    } else if (activeTab === 'orders') {
      getOrders().then(r => setOrders(r.data || [])).catch(() => {});
    }
  }, [activeTab, user]);

  if (!user) return null;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (editUsername !== user.username) payload.new_username = editUsername;
      if (selectedAvatar !== user.avatar) payload.avatar = selectedAvatar;
      if (newPassword) payload.new_password = newPassword;

      if (Object.keys(payload).length === 0) {
        showToast('Degisiklik yok.');
        setSaving(false);
        return;
      }

      const res = await updateProfile(payload);
      updateUser(res.data);
      setNewPassword('');
      showToast('Profil guncellendi!');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBalance = async () => {
    const amt = parseFloat(balanceAmount);
    if (!amt || amt <= 0) { showToast('Gecerli bir tutar girin.'); return; }
    try {
      const res = await addBalance(amt);
      updateUser({ ...user, balance: res.data.new_balance });
      setBalanceAmount('');
      showToast(amt.toFixed(2) + ' TL yuklendi!');
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Bu ilani silmek istediginize emin misiniz?')) return;
    try {
      await deleteListing({ listing_id: listingId });
      setMyListings(prev => prev.filter(l => l.id !== listingId));
      showToast('Ilan silindi.');
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Gorusuruz!');
    navigate('/');
  };

  const tabs = [
    { id: 'listings', label: 'Ilanlarim', icon: List },
    { id: 'orders', label: 'Siparislerim', icon: Package },
    { id: 'balance', label: 'Bakiye', icon: Wallet },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Profile Header */}
      <div className="card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-neon-purple/20 via-neon-cyan/10 to-neon-pink/20 relative">
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
        </div>
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12 mb-4">
            <div className="relative">
              <div className="w-24 h-24 bg-surface-100 border-4 border-white rounded-2xl flex items-center justify-center text-5xl shadow-lg">
                {user.avatar || '👤'}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border-2 border-white">
                Lv.{user.level || 1}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-extrabold text-gray-800">{user.username}</h1>
              <p className="text-gray-500 text-sm flex items-center justify-center sm:justify-start gap-1 mt-1">
                <ShieldCheck size={14} className="text-neon-green" /> Dogrulanmis Uye
              </p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-xs text-gray-500">Bakiye</div>
              <div className="text-2xl font-extrabold text-neon-green">{Number(user.balance || 0).toFixed(2)} ₺</div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="bg-surface-100 rounded-xl p-3 border border-gray-100">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-gray-500">Seviye {user.level || 1}</span>
              <span className="text-neon-purple">{user.xp || 0}% XP</span>
            </div>
            <div className="w-full bg-surface-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-neon-purple to-neon-cyan h-full rounded-full transition-all" style={{ width: `${user.xp || 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-56 flex-shrink-0 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20'
                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-500/10 transition-all mt-4">
            <LogOut size={18} /> Cikis Yap
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 card p-6 sm:p-8 min-h-[400px]">

          {/* ILANLARIM */}
          {activeTab === 'listings' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold">Ilanlarim</h2>
                <Link to="/create" className="btn-primary py-2 px-4 text-sm flex items-center gap-1">
                  <Plus size={16} /> Yeni Ilan
                </Link>
              </div>
              {myListings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">🏪</div>
                  <h3 className="text-lg font-bold text-gray-300 mb-1">Henuz ilan eklemedin</h3>
                  <Link to="/create" className="text-neon-purple font-bold hover:underline">Hemen ekle</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myListings.map(listing => (
                    <div key={listing.id} className="bg-surface-100/50 rounded-xl p-4 flex items-center gap-4 border border-gray-100">
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0">
                        {listing.images?.[0] ? (
                          <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/listing/${listing.id}`} className="font-bold text-gray-800 hover:text-neon-purple truncate block">{listing.title}</Link>
                        <div className="text-xs text-gray-500 mt-1">{listing.game_name} &bull; {listing.category}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-neon-green">{Number(listing.price).toFixed(2)} ₺</div>
                        <div className="flex gap-2 mt-2">
                          <span className={`text-xs font-bold ${listing.status === 'active' ? 'text-neon-green' : 'text-gray-500'}`}>
                            {listing.status === 'active' ? 'Aktif' : listing.status === 'sold' ? 'Satildi' : listing.status}
                          </span>
                          <button onClick={() => handleDeleteListing(listing.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SIPARISLERIM */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-extrabold mb-6">Siparislerim</h2>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📦</div>
                  <h3 className="text-lg font-bold text-gray-300 mb-1">Henuz siparisin yok</h3>
                  <Link to="/store" className="text-neon-purple font-bold hover:underline">Magazayi kesfet</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="bg-surface-100/50 rounded-xl p-4 flex items-center gap-4 border border-gray-100">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {order.item_type === 'epin' ? '💎' : '🎮'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 truncate">{order.item_title || 'Urun'}</div>
                        <div className="text-xs text-gray-500 mt-1">{order.game_name} {order.seller_name ? `• Satici: ${order.seller_name}` : ''}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-neon-green">{Number(order.amount).toFixed(2)} ₺</div>
                        <span className="badge-green text-[10px] mt-1">{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BAKIYE */}
          {activeTab === 'balance' && (
            <div className="max-w-md">
              <h2 className="text-xl font-extrabold mb-6">Bakiye Yukle</h2>
              <div className="bg-surface-100/50 rounded-2xl p-6 border border-gray-100 mb-6">
                <div className="text-sm text-gray-500 mb-1">Mevcut Bakiye</div>
                <div className="text-4xl font-extrabold text-neon-green">{Number(user.balance || 0).toFixed(2)} ₺</div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[50, 100, 250, 500, 1000, 2500].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setBalanceAmount(String(amt))}
                      className={`py-3 rounded-xl font-bold text-sm transition-all ${
                        balanceAmount === String(amt)
                          ? 'bg-neon-purple text-gray-800'
                          : 'bg-surface-100 text-gray-400 hover:bg-white/5 border border-gray-100'
                      }`}
                    >
                      {amt} ₺
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                  placeholder="Ozel tutar (TL)..."
                  className="input-field"
                />
                <button onClick={handleAddBalance} className="btn-primary w-full">
                  <Wallet size={18} className="inline mr-2" /> Bakiye Yukle
                </button>
                <p className="text-xs text-gray-600 text-center">Bu test asamasinda aninda yuklenir. Gercek odeme entegrasyonu sonra eklenecektir.</p>
              </div>
            </div>
          )}

          {/* AYARLAR */}
          {activeTab === 'settings' && (
            <div className="max-w-md space-y-6">
              <h2 className="text-xl font-extrabold mb-6">Hesap Ayarlari</h2>

              {/* Avatar */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map(av => (
                    <button
                      key={av}
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        selectedAvatar === av
                          ? 'bg-neon-purple/20 border-2 border-neon-purple scale-110'
                          : 'bg-surface-100 border border-gray-100 hover:border-white/20'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Kullanici Adi</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">E-posta</label>
                <input type="email" value={user.email} disabled className="input-field opacity-50 cursor-not-allowed" />
                <p className="text-[10px] text-gray-600 mt-1">Guvenlik geregi e-posta degistirilemez.</p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Yeni Sifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Bos birakirsan degismez..."
                  className="input-field"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Degisiklikleri Kaydet'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
