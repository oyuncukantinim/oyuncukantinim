import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  List, Package, Settings, LogOut, Plus, ShieldCheck,
  Wallet, Trash2, Edit3, Image as ImageIcon, Star,
  Truck, CheckCircle, AlertTriangle, Clock, User,
  Eye, EyeOff, Store, X, Check, ChevronDown, ChevronUp,
  MapPin, History, ToggleLeft, ToggleRight, LayoutGrid, LayoutList
} from 'lucide-react';
import { isValidImageUrl, ALLOWED_DOMAINS_LABEL } from '../lib/imageUrl';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMyListings, updateProfile, addBalance, deleteListing, listingSlug } from '../lib/api';
import { AVATARS } from '../data/catalog';

const API = 'https://api.oyuncukantinim.com.tr/api.php';

async function apiAuth(action, body = null, token) {
  const url = `${API}?action=${action}`;
  const opts = {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.message || 'Hata');
  return json.data;
}

const DELIVERY_STATUS = {
  0: { label: 'Teslimat Bekleniyor', color: 'bg-orange-100 text-orange-700', icon: Clock },
  1: { label: 'Teslim Edildi', color: 'bg-blue-100 text-blue-700', icon: Truck },
  2: { label: 'Tamamlandı', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  3: { label: 'Anlaşmazlık', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

function DeliveryBadge({ status }) {
  const s = DELIVERY_STATUS[status] || DELIVERY_STATUS[0];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${s.color}`}>
      <Icon size={11} /> {s.label}
    </span>
  );
}

function OrderLogsModal({ orderId, token, onClose }) {
  const [logs, setLogs] = useState([]);
  const [disputeReason, setDisputeReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://api.oyuncukantinim.com.tr/api.php?action=get_order_logs&order_id=${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(j => {
        if (j.status === 'success') {
          setLogs(j.data.logs || []);
          setDisputeReason(j.data.dispute_reason || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId, token]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History size={16} className="text-violet-600" />
            <h3 className="font-extrabold text-gray-800">Sipariş #{orderId} Geçmişi</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100"><X size={16} /></button>
        </div>

        {disputeReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <div className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1"><AlertTriangle size={11} /> Anlaşmazlık Nedeni</div>
            <p className="text-sm text-red-800">{disputeReason}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">Henüz işlem geçmişi yok.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-violet-400 rounded-full mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">{log.action}</p>
                  <p className="text-xs text-gray-400">{log.admin_name} · {new Date(log.created_at).toLocaleString('tr-TR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, isSellerView, token, onRefresh, showToast }) {
  const [expanded, setExpanded] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const act = async (action, body) => {
    setLoading(true);
    try {
      await apiAuth(action, body, token);
      showToast('İşlem başarılı!');
      onRefresh();
    } catch (e) { showToast(e.message); }
    finally { setLoading(false); }
  };

  const isManual = order.item_type === 'listing' && !order.delivery_content;
  const status = (order.delivery_status ?? 0);

  return (
    <>
    {showLogs && <OrderLogsModal orderId={order.id} token={token} onClose={() => setShowLogs(false)} />}
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border border-gray-100">
          {order.item_type === 'epin' ? '💎' : '🎮'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 truncate text-sm">{order.item_title || 'Ürün'}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {isSellerView ? `Alıcı: ${order.buyer_username || '—'}` : (order.seller_name ? `Satıcı: ${order.seller_name}` : '')}
            {order.game_name ? ` • ${order.game_name}` : ''}
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <DeliveryBadge status={status} />
            {order.item_type === 'epin' && <span className="text-[10px] bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-lg">E-Pin</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
          <div className="font-extrabold text-emerald-600">{Number(order.amount).toFixed(2)} ₺</div>
          <button onClick={() => setShowLogs(true)} className="text-[11px] text-violet-500 hover:text-violet-700 flex items-center gap-1 font-semibold">
            <History size={11}/> Geçmiş
          </button>
          <button onClick={() => setExpanded(e => !e)} className="text-xs text-gray-400 hover:text-violet-600 flex items-center gap-1">
            Detay {expanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 p-4 space-y-3 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-gray-400">Sipariş #</span><div className="font-bold text-gray-700">{order.id}</div></div>
            <div><span className="text-gray-400">Tarih</span><div className="font-bold text-gray-700">{new Date(order.created_at).toLocaleDateString('tr-TR')}</div></div>
            <div><span className="text-gray-400">Ödenen</span><div className="font-bold text-gray-700">{Number(order.amount).toFixed(2)} ₺</div></div>
            </div>

          {/* Teslimat içeriği */}
          {order.delivery_content && (
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1">📦 Teslimat İçeriği</div>
              <div className="bg-white border border-emerald-200 rounded-xl p-3 text-sm font-mono text-gray-800 whitespace-pre-wrap break-all">{order.delivery_content}</div>
            </div>
          )}

          {/* Aksiyon butonları */}
          {!isSellerView && order.item_type === 'listing' && (
            <div className="flex flex-wrap gap-2">
              {status === 1 && (
                <>
                  <button onClick={() => act('confirm_delivery', { order_id: order.id })} disabled={loading}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                    <Check size={13}/> Teslimatı Onayla
                  </button>
                  <button onClick={() => setDisputeOpen(true)} disabled={loading}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-xl border border-red-200 transition-colors">
                    <AlertTriangle size={13}/> Anlaşmazlık Bildir
                  </button>
                </>
              )}
              {status === 0 && (
                <button onClick={() => setDisputeOpen(true)} disabled={loading}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-xl border border-red-200 transition-colors">
                  <AlertTriangle size={13}/> Sorun Bildir
                </button>
              )}
              {status === 0 && (
                <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Clock size={11}/> Satıcı teslimat bildirince burada görünecek
                </div>
              )}
            </div>
          )}

          {isSellerView && order.item_type === 'listing' && status === 0 && (
            <button onClick={() => act('mark_delivered', { order_id: order.id })} disabled={loading}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
              <Truck size={13}/> Teslim Ettim
            </button>
          )}

          {status === 2 && !order.seller_paid && (
            <div className="text-xs text-orange-500 bg-orange-50 p-2 rounded-lg">⏳ Ödeme bekleniyor (onay sürecinde)</div>
          )}

          {/* Anlaşmazlık formu */}
          {disputeOpen && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-red-700">Anlaşmazlık Nedeni</div>
              <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
                placeholder="Yaşadığınız sorunu açıklayın..." rows={3}
                className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none" />
              <div className="flex gap-2">
                <button onClick={() => act('dispute_order', { order_id: order.id, reason: disputeReason })} disabled={!disputeReason.trim() || loading}
                  className="bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50">Gönder</button>
                <button onClick={() => setDisputeOpen(false)} className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-2 rounded-xl">İptal</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('listings');
  const [myListings, setMyListings] = useState([]);
  const [listingFilter, setListingFilter] = useState('active');
  const [listingsView, setListingsView] = useState(() => localStorage.getItem('listingsView') || 'list');
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [editUsername, setEditUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(null); // listing being edited
  const [personalInfo, setPersonalInfo] = useState({ full_name: '', country: '', city: '', district: '', address: '' });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setEditUsername(user.username || '');
    setSelectedAvatar(user.avatar || '👤');
    setPersonalInfo({
      full_name: user.full_name || '',
      country:   user.country   || '',
      city:      user.city      || '',
      district:  user.district  || '',
      address:   user.address   || '',
    });
  }, [user, navigate]);

  const loadListings = useCallback(() => {
    getMyListings().then(r => setMyListings(r.data || [])).catch(() => {});
  }, []);

  const loadOrders = useCallback(() => {
    apiAuth('get_my_orders', null, token).then(setOrders).catch(() => {});
  }, [token]);

  const loadSales = useCallback(() => {
    apiAuth('get_my_sales', null, token).then(setSales).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'listings') loadListings();
    else if (activeTab === 'orders') loadOrders();
    else if (activeTab === 'sales') loadSales();
  }, [activeTab, user, loadListings, loadOrders, loadSales]);

  if (!user) return null;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (editUsername !== user.username) payload.new_username = editUsername;
      if (selectedAvatar !== user.avatar) payload.avatar = selectedAvatar;
      if (newPassword) payload.new_password = newPassword;
      if (Object.keys(payload).length === 0) { showToast('Değişiklik yok.'); setSaving(false); return; }
      const res = await updateProfile(payload);
      updateUser(res.data);
      setNewPassword('');
      showToast('Profil güncellendi!');
    } catch (err) { showToast(err.message); }
    finally { setSaving(false); }
  };

  const handleAddBalance = async () => {
    const amt = parseFloat(balanceAmount);
    if (!amt || amt <= 0) { showToast('Geçerli bir tutar girin.'); return; }
    try {
      const res = await addBalance(amt);
      updateUser({ ...user, balance: res.data.new_balance });
      setBalanceAmount('');
      showToast(amt.toFixed(2) + ' ₺ yüklendi!');
    } catch (err) { showToast(err.message); }
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteListing({ listing_id: listingId });
      setMyListings(prev => prev.filter(l => l.id !== listingId));
      showToast('İlan silindi.');
    } catch (err) { showToast(err.message); }
  };

  const handleUpdateListing = async (data) => {
    setSaving(true);
    try {
      await apiAuth('update_listing', data, token);
      showToast('İlan güncellendi!');
      setEditModal(null);
      loadListings();
    } catch (e) { showToast(e.message); }
    finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); showToast('Görüşürüz!'); navigate('/'); };

  const handleSavePersonalInfo = async () => {
    setSaving(true);
    try {
      const res = await updateProfile(personalInfo);
      updateUser(res.data);
      showToast('Kişisel bilgiler güncellendi!');
    } catch (err) { showToast(err.message); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: 'listings',  label: 'İlanlarım',        icon: List },
    { id: 'orders',    label: 'Siparişlerim',      icon: Package },
    { id: 'sales',     label: 'Satışlarım',        icon: Store },
    { id: 'balance',   label: 'Bakiye',            icon: Wallet },
    { id: 'profile',   label: 'Profil',            icon: User },
    { id: 'personal',  label: 'Kişisel Bilgiler',  icon: MapPin },
  ];

  const filteredListings = myListings.filter(l => {
    if (listingFilter === 'active') return l.status === 'active';
    if (listingFilter === 'passive') return l.status !== 'active' && l.status !== 'expired';
    if (listingFilter === 'expired') return l.status === 'expired';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-violet-500/20 via-cyan-500/10 to-pink-500/20 relative">
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
        </div>
        <div className="px-6 sm:px-8 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-50 border-4 border-white rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                {user.avatar || '👤'}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full border-2 border-white">
                Lv.{user.level || 1}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-extrabold text-gray-800">{user.username}</h1>
              <p className="text-gray-400 text-xs flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                <ShieldCheck size={12} className="text-emerald-500" /> Doğrulanmış Üye
              </p>
            </div>
            <Link to={`/p/${user.username}`} className="btn-secondary py-1.5 px-4 text-xs flex items-center gap-1.5">
              🏪 Mağazamı Gör
            </Link>
          </div>
          {/* XP Bar */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-gray-500">Seviye {user.level || 1}</span>
              <span className="text-violet-600">{user.xp || 0} XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-cyan-500 h-full rounded-full transition-all" style={{ width: `${Math.min(user.xp || 0, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row gap-5">
        <div className="w-full md:w-52 flex-shrink-0 space-y-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id ? 'bg-violet-600/10 text-violet-700 border border-violet-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm text-red-400 hover:bg-red-50 transition-all mt-3">
            <LogOut size={16} /> Çıkış Yap
          </button>
        </div>

        <div className="flex-1 card p-5 sm:p-6 min-h-[400px]">

          {/* İLANLARIM */}
          {activeTab === 'listings' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-extrabold text-gray-800">İlanlarım</h2>
                <div className="flex items-center gap-2">
                  <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => { setListingsView('list'); localStorage.setItem('listingsView', 'list'); }}
                      className={`p-1.5 transition-colors ${listingsView === 'list' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                      title="Liste görünümü"
                    >
                      <LayoutList size={14} />
                    </button>
                    <button
                      onClick={() => { setListingsView('grid'); localStorage.setItem('listingsView', 'grid'); }}
                      className={`p-1.5 transition-colors ${listingsView === 'grid' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                      title="Grid görünümü"
                    >
                      <LayoutGrid size={14} />
                    </button>
                  </div>
                  <Link to="/create" className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
                    <Plus size={15}/> Yeni İlan
                  </Link>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                {[
                  { key: 'active',  label: 'Aktif' },
                  { key: 'passive', label: 'Pasif' },
                  { key: 'expired', label: 'Süresi Dolmuş' },
                  { key: 'all',     label: 'Tümü' },
                ].map(f => (
                  <button key={f.key} onClick={() => setListingFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${listingFilter === f.key ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              {filteredListings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🏪</div>
                  <p className="text-gray-400 font-semibold">Bu durumda ilan yok.</p>
                  <Link to="/create" className="text-violet-600 font-bold hover:underline text-sm mt-1 inline-block">Hemen ilan ekle</Link>
                </div>
              ) : listingsView === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredListings.map(listing => (
                    <div key={listing.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex flex-col">
                      <div className="aspect-video bg-white">
                        {listing.images?.[0]
                          ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={24}/></div>
                        }
                      </div>
                      <div className="p-2.5 flex flex-col gap-1 flex-1">
                        <Link to={listingSlug(listing.title, listing.id)} className="font-bold text-gray-800 hover:text-violet-600 text-xs leading-tight line-clamp-2">{listing.title}</Link>
                        <div className="font-bold text-emerald-600 text-sm">{Number(listing.price).toFixed(2)} ₺</div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md self-start ${listing.status === 'active' ? 'bg-emerald-100 text-emerald-700' : listing.status === 'expired' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                          {listing.status === 'active' ? 'Aktif' : listing.status === 'expired' ? 'Süresi Doldu' : listing.status === 'sold' ? 'Satıldı' : listing.status}
                        </span>
                        <div className="flex gap-1 mt-auto pt-1">
                          {listing.status !== 'expired' && listing.status !== 'sold' && (
                            <button onClick={() => handleUpdateListing({ listing_id: listing.id, status: listing.status === 'active' ? 'passive' : 'active' })}
                              className={`p-1 rounded-lg transition-colors flex-shrink-0 ${listing.status === 'active' ? 'hover:bg-orange-50 text-emerald-500 hover:text-orange-500' : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-500'}`}>
                              {listing.status === 'active' ? <ToggleRight size={13}/> : <ToggleLeft size={13}/>}
                            </button>
                          )}
                          <button onClick={() => setEditModal(listing)} className="p-1 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-500"><Edit3 size={12}/></button>
                          <button onClick={() => handleDeleteListing(listing.id)} className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={12}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredListings.map(listing => (
                    <div key={listing.id} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 border border-gray-100">
                      <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                        {listing.images?.[0] ? (
                          <img src={listing.images[0]} alt="" className="w-full h-full object-cover"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={18}/></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={listingSlug(listing.title, listing.id)} className="font-bold text-gray-800 hover:text-violet-600 truncate block text-sm">{listing.title}</Link>
                        <div className="text-xs text-gray-400 mt-0.5">{listing.category}</div>
                        {listing.expires_at && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            Bitiş: {new Date(listing.expires_at).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 space-y-1">
                        <div className="font-bold text-emerald-600 text-sm">{Number(listing.price).toFixed(2)} ₺</div>
                        <div className="flex gap-1.5 justify-end">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${listing.status === 'active' ? 'bg-emerald-100 text-emerald-700' : listing.status === 'expired' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                            {listing.status === 'active' ? 'Aktif' : listing.status === 'expired' ? 'Süresi Doldu' : listing.status === 'sold' ? 'Satıldı' : listing.status}
                          </span>
                        </div>
                        <div className="flex gap-1 justify-end">
                          {listing.status !== 'expired' && listing.status !== 'sold' && (
                            <button
                              onClick={() => handleUpdateListing({ listing_id: listing.id, status: listing.status === 'active' ? 'passive' : 'active' })}
                              title={listing.status === 'active' ? 'Pasif yap' : 'Aktif et'}
                              className={`p-1.5 rounded-lg transition-colors ${listing.status === 'active' ? 'hover:bg-orange-50 text-emerald-500 hover:text-orange-500' : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-500'}`}>
                              {listing.status === 'active' ? <ToggleRight size={15}/> : <ToggleLeft size={15}/>}
                            </button>
                          )}
                          <button onClick={() => setEditModal(listing)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-500">
                            <Edit3 size={13}/>
                          </button>
                          <button onClick={() => handleDeleteListing(listing.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SİPARİŞLERİM */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-lg font-extrabold text-gray-800 mb-5">Siparişlerim</h2>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-gray-400 font-semibold">Henüz siparişin yok.</p>
                  <Link to="/market" className="text-violet-600 font-bold hover:underline text-sm mt-1 inline-block">Pazara göz at</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => (
                    <OrderCard key={order.id} order={order} isSellerView={false} token={token} onRefresh={loadOrders} showToast={showToast} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SATIŞLARIM */}
          {activeTab === 'sales' && (
            <div>
              <h2 className="text-lg font-extrabold text-gray-800 mb-5">Satışlarım</h2>
              {sales.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🏪</div>
                  <p className="text-gray-400 font-semibold">Henüz satışın yok.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sales.map(order => (
                    <OrderCard key={order.id} order={order} isSellerView={true} token={token} onRefresh={loadSales} showToast={showToast} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BAKİYE */}
          {activeTab === 'balance' && (
            <div className="max-w-md">
              <h2 className="text-lg font-extrabold text-gray-800 mb-5">Bakiye</h2>
              <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl p-6 border border-emerald-100 mb-5">
                <div className="text-sm text-gray-500 mb-1">Mevcut Bakiye</div>
                <div className="text-4xl font-extrabold text-emerald-600">{Number(user.balance || 0).toFixed(2)} ₺</div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 250, 500, 1000, 2500].map(amt => (
                    <button key={amt} onClick={() => setBalanceAmount(String(amt))}
                      className={`py-3 rounded-xl font-bold text-sm transition-all border ${balanceAmount === String(amt) ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'}`}>
                      {amt} ₺
                    </button>
                  ))}
                </div>
                <input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)}
                  placeholder="Özel tutar (₺)..." className="input-field" />
                <button onClick={handleAddBalance} className="btn-primary w-full">
                  <Wallet size={16} className="inline mr-2" /> Bakiye Yükle
                </button>
                <p className="text-xs text-gray-400 text-center">Test aşamasında anlık yüklenir. Gerçek ödeme entegrasyonu yakında.</p>
              </div>
            </div>
          )}

          {/* PROFİL BİLGİLERİM */}
          {activeTab === 'profile' && (
            <div className="max-w-md space-y-5">
              <h2 className="text-lg font-extrabold text-gray-800">Profil Bilgilerim</h2>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map(av => (
                    <button key={av} onClick={() => setSelectedAvatar(av)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${selectedAvatar === av ? 'bg-violet-100 border-2 border-violet-500 scale-110' : 'bg-gray-50 border border-gray-200 hover:border-violet-300'}`}>
                      {av}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Kullanıcı Adı</label>
                <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">E-posta</label>
                <input type="email" value={user.email} disabled className="input-field opacity-50 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Güvenlik gereği e-posta değiştirilemez.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Yeni Şifre</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Değiştirmek istemiyorsan boş bırak" className="input-field" />
              </div>
              <button onClick={handleSaveProfile} disabled={saving}
                className="btn-primary w-full disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          )}

          {/* KİŞİSEL BİLGİLER */}
          {activeTab === 'personal' && (
            <div className="max-w-md space-y-5">
              <h2 className="text-lg font-extrabold text-gray-800">Kişisel Bilgiler</h2>
              <p className="text-xs text-gray-400">Bu bilgiler sadece siz ve site yöneticisi tarafından görülür.</p>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Ad Soyad</label>
                <input type="text" value={personalInfo.full_name} onChange={e => setPersonalInfo(f => ({...f, full_name: e.target.value}))} placeholder="Adınız Soyadınız" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1.5">Ülke</label>
                  <input type="text" value={personalInfo.country} onChange={e => setPersonalInfo(f => ({...f, country: e.target.value}))} placeholder="Türkiye" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1.5">Şehir</label>
                  <input type="text" value={personalInfo.city} onChange={e => setPersonalInfo(f => ({...f, city: e.target.value}))} placeholder="İstanbul" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">İlçe</label>
                <input type="text" value={personalInfo.district} onChange={e => setPersonalInfo(f => ({...f, district: e.target.value}))} placeholder="Kadıköy" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1.5">Adres</label>
                <textarea value={personalInfo.address} onChange={e => setPersonalInfo(f => ({...f, address: e.target.value}))} rows={3} placeholder="Açık adresiniz..." className="input-field resize-none" />
              </div>
              <button onClick={handleSavePersonalInfo} disabled={saving} className="btn-primary w-full disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kişisel Bilgileri Kaydet'}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Listing Edit Modal */}
      {editModal && (
        <EditListingModal
          listing={editModal}
          onClose={() => setEditModal(null)}
          onSave={handleUpdateListing}
          saving={saving}
        />
      )}
    </div>
  );
}

const DELIVERY_HOURS_OPTS = [1, 2, 4, 6, 12, 24, 48, 72];

function EditListingModal({ listing, onClose, onSave, saving }) {
  const imgs = listing.images || [];
  const [title, setTitle]           = useState(listing.title || '');
  const [price, setPrice]           = useState(listing.price || '');
  const [description, setDesc]      = useState(listing.description || '');
  const [images, setImages]         = useState(imgs.length > 0 ? imgs : ['']);
  const [coverIndex, setCoverIndex] = useState(listing.cover_index ?? 0);
  const [deliveryHours, setDelHours]= useState(listing.delivery_hours ?? 24);
  const [status, setStatus]         = useState(listing.status || 'active');

  const addImage    = () => setImages(i => [...i, '']);
  const removeImage = (idx) => setImages(i => i.filter((_, j) => j !== idx));
  const setImage    = (idx, val) => setImages(i => i.map((x, j) => j === idx ? val : x));

  const handleSave = (overrideStatus) => {
    onSave({
      listing_id:     listing.id,
      title:          title.trim(),
      price:          parseFloat(price) || 0,
      description:    description.trim(),
      images:         images.filter(Boolean),
      cover_index:    coverIndex,
      delivery_hours: deliveryHours,
      status:         overrideStatus ?? status,
    });
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-gray-800">İlanı Düzenle</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
        </div>

        <div className="space-y-4">
          {/* Başlık */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Başlık *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="İlan başlığı..." />
          </div>

          {/* Fiyat */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Fiyat (₺) *</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} step="0.01" min="0" className={inputCls} />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Açıklama</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={4}
              className={inputCls + ' resize-none'} placeholder="İlanı detaylı açıklayın..." />
          </div>

          {/* Görseller */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Görseller (URL)</label>
            <div className="space-y-2">
              {images.map((img, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex gap-2 items-center">
                    <button onClick={() => setCoverIndex(idx)} title="Kapak yap"
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all ${coverIndex === idx ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'}`}>
                      <ImageIcon size={13} className={coverIndex === idx ? 'text-violet-600' : 'text-gray-400'} />
                    </button>
                    <input value={img} onChange={e => setImage(idx, e.target.value)}
                      placeholder={`Görsel ${idx + 1} URL`}
                      className={inputCls + ` flex-1 text-xs ${img && !isValidImageUrl(img) ? 'border-red-300 focus:border-red-400' : ''}`} />
                    {images.length > 1 && (
                      <button onClick={() => removeImage(idx)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  {img && !isValidImageUrl(img) && (
                    <p className="text-[11px] text-red-500 pl-10">Geçersiz URL. İzin verilen: {ALLOWED_DOMAINS_LABEL}</p>
                  )}
                </div>
              ))}
              {images.length < 8 && (
                <button onClick={addImage} className="text-xs text-violet-600 hover:text-violet-500 font-bold flex items-center gap-1 mt-1">
                  <Plus size={13} /> Görsel Ekle
                </button>
              )}
            </div>
          </div>

          {/* Teslimat süresi */}
          {listing.delivery_type === 'manual' && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Teslimat Süresi</label>
              <div className="flex flex-wrap gap-2">
                {DELIVERY_HOURS_OPTS.map(h => (
                  <button key={h} onClick={() => setDelHours(h)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${deliveryHours === h ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'}`}>
                    {h < 24 ? `${h}s` : `${h / 24}g`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Durum — sadece aktif ilanlar için göster */}
          {listing.status !== 'passive' && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Durum</label>
              <div className="flex gap-2">
                {[{ v: 'active', l: '✅ Aktif' }, { v: 'passive', l: '⏸ Pasif' }].map(opt => (
                  <button key={opt.v} onClick={() => setStatus(opt.v)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${status === opt.v ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {listing.status === 'passive' ? (
            <button onClick={() => handleSave('active')} disabled={saving || !title.trim() || !price}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
              {saving ? 'Kaydediliyor...' : '✅ Kaydet ve Yayınla'}
            </button>
          ) : (
            <button onClick={() => handleSave()} disabled={saving || !title.trim() || !price}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
