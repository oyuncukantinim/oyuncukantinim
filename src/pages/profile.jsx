import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  List, Package, Settings, LogOut, Plus, ShieldCheck,
  Wallet, Trash2, Edit3, Image as ImageIcon, Star,
  Truck, CheckCircle, AlertTriangle, Clock, User,
  Eye, EyeOff, Store, X, Check, ChevronDown, ChevronUp,
  MapPin, History, ToggleLeft, ToggleRight, LayoutGrid, LayoutList,
  MessageSquarePlus, Heart, TrendingDown, TrendingUp, BarChart2, Shield
} from 'lucide-react';

const FinanceIcon = TrendingUp;
import { isValidImageUrl, ALLOWED_DOMAINS_LABEL } from '../lib/imageUrl';
import { getListingCoverImage } from '../lib/listingMedia';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { applyListingDoping, getMyListings, updateProfile, addBalance, deleteListing, updateListing, listingSlug, getFavorites, toggleFavorite, getListingPriceHistory, getMyTransactions, sendProfileEmailVerification, verifyProfileEmailCode } from '../lib/api';
import { AVATARS } from '../data/catalog';
import useSiteBrand from '../hooks/useSiteBrand';
import { findDopingOption, formatDopingDuration, getDopingTypeMeta, getDopingRemainingLabel, getListingActiveDopingTypes } from '../lib/doping';

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

const REVIEW_CRITERIA = [
  { key: 'reliability',     label: 'Güvenilirlik' },
  { key: 'satisfaction',    label: 'Memnuniyet' },
  { key: 'speed',           label: 'Hız' },
  { key: 'service_quality', label: 'Hizmet Kalitesi' },
];

function StarPicker({ value, onChange, size = 22 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
        >
          <Star
            size={size}
            className={`transition-colors ${n <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewModal({ order, token, onClose, onSuccess }) {
  const [ratings, setRatings] = useState({ reliability: 5, satisfaction: 5, speed: 5, service_quality: 5 });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [commentMax, setCommentMax] = useState(500);

  useEffect(() => {
    fetch('https://api.oyuncukantinim.com.tr/api.php?action=get_site_settings')
      .then(r => r.json())
      .then(j => { if (j.status === 'success' && j.data.review_comment_max) setCommentMax(Number(j.data.review_comment_max)); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://api.oyuncukantinim.com.tr/api.php?action=add_review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_id: order.id, ...ratings, comment }),
      });
      const json = await res.json();
      if (json.status !== 'success') throw new Error(json.message);
      onSuccess();
      onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-extrabold text-gray-800">Değerlendirme Yap</h3>
            <p className="text-xs text-gray-400 mt-0.5">Sipariş #{order.id} · {order.seller_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100"><X size={16} /></button>
        </div>
        {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            {REVIEW_CRITERIA.map(c => (
              <div key={c.key} className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-gray-700 w-32 flex-shrink-0">{c.label}</span>
                <StarPicker value={ratings[c.key]} onChange={v => setRatings(r => ({ ...r, [c.key]: v }))} />
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-600">Yorum (isteğe bağlı)</label>
              <span className={`text-xs font-semibold ${comment.length > commentMax ? 'text-red-500' : comment.length > commentMax * 0.85 ? 'text-orange-500' : 'text-gray-400'}`}>
                {comment.length}/{commentMax}
              </span>
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Deneyimini paylaş..."
              rows={3}
              maxLength={commentMax}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
          </button>
        </form>
      </div>
    </div>
  );
}

function MyReviewViewModal({ orderId, token, onClose }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`https://api.oyuncukantinim.com.tr/api.php?action=get_review_by_order&order_id=${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(j => setReview(j.data || null)).catch(() => {}).finally(() => setLoading(false));
  }, [orderId, token]);

  const avg = review ? Math.round((+review.reliability + +review.satisfaction + +review.speed + +review.service_quality) / 4) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-gray-800">Değerlendirmem</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100"><X size={16}/></button>
        </div>
        {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin"/></div>
        : !review ? <p className="text-center text-gray-400 py-6 text-sm">Değerlendirme bulunamadı.</p>
        : (
          <div className="space-y-4">
            {review.item_image && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <img src={review.item_image} alt="" className="w-12 h-9 object-cover rounded-lg flex-shrink-0"/>
                <span className="text-sm font-bold text-gray-700 line-clamp-2">{review.item_title}</span>
              </div>
            )}
            <div className="flex justify-center gap-0.5">
              {[1,2,3,4,5].map(n => <Star key={n} size={22} className={n <= avg ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}/>)}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[{label:'Güvenilirlik',val:review.reliability},{label:'Memnuniyet',val:review.satisfaction},{label:'Hız',val:review.speed},{label:'Hizmet',val:review.service_quality}].map(c => (
                <div key={c.label} className="bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="text-gray-500 font-semibold">{c.label}</span>
                  <span className="font-extrabold text-violet-700">{c.val}/5</span>
                </div>
              ))}
            </div>
            {review.comment && <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 italic">"{review.comment}"</div>}
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
  const [showReview, setShowReview] = useState(false);
  const [showMyReview, setShowMyReview] = useState(false);

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
  const coverImage = Array.isArray(order.item_images) ? order.item_images[0] : null;
  const coverFallback = order.item_type === 'epin' ? '🎫' : '🖼️';

  return (
    <>
    {showLogs && <OrderLogsModal orderId={order.id} token={token} onClose={() => setShowLogs(false)} />}
    {showReview && <ReviewModal order={order} token={token} onClose={() => setShowReview(false)} onSuccess={() => { showToast('Değerlendirme gönderildi!'); onRefresh(); }} />}
    {showMyReview && <MyReviewViewModal orderId={order.id} token={token} onClose={() => setShowMyReview(false)} />}
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 flex items-center gap-3">
        <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center text-2xl flex-shrink-0 border border-gray-100">
          {coverImage ? (
            <img src={coverImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{coverFallback}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 truncate text-sm">{order.item_title || 'Ürün'}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {isSellerView ? `Alıcı: ${order.buyer_username || '—'}` : (order.seller_name ? `Satıcı: ${order.seller_name}` : '')}
            {order.game_name ? ` • ${order.game_name}` : ''}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Sipariş #{order.id} • {new Date(order.created_at).toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
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
            <div className="text-xs text-orange-500 bg-orange-50 p-2 rounded-lg"> Ödeme bekleniyor (onay sürecinde)</div>
          )}
          {!isSellerView && status === 2 && !order.has_reviewed && (
            <button onClick={() => setShowReview(true)}
              className="flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors">
              <MessageSquarePlus size={13}/> Değerlendir
            </button>
          )}
          {!isSellerView && status === 2 && order.has_reviewed == 1 && (
            <button onClick={() => setShowMyReview(true)}
              className="flex items-center gap-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors">
              <Star size={13} className="fill-yellow-500 text-yellow-500"/> Değerlendirmem
            </button>
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
  const {
    defaultAvatar,
    defaultProfileBanner,
    defaultListingImage,
    balanceAddEnabled,
    registrationEmailCodeExpiryMinutes,
    dopingVitrineOptions,
    dopingFeaturedOptions,
  } = useSiteBrand();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('listings');
  const [myListings, setMyListings] = useState([]);
  const [listingFilter, setListingFilter] = useState('active');
  const [listingsView, setListingsView] = useState(() => localStorage.getItem('listingsView') || 'list');
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [pendingEmailVerification, setPendingEmailVerification] = useState('');
  const [emailVerificationExpiresAt, setEmailVerificationExpiresAt] = useState('');
  const [verificationNow, setVerificationNow] = useState(Date.now());
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(null); // listing being edited
  const [personalInfo, setPersonalInfo] = useState({ full_name: '', country: '', city: '', district: '', address: '' });
  const [favorites, setFavorites] = useState([]);
  const [analyzeModal, setAnalyzeModal] = useState(null); // { listing_id, title }
  const [dopingModal, setDopingModal] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewStarFilter, setReviewStarFilter] = useState(0);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setEditUsername(user.username || '');
    setEditEmail(user.email || '');
    setEmailVerificationCode('');
    setPendingEmailVerification('');
    setEmailVerificationExpiresAt('');
    setBannerImage(user.banner_image || defaultProfileBanner || '');
    setSelectedAvatar(user.avatar || defaultAvatar);
    setPersonalInfo({
      full_name: user.full_name || '',
      country:   user.country   || '',
      city:      user.city      || '',
      district:  user.district  || '',
      address:   user.address   || '',
    });
  }, [user, navigate, defaultAvatar, defaultProfileBanner]);

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
    else if (activeTab === 'favorites') {
      getFavorites().then(r => setFavorites(r.data || [])).catch(() => {});
    }
    else if (activeTab === 'reviews') {
      apiAuth('get_my_reviews', null, token).then(data => setMyReviews(data || [])).catch(() => {});
    }
  }, [activeTab, user, loadListings, loadOrders, loadSales]);

  if (!user) return null;

  const normalizedUsername = editUsername.trim();
  const normalizedEmail = editEmail.trim();
  const normalizedBannerImage = bannerImage.trim();
  const emailChanged = normalizedEmail !== (user.email || '');
  const emailVerified = Boolean(user.email_verified_at) && !emailChanged;
  const emailVerificationPending = pendingEmailVerification !== '' && pendingEmailVerification === normalizedEmail;
  const verificationExpiryTime = emailVerificationExpiresAt ? new Date(emailVerificationExpiresAt).getTime() : 0;
  const verificationSecondsLeft = verificationExpiryTime ? Math.max(0, Math.ceil((verificationExpiryTime - verificationNow) / 1000)) : 0;
  const verificationCanResend = emailVerificationPending && verificationSecondsLeft <= 0;
  const profileDirty =
    selectedAvatar !== (user.avatar || defaultAvatar) ||
    normalizedBannerImage !== (user.banner_image || defaultProfileBanner || '');
  const personalDirty =
    personalInfo.full_name !== (user.full_name || '') ||
    personalInfo.country !== (user.country || '') ||
    personalInfo.city !== (user.city || '') ||
    personalInfo.district !== (user.district || '') ||
    personalInfo.address !== (user.address || '') ||
    normalizedEmail !== (user.email || '') ||
    Boolean(newPassword);
  const personalDirtyWithoutEmail =
    personalInfo.full_name !== (user.full_name || '') ||
    personalInfo.country !== (user.country || '') ||
    personalInfo.city !== (user.city || '') ||
    personalInfo.district !== (user.district || '') ||
    personalInfo.address !== (user.address || '') ||
    Boolean(newPassword);

  useEffect(() => {
    if (!emailVerificationPending || verificationSecondsLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setVerificationNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [emailVerificationPending, verificationSecondsLeft]);

  const formatVerificationTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (!isValidImageUrl(normalizedBannerImage)) {
        showToast(`Banner görseli geçersiz. İzinli alanlar: ${ALLOWED_DOMAINS_LABEL}`);
        setSaving(false);
        return;
      }
      if (selectedAvatar !== user.avatar) payload.avatar = selectedAvatar;
      if (normalizedBannerImage !== (user.banner_image || defaultProfileBanner || '')) payload.banner_image = normalizedBannerImage;
      if (Object.keys(payload).length === 0) { showToast('Değişiklik yok.'); setSaving(false); return; }
      const res = await updateProfile(payload);
      updateUser(res.data);
      setEditUsername(res.data.username || '');
      setEditEmail(res.data.email || '');
      setBannerImage(res.data.banner_image || defaultProfileBanner || '');
      setSelectedAvatar(res.data.avatar || defaultAvatar);
      showToast('Profil güncellendi!');
    } catch (err) { showToast(err.message); }
    finally { setSaving(false); }
  };

  const handleAddBalance = async () => {
    if (!balanceAddEnabled) {
      showToast('Bakiye yükleme şu an kapalı.');
      return;
    }
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
      await updateListing(data);
      showToast('İlan güncellendi!');
      setEditModal(null);
      loadListings();
    } catch (e) { showToast(e.message); }
    finally { setSaving(false); }
  };

  const handleToggleListingStatus = async (event, listing) => {
    event.preventDefault();
    event.stopPropagation();

    const nextStatus = listing.status === 'active' ? 'passive' : 'active';
    setSaving(true);
    try {
      await updateListing({ listing_id: listing.id, status: nextStatus });
      setMyListings((prev) =>
        prev.map((item) =>
          item.id === listing.id ? { ...item, status: nextStatus } : item
        )
      );
      showToast(nextStatus === 'passive' ? 'İlan pasife alındı.' : 'İlan aktifleştirildi.');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyListingDoping = async ({ listingId, dopings }) => {
    setSaving(true);
    try {
      const response = await applyListingDoping({ listing_id: listingId, dopings });
      if (response.data?.new_balance !== undefined) {
        updateUser({ ...user, balance: Number(response.data.new_balance) });
      }
      setDopingModal(null);
      showToast('Doping paketleri uygulandı.');
      loadListings();
    } catch (error) {
      showToast(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); showToast('Görüşürüz!'); navigate('/'); };

  const handleSavePersonalInfo = async () => {
    setSaving(true);
    try {
      if (!personalDirty) {
        showToast('Değişiklik yok.');
        setSaving(false);
        return;
      }
      const payload = { ...personalInfo };
      if (newPassword && newPassword !== confirmPassword) {
        showToast('Şifre tekrar alanı eşleşmiyor.');
        setSaving(false);
        return;
      }
      if (normalizedEmail !== (user.email || '')) payload.email = normalizedEmail;
      if (newPassword) payload.new_password = newPassword;
      const res = await updateProfile(payload);
      updateUser(res.data);
      setEditEmail(res.data.email || '');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      showToast('Kişisel bilgiler güncellendi!');
    } catch (err) { showToast(err.message); }
    finally { setSaving(false); }
  };

  const handleSavePersonalInfoV2 = async () => {
    setSaving(true);
    try {
      if (!personalDirty) {
        showToast('Değişiklik yok.');
        setSaving(false);
        return;
      }

      const payload = { ...personalInfo };
      if (newPassword && newPassword !== confirmPassword) {
        showToast('Şifre tekrar alanı eşleşmiyor.');
        setSaving(false);
        return;
      }
      if (newPassword) payload.new_password = newPassword;

      let updatedUser = user;
      if (personalDirtyWithoutEmail) {
        const res = await updateProfile(payload);
        updatedUser = res.data;
        updateUser(res.data);
        setNewPassword('');
        setConfirmPassword('');
        setShowPassword(false);
      }

      if (emailChanged || !user.email_verified_at) {
        const response = await sendProfileEmailVerification({ email: normalizedEmail });
        setPendingEmailVerification(normalizedEmail);
        setEmailVerificationCode('');
        setEmailVerificationExpiresAt(
          response.data?.expires_at ||
          new Date(Date.now() + registrationEmailCodeExpiryMinutes * 60 * 1000).toISOString()
        );
        setVerificationNow(Date.now());
        showToast(emailChanged ? 'Yeni e-posta adresine doğrulama kodu gönderildi.' : 'Mail doğrulama kodu gönderildi.');
        return;
      }

      setEditEmail(updatedUser.email || '');
      showToast('Kişisel bilgiler güncellendi!');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartPersonalEmailVerification = async () => {
    if (!normalizedEmail) {
      showToast('Önce e-posta adresini girin.');
      return;
    }

    setSaving(true);
    try {
      const response = await sendProfileEmailVerification({ email: normalizedEmail });
      setPendingEmailVerification(normalizedEmail);
      setEmailVerificationCode('');
      setEmailVerificationExpiresAt(
        response.data?.expires_at ||
        new Date(Date.now() + registrationEmailCodeExpiryMinutes * 60 * 1000).toISOString()
      );
      setVerificationNow(Date.now());
      showToast(emailChanged ? 'Yeni e-posta adresine doğrulama kodu gönderildi.' : 'Mail doğrulama kodu gönderildi.');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPersonalEmailCode = async () => {
    if (!emailVerificationCode.trim()) {
      showToast('Doğrulama kodunu girin.');
      return;
    }
    setSaving(true);
    try {
      const res = await verifyProfileEmailCode({ code: emailVerificationCode.trim() });
      updateUser(res.data);
      setEditEmail(res.data.email || '');
      setEmailVerificationCode('');
      setPendingEmailVerification('');
      setEmailVerificationExpiresAt('');
      showToast('E-posta doğrulandı.');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResendPersonalEmailCode = async () => {
    if (!verificationCanResend) return;
    setSaving(true);
    try {
      const response = await sendProfileEmailVerification({ email: normalizedEmail });
      setPendingEmailVerification(normalizedEmail);
      setEmailVerificationCode('');
      setEmailVerificationExpiresAt(
        response.data?.expires_at ||
        new Date(Date.now() + registrationEmailCodeExpiryMinutes * 60 * 1000).toISOString()
      );
      setVerificationNow(Date.now());
      showToast('Yeni doğrulama kodu gönderildi.');
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'listings',      label: 'İlanlarım',        icon: List },
    { id: 'orders',        label: 'Siparişlerim',      icon: Package },
    { id: 'sales',         label: 'Satışlarım',        icon: Store },
    { id: 'favorites',     label: 'Favorilerim',       icon: Heart },
    { id: 'reviews',       label: 'Değerlendirmeler',  icon: Star },
    ...(balanceAddEnabled ? [{ id: 'balance', label: 'Bakiye', icon: Wallet }] : []),
    { id: 'finance',       label: 'Finansal',          icon: FinanceIcon },
    { id: 'profile',       label: 'Profil',            icon: User },
    { id: 'personal',      label: 'Kişisel Bilgiler',  icon: MapPin },
  ];

  const filteredListings = myListings.filter(l => {
    if (listingFilter === 'active') return l.status === 'active';
    if (listingFilter === 'passive') return l.status !== 'active' && l.status !== 'expired';
    if (listingFilter === 'expired') return l.status === 'expired';
    return true;
  });

  useEffect(() => {
    if (!balanceAddEnabled && activeTab === 'balance') {
      setActiveTab('finance');
    }
  }, [activeTab, balanceAddEnabled]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card overflow-hidden">
        <div className="aspect-[5/1] relative overflow-hidden bg-gradient-to-r from-violet-500/20 via-cyan-500/10 to-pink-500/20">
          {(user.banner_image || defaultProfileBanner) ? (
            <img src={user.banner_image || defaultProfileBanner} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
              <div className="absolute -top-10 right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute -bottom-8 left-12 w-40 h-24 rounded-full bg-cyan-200/20 blur-2xl" />
            </>
          )}
        </div>
        <div className="px-6 sm:px-8 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-50 border-4 border-white rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                {user.avatar || defaultAvatar}
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
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
              {Number(user.is_admin) === 1 && (
                <Link to="/admin" className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                  <Shield size={12}/> Admin Paneli
                </Link>
              )}
              <Link to={`/p/${user.username}`} className="btn-secondary py-1.5 px-4 text-xs flex items-center gap-1.5">
                 Mağazamı Gör
              </Link>
            </div>
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
                  <div className="text-4xl mb-3"></div>
                  <p className="text-gray-400 font-semibold">Bu durumda ilan yok.</p>
                  <Link to="/create" className="text-violet-600 font-bold hover:underline text-sm mt-1 inline-block">Hemen ilan ekle</Link>
                </div>
              ) : listingsView === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {filteredListings.map(listing => (
                    <div key={listing.id} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
                        {getListingCoverImage(listing, defaultListingImage)
                          ? <img src={getListingCoverImage(listing, defaultListingImage)} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"/>
                          : <div className="flex h-full w-full items-center justify-center text-slate-300"><ImageIcon size={26}/></div>
                        }
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-400">
                            <span>{(listing.category_name || listing.category || '').replace(/-/g, ' ') || 'Kategori yok'}</span>
                            {getListingActiveDopingTypes(listing).map((type) => (
                              <span key={`${listing.id}-${type}`} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getDopingTypeMeta(type).buttonClass}`}>
                                {getDopingTypeMeta(type).label}
                              </span>
                            ))}
                          </div>
                          <Link to={listingSlug(listing.title, listing.id)} className="block truncate text-sm font-extrabold leading-5 text-slate-800 transition-colors hover:text-violet-600">
                            {listing.title}
                          </Link>
                        </div>
                        <div className="mt-auto space-y-2">
                          <div className="flex items-end justify-between gap-2">
                            <div className="text-lg font-black tracking-tight text-emerald-600">{Number(listing.price).toFixed(2)} ₺</div>
                          </div>
                          <div className="flex items-center justify-end gap-1 rounded-xl border border-slate-100 bg-slate-50 px-1.5 py-1">
                          {listing.status !== 'expired' && listing.status !== 'sold' && (
                            <button onClick={(event) => handleToggleListingStatus(event, listing)}
                              className={`rounded-lg p-1.5 transition-colors ${listing.status === 'active' ? 'text-emerald-500 hover:bg-orange-50 hover:text-orange-500' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-500'}`}>
                              {listing.status === 'active' ? <ToggleRight size={12}/> : <ToggleLeft size={12}/>}
                            </button>
                          )}
                          {listing.status !== 'expired' && listing.status !== 'sold' ? (
                            <button onClick={() => setDopingModal(listing)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-violet-50 hover:text-violet-600" title="Doping">
                              <Package size={12} />
                            </button>
                          ) : null}
                          <button onClick={() => setEditModal(listing)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-500"><Edit3 size={12}/></button>
                          <button onClick={() => handleDeleteListing(listing.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"><Trash2 size={12}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
	                  {filteredListings.map(listing => (
	                    <div key={listing.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-violet-200 hover:shadow-md">
	                      <div className="h-16 w-[88px] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 flex-shrink-0">
	                        {getListingCoverImage(listing, defaultListingImage) ? (
	                          <img src={getListingCoverImage(listing, defaultListingImage)} alt="" className="w-full h-full object-cover"/>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300"><ImageIcon size={20}/></div>
                        )}
	                      </div>
	                      <div className="flex-1 min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-400">
                            <span>İlan #{listing.id}</span>
                            <span>{(listing.category_name || listing.category || '').replace(/-/g, ' ') || 'Kategori yok'}</span>
                            {getListingActiveDopingTypes(listing).map((type) => (
                              <span key={`${listing.id}-${type}`} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getDopingTypeMeta(type).buttonClass}`}>
                                {getDopingTypeMeta(type).label}
                              </span>
                            ))}
                          </div>
	                        <Link to={listingSlug(listing.title, listing.id)} className="block truncate text-sm font-extrabold text-slate-800 hover:text-violet-600">{listing.title}</Link>
                      </div>
                      <div className="flex-shrink-0 space-y-2 text-right">
                        <div className="text-base font-black tracking-tight text-emerald-600">{Number(listing.price).toFixed(2)} ₺</div>
                        <div className="flex items-center justify-end gap-1 rounded-xl border border-slate-100 bg-slate-50 px-1.5 py-1">
                          {listing.status !== 'expired' && listing.status !== 'sold' && (
                            <button
                              onClick={(event) => handleToggleListingStatus(event, listing)}
                              title={listing.status === 'active' ? 'Pasif yap' : 'Aktif et'}
                              className={`rounded-lg p-1.5 transition-colors ${listing.status === 'active' ? 'text-emerald-500 hover:bg-orange-50 hover:text-orange-500' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-500'}`}>
                              {listing.status === 'active' ? <ToggleRight size={15}/> : <ToggleLeft size={15}/>}
                            </button>
                          )}
                          {listing.status !== 'expired' && listing.status !== 'sold' ? (
                            <button onClick={() => setDopingModal(listing)} className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600" title="Doping">
                              <Package size={13}/>
                            </button>
                          ) : null}
                          <button onClick={() => setEditModal(listing)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500">
                            <Edit3 size={13}/>
                          </button>
                          <button onClick={() => handleDeleteListing(listing.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
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

          {/* SİPARİLERİM */}
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

          {/* SATILARIM */}
          {activeTab === 'sales' && (
            <div>
              <h2 className="text-lg font-extrabold text-gray-800 mb-5">Satışlarım</h2>
              {sales.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3"></div>
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

          {/* FAVORİLERİM */}
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-lg font-extrabold text-gray-800 mb-5 flex items-center gap-2">
                <Heart size={18} className="text-red-400 fill-red-400" /> Favorilerim
              </h2>
              {favorites.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Heart size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="font-semibold">Henüz favori ilanın yok.</p>
                  <p className="text-sm mt-1">İlan detay sayfasında ♡ butonuna bas.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map(fav => {
                    const coverImg = getListingCoverImage(fav, defaultListingImage);
                    const dropped = fav.price_diff < -0.009;
                    const risen   = fav.price_diff > 0.009;
                    return (
                      <div key={fav.fav_id} className="flex items-center gap-4 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        {/* Kapak */}
                        <div className="w-16 h-12 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                          {coverImg ? <img src={coverImg} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={18}/></div>}
                        </div>
                        {/* Bilgi */}
                        <div className="flex-1 min-w-0">
                          <Link to={listingSlug(fav.title, fav.listing_id)} className="font-bold text-gray-800 hover:text-neon-purple text-sm line-clamp-1 transition-colors">
                            {fav.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-extrabold text-neon-green">{Number(fav.price).toFixed(2)} ₺</span>
                            {dropped && <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-lg"><TrendingDown size={11}/> {Math.abs(fav.price_diff).toFixed(2)} ₺ düştü</span>}
                            {risen  && <span className="flex items-center gap-0.5 text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-lg"><TrendingUp size={11}/> {fav.price_diff.toFixed(2)} ₺ arttı</span>}
                          </div>
                        </div>
                        {/* Butonlar */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setAnalyzeModal({ listing_id: fav.listing_id, title: fav.title })}
                            className="p-2 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl transition-colors"
                            title="Fiyat Analizi"
                          >
                            <BarChart2 size={15} />
                          </button>
                          <button
                            onClick={async () => {
                              await toggleFavorite(fav.listing_id).catch(() => {});
                              setFavorites(prev => prev.filter(f => f.fav_id !== fav.fav_id));
                            }}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-400 rounded-xl transition-colors"
                            title="Favorilerden çıkar"
                          >
                            <Heart size={15} className="fill-current" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Analiz Modal */}
              {analyzeModal && <PriceAnalyzeModal listing={analyzeModal} onClose={() => setAnalyzeModal(null)} />}
            </div>
          )}

          {/* DEĞERLENDİRMELERİM */}
          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2"><Star size={18} className="text-yellow-400 fill-yellow-400"/> Değerlendirmelerim</h2>
                <div className="flex gap-1.5">
                  {[0,1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setReviewStarFilter(n)}
                      className={`w-8 h-8 rounded-xl text-xs font-extrabold border transition-all ${reviewStarFilter === n ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-yellow-300'}`}>
                      {n === 0 ? '★' : n}
                    </button>
                  ))}
                </div>
              </div>
              {myReviews.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Star size={40} className="mx-auto mb-3 opacity-20"/>
                  <p className="font-semibold">Henüz değerlendirme yapmadın.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReviews.filter(r => reviewStarFilter === 0 || Math.round((+r.reliability + +r.satisfaction + +r.speed + +r.service_quality) / 4) === reviewStarFilter).map(r => {
                    const avg = Math.round((+r.reliability + +r.satisfaction + +r.speed + +r.service_quality) / 4);
                    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR') : '';
                    return (
                      <div key={r.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex gap-3">
                        {r.item_image && (
                          <img src={r.item_image} alt="" className="w-14 h-11 rounded-xl object-cover flex-shrink-0 border border-gray-200"/>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-700 line-clamp-1">{r.item_title || 'İlan'}</span>
                            <div className="flex gap-0.5 flex-shrink-0">
                              {[1,2,3,4,5].map(n => <Star key={n} size={13} className={n <= avg ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}/>)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mb-1.5">Satıcı: <span className="font-semibold text-gray-600">{r.seller_username}</span> · {fmtDate(r.created_at)}</div>
                          {r.comment && <p className="text-xs text-gray-500 italic line-clamp-2">"{r.comment}"</p>}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {[{l:'Güvenilirlik',v:r.reliability},{l:'Memnuniyet',v:r.satisfaction},{l:'Hız',v:r.speed},{l:'Hizmet',v:r.service_quality}].map(c => (
                              <span key={c.l} className="text-[10px] bg-white border border-gray-200 rounded-lg px-2 py-0.5 font-semibold text-gray-500">{c.l}: <span className="text-violet-600 font-extrabold">{c.v}</span></span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FİNANSAL HAREKETLERİM */}
          {activeTab === 'finance' && <FinanceTabContent token={token} />}

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
            <div className="max-w-3xl space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Profil Bilgilerim</h2>
                  <p className="text-sm text-gray-400 mt-1">Avatar ve banner görünümünü buradan yönetebilirsin.</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${profileDirty ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {profileDirty ? 'Kaydedilmemiş değişiklik var' : 'Profil güncel'}
                </span>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <label className="block text-sm font-bold text-gray-600 mb-3">Avatar Seçimi</label>
                    <div className="flex flex-wrap gap-2">
                      {AVATARS.map(av => (
                        <button key={av} onClick={() => setSelectedAvatar(av)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${selectedAvatar === av ? 'bg-violet-100 border-2 border-violet-500 scale-110' : 'bg-white border border-gray-200 hover:border-violet-300'}`}>
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <label className="block text-sm font-bold text-gray-600">Profil Banner Görseli</label>
                      </div>
                      <span className="text-[11px] font-bold text-violet-600 bg-violet-50 border border-violet-100 rounded-full px-2.5 py-1">
                        1500x300px
                      </span>
                    </div>
                    <input
                      type="url"
                      value={bannerImage}
                      onChange={e => setBannerImage(e.target.value)}
                      placeholder="https://..."
                      className="input-field"
                    />
                    <p className="text-xs text-gray-400">
                      Tam oturma için 1500x300px ya da aynı 5:1 oranını kullan. Boş bırakırsan banner kaldırılır. İzinli alanlar: {ALLOWED_DOMAINS_LABEL}
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <div className="aspect-[5/1] relative bg-gradient-to-r from-violet-500/15 via-cyan-500/10 to-pink-500/15">
                        {(normalizedBannerImage || defaultProfileBanner) ? (
                          <img src={normalizedBannerImage || defaultProfileBanner} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-white/25" />
                            <div className="absolute -top-8 right-6 w-24 h-24 rounded-full bg-white/25 blur-2xl" />
                            <div className="absolute -bottom-8 left-8 w-28 h-20 rounded-full bg-cyan-200/25 blur-2xl" />
                            <div className="absolute inset-x-0 bottom-3 flex justify-center text-gray-500 text-xs font-semibold">
                              Varsayılan banner görünümü
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1.5">Kullanıcı Adı</label>
                    <input
                      type="text"
                      value={editUsername}
                      readOnly
                      className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Kullanıcı adı tekrar değiştirilemez.</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-violet-50 via-white to-cyan-50 border border-violet-100 rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-violet-100 shadow-sm flex items-center justify-center text-3xl">
                      {selectedAvatar || '👤'}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Profil önizleme</div>
                      <div className="text-lg font-extrabold text-gray-800">{normalizedUsername || 'Kullanıcı adı'}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-gray-500">
                    <div className="bg-white/80 rounded-xl border border-white p-3">
                      Avatar ve banner değişiklikleri anında profil kartına yansır.
                    </div>
                    <div className="bg-white/80 rounded-xl border border-white p-3">
                      Kullanıcı adı kayıt sonrası değiştirilemez.
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving || !profileDirty}
                    className="btn-primary w-full disabled:opacity-50 mt-auto"
                  >
                    {saving ? 'Kaydediliyor...' : profileDirty ? 'Profili Kaydet' : 'Profil Güncel'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KİİSEL BİLGİLER */}
          {activeTab === 'personal' && (
            <div className="max-w-3xl space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Kişisel Bilgiler</h2>
                  <p className="text-sm text-gray-400 mt-1">Adres ve kimlik bilgileri yalnızca senin ve site yöneticisinin erişimine açıktır.</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${personalDirty ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {personalDirty ? 'Kaydedilmemiş değişiklik var' : 'Bilgiler güncel'}
                </span>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
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
                    <textarea value={personalInfo.address} onChange={e => setPersonalInfo(f => ({...f, address: e.target.value}))} rows={4} placeholder="Açık adresiniz..." className="input-field resize-none" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 via-white to-violet-50 border border-cyan-100 rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center gap-2 text-gray-700 font-bold">
                    <Shield size={16} className="text-cyan-600" />
                    Hesap Güvenliği
                  </div>

                  <div className="mt-4 space-y-4 text-sm">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <label className="block text-sm font-bold text-gray-600">E-posta</label>
                        {emailVerificationPending ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            Kod bekleniyor
                          </span>
                        ) : emailVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle size={12} />
                            Mail doğrulandı
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleStartPersonalEmailVerification}
                            disabled={saving || !normalizedEmail}
                            className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Mail doğrula
                          </button>
                        )}
                      </div>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={e => {
                          setEditEmail(e.target.value);
                          if (pendingEmailVerification && pendingEmailVerification !== e.target.value.trim()) {
                            setPendingEmailVerification('');
                            setEmailVerificationCode('');
                            setEmailVerificationExpiresAt('');
                          }
                        }}
                        placeholder="E-posta adresin"
                        className="input-field"
                      />
                      {!emailVerified ? (
                        <p className="mt-1 text-xs text-gray-400">Bu maili kullanmak için kod ile doğrulama gerekir.</p>
                      ) : null}
                      {emailVerificationPending ? (
                        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/80 p-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <label className="block text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                              Doğrulama kodu
                            </label>
                            {verificationCanResend ? (
                              <button
                                type="button"
                                onClick={handleResendPersonalEmailCode}
                                disabled={saving}
                                className="text-xs font-bold text-amber-700 transition-colors hover:text-amber-800 disabled:opacity-50"
                              >
                                Kodu tekrar gönder
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-amber-700">
                                {formatVerificationTimer(verificationSecondsLeft)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              type="text"
                              value={emailVerificationCode}
                              onChange={e => setEmailVerificationCode(e.target.value.trim().slice(0, 8))}
                              placeholder="Mail ile gelen kod"
                              className="input-field flex-1"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyPersonalEmailCode}
                              disabled={saving}
                              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                            >
                              Kodu Doğrula
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1.5">Yeni Şifre</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Değiştirmek istemiyorsan boş bırak"
                          className="input-field pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Şifre alanını boş bırakırsan mevcut şifren korunur.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1.5">Yeni Şifre Tekrar</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Yeni şifreyi tekrar yaz"
                          className={`input-field pr-11 ${confirmPassword && newPassword !== confirmPassword ? 'border-red-300 focus:border-red-400' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">Şifreler eşleşmiyor.</p>
                      )}
                    </div>

                  </div>
                  <button onClick={handleSavePersonalInfoV2} disabled={saving || !personalDirty} className="btn-primary w-full disabled:opacity-50 mt-auto">
                    {saving ? 'Kaydediliyor...' : (emailChanged || !user.email_verified_at) ? 'Kodu Gönder ve Kaydet' : personalDirty ? 'Kişisel Bilgileri Kaydet' : 'Bilgiler Güncel'}
                  </button>
                </div>
              </div>
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

      {dopingModal && (
        <ListingDopingModal
          listing={dopingModal}
          balance={user?.balance}
          vitrineOptions={dopingVitrineOptions}
          featuredOptions={dopingFeaturedOptions}
          onClose={() => setDopingModal(null)}
          onSubmit={handleApplyListingDoping}
          saving={saving}
        />
      )}
    </div>
  );
}

// Fiyat analiz modalı
function PriceAnalyzeModal({ listing, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListingPriceHistory(listing.listing_id)
      .then(r => setHistory(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listing.listing_id]);

  const prices = history.map(h => h.price);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 0;
  const range = maxP - minP || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-gray-800 flex items-center gap-2"><BarChart2 size={18} className="text-violet-500" /> Fiyat Analizi</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
        </div>
        <p className="text-sm text-gray-500 mb-4 truncate">{listing.title}</p>
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"/></div>
        ) : history.length < 2 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">Henüz yeterli fiyat geçmişi yok.</p>
            <p className="text-xs mt-1">Fiyat değişikliklerinden sonra burada grafik oluşur.</p>
          </div>
        ) : (
          <>
            {/* Basit SVG grafik */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <svg viewBox={`0 0 ${history.length * 40} 100`} className="w-full h-32" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02"/>
                  </linearGradient>
                </defs>
                {history.length > 1 && (() => {
                  const pts = history.map((h, i) => {
                    const x = i * 40 + 20;
                    const y = 90 - ((h.price - minP) / range) * 80;
                    return `${x},${y}`;
                  }).join(' ');
                  const first = pts.split(' ')[0];
                  const last  = pts.split(' ').slice(-1)[0];
                  const [lx] = last.split(',');
                  return (
                    <>
                      <polygon points={`20,90 ${pts} ${lx},90`} fill="url(#priceGrad)" />
                      <polyline points={pts} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                      {history.map((h, i) => {
                        const x = i * 40 + 20;
                        const y = 90 - ((h.price - minP) / range) * 80;
                        return <circle key={i} cx={x} cy={y} r="3" fill="#7c3aed" />;
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-emerald-50 rounded-xl p-3">
                <div className="text-xs text-emerald-600 font-semibold">En Düşük</div>
                <div className="font-extrabold text-emerald-700">{minP.toFixed(2)} ₺</div>
              </div>
              <div className="text-center bg-violet-50 rounded-xl p-3">
                <div className="text-xs text-violet-600 font-semibold">Güncel</div>
                <div className="font-extrabold text-violet-700">{prices[prices.length-1]?.toFixed(2)} ₺</div>
              </div>
              <div className="text-center bg-red-50 rounded-xl p-3">
                <div className="text-xs text-red-600 font-semibold">En Yüksek</div>
                <div className="font-extrabold text-red-700">{maxP.toFixed(2)} ₺</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">Son 30 günlük fiyat hareketi</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Finansal Hareketler (profil içi) ─────────────────────────
const FINANCE_DELIVERY_LABELS = ['Bekliyor', 'Teslim Edildi', 'Tamamlandı', 'Anlaşmazlık', 'İptal'];
const FINANCE_STATUS_COLORS   = ['text-gray-500', 'text-blue-500', 'text-emerald-600', 'text-red-500', 'text-gray-400'];

function FinanceTabContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    getMyTransactions(typeFilter)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typeFilter]);

  const transactions = data?.transactions || [];
  const summary      = data?.summary || {};
  const fmtDate = (d) => d ? new Date(d).toLocaleString('tr-TR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
        <FinanceIcon size={18} className="text-emerald-500"/> Finansal Hareketler
      </h2>

      {/* Özet */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
            <TrendingDown size={16} className="text-red-400 mx-auto mb-1"/>
            <div className="font-extrabold text-red-600 text-lg">{Number(summary.total_spent || 0).toFixed(2)} ₺</div>
            <div className="text-[11px] text-gray-400 font-semibold">Harcama</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
            <TrendingUp size={16} className="text-emerald-500 mx-auto mb-1"/>
            <div className="font-extrabold text-emerald-600 text-lg">{Number(summary.total_earned || 0).toFixed(2)} ₺</div>
            <div className="text-[11px] text-gray-400 font-semibold">Kazanç</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-center">
            <Clock size={16} className="text-yellow-500 mx-auto mb-1"/>
            <div className="font-extrabold text-yellow-600 text-lg">{Number(summary.pending_earn || 0).toFixed(2)} ₺</div>
            <div className="text-[11px] text-gray-400 font-semibold">Bekleyen</div>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex gap-2">
        {[{v:'all',l:'Tümü'},{v:'purchase',l:'Alımlar'},{v:'sale',l:'Satışlar'},{v:'balance',l:'Sistem'}].map(f => (
          <button key={f.v} onClick={() => setTypeFilter(f.v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${typeFilter === f.v ? 'bg-violet-600 text-white border-violet-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin"/></div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FinanceIcon size={36} className="mx-auto mb-3 opacity-20"/>
          <p className="font-semibold">Bu kategoride işlem yok.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx, i) => {
            const isPurchase = tx.tx_type === 'purchase';
            const isBalance = tx.tx_type === 'balance';
            const net = isPurchase ? -tx.amount : (tx.seller_amount ?? tx.amount);
            const delivColor = FINANCE_STATUS_COLORS[tx.delivery_status] || 'text-gray-400';
            const delivLabel = FINANCE_DELIVERY_LABELS[tx.delivery_status] || '—';
            return (
              <div key={`${tx.tx_type}-${tx.id}-${i}`} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                <span className={`text-[10px] font-extrabold px-2 py-1 rounded-lg flex-shrink-0 ${isBalance ? 'bg-violet-50 text-violet-700' : isPurchase ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {isBalance ? 'Bakiye' : isPurchase ? 'Alım' : 'Satış'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 truncate">{tx.item_title || '—'}</p>
                  <p className="text-[10px] text-gray-400">
                    {isBalance
                      ? `${tx.counterparty || ''}${tx.balance_before != null ? ` Eski bakiye: ${Number(tx.balance_before).toFixed(2)}` : ''}${tx.balance_after != null ? ` Yeni bakiye: ${Number(tx.balance_after).toFixed(2)}` : ''}`.trim()
                      : `${tx.counterparty || ''} · `}
                    {!isBalance && <span className={delivColor}>{delivLabel}</span>}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-extrabold ${isBalance ? (net < 0 ? 'text-red-500' : 'text-violet-600') : net < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {net < 0 ? '' : '+'}{Number(net).toFixed(2)} ₺
                  </div>
                  <div className="text-[10px] text-gray-400">{fmtDate(tx.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const DELIVERY_HOURS_OPTS = [1, 2, 4, 6, 12, 24, 48, 72];

function ListingDopingModal({ listing, balance, vitrineOptions, featuredOptions, onClose, onSubmit, saving }) {
  const [selectedDopings, setSelectedDopings] = useState({});

  const selectedEntries = [
    selectedDopings.vitrine ? { type: 'vitrine', option: findDopingOption(vitrineOptions, selectedDopings.vitrine) } : null,
    selectedDopings.featured ? { type: 'featured', option: findDopingOption(featuredOptions, selectedDopings.featured) } : null,
  ].filter((entry) => entry?.option);
  const totalPrice = selectedEntries.reduce((sum, entry) => sum + Number(entry.option.price || 0), 0);
  const insufficientTotal = Number(balance || 0) < totalPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800">İlan Doping Seç</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          {[{ type: 'vitrine', options: vitrineOptions }, { type: 'featured', options: featuredOptions }].map(({ type, options: optionList }) => {
            const meta = getDopingTypeMeta(type);
            const selectedHours = selectedDopings[type] ?? null;
            const expiresAt = type === 'vitrine' ? listing.vitrine_expires_at : listing.featured_expires_at;
            const remaining = getDopingRemainingLabel(expiresAt);
            return (
              <div
                key={type}
                className={`w-full rounded-2xl border px-3 py-2.5 transition-all ${selectedHours ? `${meta.accentClass} shadow-sm` : `${meta.accentClass} opacity-95`}`}
              >
                <div className="flex items-start gap-3">
                  {optionList[0]?.image ? (
                    <img src={optionList[0].image} alt={meta.label} className="h-28 w-28 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-400">{meta.label}</div>
                  )}
                  <div className="min-w-0 flex-1 self-start pt-0.5">
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                      <div className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.buttonClass}`}>{meta.label}</div>
                      {remaining ? (
                        <div className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{remaining}</div>
                      ) : (
                        <div className="pt-0.5 text-[11px] font-semibold text-slate-400">{optionList.length} paket</div>
                      )}
                    </div>
                    <p className="text-[11px] leading-4 text-slate-600">{meta.description}</p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedDopings((prev) => ({ ...prev, [type]: null }))}
                        className={`inline-flex min-w-fit flex-col rounded-md border px-2.5 py-1.5 text-left transition-all ${!selectedHours ? 'border-slate-500 bg-white shadow-sm' : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white'}`}
                      >
                        <div className="text-base font-black leading-4 text-slate-900">🛇</div>
                        <div className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-500">Yok</div>
                      </button>
                      {optionList.map((option) => {
                        const selected = Number(selectedHours) === Number(option.hours);
                        const insufficient = Number(balance || 0) < Number(option.price || 0);
                        return (
                          <button
                            key={`${type}-${option.hours}`}
                            type="button"
                            onClick={() => setSelectedDopings((prev) => ({ ...prev, [type]: option.hours }))}
                            className={`inline-flex min-w-fit flex-col rounded-md border px-2.5 py-1.5 text-left transition-all ${selected ? 'border-violet-500 bg-white shadow-sm shadow-violet-100' : 'border-slate-200 bg-white/80 hover:border-violet-200 hover:bg-white'}`}
                          >
                            <div className="text-[11px] font-semibold leading-4 text-slate-500">{formatDopingDuration(option.hours)}</div>
                            <div className="mt-0.5 text-[13px] font-black leading-4 text-emerald-600">{Number(option.price).toFixed(2)} ₺</div>
                            {insufficient ? <div className="mt-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600">Yetersiz</div> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-black text-violet-900">
              {selectedEntries.length ? selectedEntries.map((entry) => `${getDopingTypeMeta(entry.type).label} · ${formatDopingDuration(entry.option.hours)}`).join(' + ') : 'Paket seç'}
            </div>
            <div className="mt-1 text-xs font-semibold text-violet-700">
              {selectedEntries.length ? `${Number(totalPrice).toFixed(2)} ₺` : 'En az bir doping seç'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => selectedEntries.length && onSubmit({ listingId: listing.id, dopings: selectedEntries.map((entry) => ({ type: entry.type, hours: entry.option.hours })) })}
            disabled={saving || !selectedEntries.length || insufficientTotal}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? 'Uygulanıyor...' : 'Doping Uygula'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditListingModal({ listing, onClose, onSave, saving }) {
  const imgs = listing.images || [];
  const [title, setTitle] = useState(listing.title || '');
  const [price, setPrice] = useState(listing.price || '');
  const [description, setDesc] = useState(listing.description || '');
  const [images, setImages] = useState(imgs.length > 0 ? imgs : ['']);
  const [coverIndex, setCoverIndex] = useState(listing.cover_index ?? 0);
  const [deliveryHours, setDelHours] = useState(Number(listing.delivery_hours ?? 24));
  const [maxImages, setMaxImages] = useState(5);
  const [titleMax, setTitleMax] = useState(100);
  const [descMax, setDescMax] = useState(2000);
  const [stockItemMaxCount, setStockItemMaxCount] = useState(500);
  const [catAttrs, setCatAttrs] = useState([]);
  const [attrValues, setAttrValues] = useState(listing.attributes || {});
  const [stocks, setStocks] = useState(
    listing.delivery_type === 'stock'
      ? (((listing.stocks || []).filter((stock) => Number(stock.is_sold) !== 1)).map((stock) => ({
          content: stock.content || '',
        })) || [{ content: '' }])
      : [{ content: '' }]
  );

  useEffect(() => {
    fetch('https://api.oyuncukantinim.com.tr/api.php?action=get_site_settings')
      .then(r => r.json())
      .then(j => {
        if (j.status === 'success') {
          if (j.data.max_listing_images) setMaxImages(Number(j.data.max_listing_images));
          if (j.data.listing_title_max)  setTitleMax(Number(j.data.listing_title_max));
          if (j.data.listing_desc_max)   setDescMax(Number(j.data.listing_desc_max));
          if (j.data.stock_item_max_count) setStockItemMaxCount(Number(j.data.stock_item_max_count));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!listing.category_id) {
      setCatAttrs([]);
      setAttrValues(listing.attributes || {});
      return;
    }
    fetch(`https://api.oyuncukantinim.com.tr/api.php?action=get_category_attributes&category_id=${listing.category_id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.status !== 'success') return;
        const attrs = j.data || [];
        setCatAttrs(attrs);
        const nextValues = {};
        attrs.forEach((attr) => {
          if (listing.attributes && listing.attributes[attr.slug] !== undefined) {
            nextValues[attr.slug] = listing.attributes[attr.slug];
          } else {
            nextValues[attr.slug] = attr.type === 'multiselect' ? [] : '';
          }
        });
        setAttrValues(nextValues);
      })
      .catch(() => {});
  }, [listing.category_id, listing.attributes]);

  const addImage = () => setImages(i => [...i, '']);
  const removeImage = (idx) => setImages(i => i.filter((_, j) => j !== idx));
  const setImage = (idx, val) => setImages(i => i.map((x, j) => j === idx ? val : x));
  const addStock = () => {
    if (stocks.length >= stockItemMaxCount) return;
    setStocks((current) => [...current, { content: '' }]);
  };
  const removeStock = (idx) => setStocks((current) => current.filter((_, j) => j !== idx));
  const setStockField = (idx, field, val) => setStocks((current) => current.map((stock, j) => j === idx ? { ...stock, [field]: val } : stock));
  const setAttr = (slug, val) => setAttrValues((current) => ({ ...current, [slug]: val }));
  const toggleMulti = (slug, opt) => {
    const current = attrValues[slug] || [];
    setAttrValues((prev) => ({
      ...prev,
      [slug]: current.includes(opt) ? current.filter((item) => item !== opt) : [...current, opt],
    }));
  };
  const deliveryType = listing.delivery_type === 'stock' ? 'stock' : 'manual';
  const stockCount = stocks.filter((stock) => stock.content.trim()).length;
  const soldStockCount = (listing.stocks || []).filter((stock) => Number(stock.is_sold) === 1).length;

  const handleSave = () => {
    onSave({
      listing_id: listing.id,
      title: title.trim(),
      price: parseFloat(price) || 0,
      description: description.trim(),
      images: images.filter(Boolean),
      cover_index: coverIndex,
      delivery_hours: deliveryHours,
      attributes: attrValues,
      stocks: deliveryType === 'stock' ? stocks.filter((stock) => stock.content.trim()) : [],
    });
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-gray-800">İlanı Düzenle</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-violet-500">Kategori</div>
              <div className="mt-1 text-sm font-extrabold text-violet-800">{listing.category || 'Kategori yok'}</div>
            </div>
            <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-cyan-500">Teslimat Türü</div>
              <div className="mt-1 text-sm font-extrabold text-cyan-800">{deliveryType === 'stock' ? 'Stoklu Teslimat' : 'Manuel Teslimat'}</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-600">Başlık *</label>
              <span className={`text-[11px] font-semibold ${title.length > titleMax ? 'text-red-500' : 'text-gray-400'}`}>{title.length}/{titleMax}</span>
            </div>
            <input value={title} onChange={e => e.target.value.length <= titleMax && setTitle(e.target.value)}
              className={inputCls + (title.length >= titleMax ? ' border-orange-300' : '')} placeholder="İlan başlığı..." />
          </div>

          {/* Fiyat */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Fiyat (₺) *</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} step="0.01" min="0" className={inputCls} />
          </div>

          {/* Açıklama */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-600">Açıklama</label>
              <span className={`text-[11px] font-semibold ${description.length > descMax ? 'text-red-500' : 'text-gray-400'}`}>{description.length}/{descMax}</span>
            </div>
            <textarea value={description} onChange={e => e.target.value.length <= descMax && setDesc(e.target.value)} rows={4}
              className={inputCls + ' resize-none' + (description.length >= descMax ? ' border-orange-300' : '')} placeholder="İlanı detaylı açıklayın..." />
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Özellikler</h3>
              <p className="mt-1 text-xs text-slate-500">Kategoriye ait özellikleri ilan düzenleme sırasında da güncelleyebilirsin.</p>
            </div>
            {catAttrs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-400">
                Bu kategori için özel özellik tanımlanmamış.
              </div>
            ) : (
              <div className="space-y-4">
                {catAttrs.map((attr) => (
                  <div key={attr.slug}>
                    <label className="mb-1.5 block text-xs font-bold text-gray-600">
                      {attr.name}
                      {attr.is_required ? <span className="ml-1 text-red-500">*</span> : null}
                    </label>
                    {attr.type === 'text' && (
                      <input value={attrValues[attr.slug] || ''} onChange={(e) => setAttr(attr.slug, e.target.value)} className={inputCls} />
                    )}
                    {attr.type === 'number' && (
                      <input type="number" value={attrValues[attr.slug] || ''} onChange={(e) => setAttr(attr.slug, e.target.value)} className={inputCls} />
                    )}
                    {attr.type === 'boolean' && (
                      <div className="flex flex-wrap gap-2">
                        {['Evet', 'Hayır'].map((opt) => (
                          <button key={opt} type="button" onClick={() => setAttr(attr.slug, opt)} className={`min-w-[92px] rounded-lg border px-3 py-2 text-xs font-bold transition-all ${attrValues[attr.slug] === opt ? 'border-violet-600 bg-violet-600 text-white shadow-sm shadow-violet-200' : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:bg-violet-50/50'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                    {attr.type === 'select' && Array.isArray(attr.options) && (
                      <div className="flex flex-wrap gap-2">
                        {attr.options.map((opt) => (
                          <button key={opt} type="button" onClick={() => setAttr(attr.slug, opt)} className={`rounded-xl border px-3 py-1.5 text-sm font-bold transition-all ${attrValues[attr.slug] === opt ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-violet-300'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                    {attr.type === 'multiselect' && Array.isArray(attr.options) && (
                      <div className="flex flex-wrap gap-2">
                        {attr.options.map((opt) => {
                          const selected = (attrValues[attr.slug] || []).includes(opt);
                          return (
                            <button key={opt} type="button" onClick={() => toggleMulti(attr.slug, opt)} className={`rounded-xl border px-3 py-1.5 text-sm font-bold transition-all ${selected ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-violet-300'}`}>
                              {selected ? <Check size={11} className="mr-1 inline" /> : null}
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {attr.type === 'range' && (
                      <div className="flex items-center gap-3">
                        <input type="number" value={(attrValues[attr.slug] || {}).min || ''} onChange={(e) => setAttr(attr.slug, { ...(attrValues[attr.slug] || {}), min: e.target.value })} placeholder={`Min${attr.options?.min !== undefined ? ` (${attr.options.min})` : ''}`} className={`${inputCls} flex-1`} />
                        <span className="font-bold text-gray-400">—</span>
                        <input type="number" value={(attrValues[attr.slug] || {}).max || ''} onChange={(e) => setAttr(attr.slug, { ...(attrValues[attr.slug] || {}), max: e.target.value })} placeholder={`Max${attr.options?.max !== undefined ? ` (${attr.options.max})` : ''}`} className={`${inputCls} flex-1`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Görseller */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-600">Görseller (URL)</label>
              <span className="text-[11px] text-gray-400">{images.filter(Boolean).length}/{maxImages}</span>
            </div>
            <div className="space-y-2">
              {images.map((img, idx) => (
                <div key={idx} className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
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
                  {img ? (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <img src={img} alt={`Görsel ${idx + 1}`} className="h-36 w-full object-contain bg-gray-50" />
                    </div>
                  ) : null}
                  {img && !isValidImageUrl(img) && (
                    <p className="text-[11px] text-red-500">Geçersiz URL. İzin verilen: {ALLOWED_DOMAINS_LABEL}</p>
                  )}
                </div>
              ))}
              {images.length < maxImages && (
                <button onClick={addImage} className="text-xs text-violet-600 hover:text-violet-500 font-bold flex items-center gap-1 mt-1">
                  <Plus size={13} /> Görsel Ekle
                </button>
              )}
            </div>
          </div>

          {deliveryType === 'manual' && (
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

          {deliveryType === 'stock' && (
            <div className="space-y-3 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-cyan-900">Stok Kalemleri</h3>
                  <p className="text-xs text-cyan-700 mt-0.5">Satılmış {soldStockCount} stok korunur, burada aktif stoklar düzenlenir.</p>
                </div>
                <span className="text-xs text-cyan-700 bg-white px-2 py-1 rounded-full border border-cyan-100 font-bold">
                  {stockCount}/{stockItemMaxCount}
                </span>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {stocks.map((stock, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-3 border border-cyan-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500">Stok #{idx + 1}</span>
                      {stocks.length > 1 ? (
                        <button onClick={() => removeStock(idx)} className="p-1 hover:bg-red-50 rounded-lg text-red-400">
                          <Trash2 size={13} />
                        </button>
                      ) : null}
                    </div>
                    <textarea value={stock.content} onChange={e => setStockField(idx, 'content', e.target.value)} placeholder="Stok içeriği — alıcı satın alınca bunu görecek" rows={3} className="input-field text-xs resize-none w-full font-mono" />
                  </div>
                ))}
              </div>
              {stocks.length < stockItemMaxCount ? (
                <button onClick={addStock} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-cyan-300 rounded-xl text-cyan-700 font-bold text-sm hover:bg-cyan-50 transition-colors">
                  <Plus size={16} /> Stok Ekle
                </button>
              ) : null}
            </div>
          )}

          <button onClick={() => handleSave()} disabled={saving || !title.trim() || !price}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}


