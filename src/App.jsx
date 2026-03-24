import { useEffect, useMemo, useState } from 'react';
import {
  BadgeTurkishLira,
  Filter,
  Gamepad2,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { GAMES, INITIAL_FORM, SORT_OPTIONS } from './data/catalog';
import {
  addListing,
  deleteListing,
  getEpins,
  getListings,
  getMyListings,
  loginUser,
  registerUser,
  updateListing,
  updateProfile,
} from './lib/api';

const storageKey = 'ok-beta-user';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUser(user) {
  if (!user) {
    localStorage.removeItem(storageKey);
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(user));
}

function formatMoney(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function gameCategories(gameName) {
  const game = GAMES.find((item) => item.name === gameName);
  return game?.subcategories ?? [];
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) {
    return null;
  }

  return <div className={`toast toast-${toast.type}`}>{toast.message}</div>;
}

function ModalShell({ title, children, onClose, wide = false }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className={`modal-card ${wide ? 'modal-card-wide' : ''}`}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AuthModal({ mode, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    avatar: '👤',
  });

  const isRegister = mode === 'register';

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <ModalShell title={isRegister ? 'Hesap Oluştur' : 'Giriş Yap'} onClose={onClose}>
      <form className="stack-form" onSubmit={handleSubmit}>
        {isRegister ? (
          <label>
            Kullanıcı adı
            <input name="username" value={form.username} onChange={handleChange} placeholder="OyuncuKantin" required />
          </label>
        ) : null}
        <label>
          E-posta
          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="mail@example.com" required />
        </label>
        <label>
          Şifre
          <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="En az 6 karakter" required />
        </label>
        {isRegister ? (
          <label>
            Avatar
            <input name="avatar" value={form.avatar} onChange={handleChange} maxLength={4} />
          </label>
        ) : null}
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'İşleniyor...' : isRegister ? 'Kaydı Tamamla' : 'Giriş Yap'}
        </button>
      </form>
    </ModalShell>
  );
}

function ProfileModal({ user, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    username: user?.username ?? '',
    avatar: user?.avatar ?? '👤',
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <ModalShell title="Profili Düzenle" onClose={onClose}>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          Kullanıcı adı
          <input name="username" value={form.username} onChange={handleChange} required />
        </label>
        <label>
          Avatar
          <input name="avatar" value={form.avatar} onChange={handleChange} maxLength={4} />
        </label>
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Profili Kaydet'}
        </button>
      </form>
    </ModalShell>
  );
}

function ListingFormModal({ listing, user, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(() => {
    if (listing) {
      return {
        id: listing.id,
        game_name: listing.game_name,
        category: listing.category,
        title: listing.title,
        price: String(listing.price ?? ''),
        description: listing.description ?? '',
        status: listing.status ?? 'active',
        imagesText: (listing.images ?? []).join('\n'),
        cover_index: listing.cover_index ?? 0,
      };
    }

    return INITIAL_FORM;
  });

  const categories = gameCategories(form.game_name);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => {
      if (name === 'game_name') {
        const nextCategories = gameCategories(value);
        const currentCategoryExists = nextCategories.some((item) => item.name === current.category);

        return {
          ...current,
          game_name: value,
          category: currentCategoryExists ? current.category : nextCategories[0]?.name ?? '',
        };
      }

      return { ...current, [name]: value };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const images = form.imagesText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    await onSubmit({
      id: listing?.id,
      seller_id: user.id,
      game_name: form.game_name,
      category: form.category,
      title: form.title.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      images,
      cover_index: Number(form.cover_index || 0),
      status: form.status,
    });
  }

  return (
    <ModalShell title={listing ? 'İlanı Düzenle' : 'Yeni İlan Oluştur'} onClose={onClose} wide>
      <form className="listing-form" onSubmit={handleSubmit}>
        <label>
          Oyun
          <select name="game_name" value={form.game_name} onChange={handleChange}>
            {GAMES.map((game) => (
              <option key={game.id} value={game.name}>
                {game.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kategori
          <select name="category" value={form.category} onChange={handleChange}>
            {categories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="listing-form-wide">
          Başlık
          <input name="title" value={form.title} onChange={handleChange} required />
        </label>
        <label>
          Fiyat
          <input type="number" min="0" step="0.01" name="price" value={form.price} onChange={handleChange} required />
        </label>
        <label>
          Durum
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Yayında</option>
            <option value="draft">Taslak</option>
            <option value="sold">Satıldı</option>
          </select>
        </label>
        <label className="listing-form-wide">
          Açıklama
          <textarea name="description" value={form.description} onChange={handleChange} rows={5} />
        </label>
        <label className="listing-form-wide">
          Görsel URL veya base64
          <textarea
            name="imagesText"
            value={form.imagesText}
            onChange={handleChange}
            rows={5}
            placeholder="Her satıra bir görsel bağlantısı yapıştır"
          />
        </label>
        <label>
          Kapak indeksi
          <input type="number" min="0" name="cover_index" value={form.cover_index} onChange={handleChange} />
        </label>
        <div className="listing-form-wide">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Kaydediliyor...' : listing ? 'İlanı Güncelle' : 'İlanı Yayınla'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ListingCard({ listing, editable = false, onEdit, onDelete }) {
  const cover = listing.images?.[listing.cover_index] || listing.images?.[0];

  return (
    <article className="listing-card">
      <div className="listing-media">
        {cover ? (
          <img src={cover} alt={listing.title} />
        ) : (
          <div className="listing-placeholder">
            <Gamepad2 size={28} />
          </div>
        )}
        <span className={`status-pill status-${listing.status}`}>{listing.status}</span>
      </div>
      <div className="listing-body">
        <div className="listing-meta">
          <span>{listing.game_name}</span>
          <span>{listing.category}</span>
        </div>
        <h3>{listing.title}</h3>
        <p>{listing.description || 'Bu ilan için açıklama eklenmemiş.'}</p>
        <div className="listing-footer">
          <div>
            <strong>{formatMoney(listing.price)}</strong>
            <small>
              {listing.avatar} {listing.seller}
            </small>
          </div>
          {editable ? (
            <div className="inline-actions">
              <button type="button" className="ghost-button" onClick={() => onEdit(listing)}>
                <Pencil size={16} />
                Düzenle
              </button>
              <button type="button" className="ghost-button danger" onClick={() => onDelete(listing)}>
                <Trash2 size={16} />
                Sil
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function App() {
  const [user, setUser] = useState(() => readStoredUser());
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [epins, setEpins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelLoading, setPanelLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [listingModal, setListingModal] = useState(null);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    let cancelled = false;

    async function runBootstrap() {
      setLoading(true);
      try {
        const [listingResponse, epinResponse] = await Promise.all([
          getListings({ status: statusFilter }),
          getEpins(),
        ]);

        if (cancelled) {
          return;
        }

        setListings(listingResponse.data);
        setEpins(epinResponse.data);

        if (user?.id) {
          const ownResponse = await getMyListings(user.id);
          if (!cancelled) {
            setMyListings(ownResponse.data);
          }
        } else {
          setMyListings([]);
        }
      } catch (error) {
        if (!cancelled) {
          showToast(error.message, 'error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    runBootstrap();

    return () => {
      cancelled = true;
    };
  }, [statusFilter, user]);

  function showToast(message, type = 'success') {
    setToast({ message, type });
  }

  function applyUser(nextUser) {
    setUser(nextUser);
    persistUser(nextUser);
  }

  async function handleAuthSubmit(form) {
    setPanelLoading(true);
    try {
      const response =
        authMode === 'register'
          ? await registerUser(form)
          : await loginUser({ email: form.email, password: form.password });

      applyUser(response.user);
      setAuthMode(null);
      showToast(response.message || 'İşlem başarılı.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setPanelLoading(false);
    }
  }

  async function handleProfileSubmit(form) {
    if (!user) {
      return;
    }

    setPanelLoading(true);
    try {
      const response = await updateProfile({
        user_id: user.id,
        username: form.username,
        avatar: form.avatar,
      });
      applyUser(response.user);
      setProfileOpen(false);
      showToast(response.message);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setPanelLoading(false);
    }
  }

  async function handleListingSubmit(payload) {
    setPanelLoading(true);
    try {
      const response = payload.id ? await updateListing(payload) : await addListing(payload);
      const nextListing = response.listing;

      setListings((current) => {
        const withoutCurrent = current.filter((item) => item.id !== nextListing.id);
        return [nextListing, ...withoutCurrent];
      });

      setMyListings((current) => {
        const withoutCurrent = current.filter((item) => item.id !== nextListing.id);
        return [nextListing, ...withoutCurrent];
      });

      setListingModal(null);
      showToast(response.message);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setPanelLoading(false);
    }
  }

  async function handleDeleteListing(listing) {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(`"${listing.title}" ilanını silmek istiyor musun?`);
    if (!confirmed) {
      return;
    }

    setPanelLoading(true);
    try {
      const response = await deleteListing({ id: listing.id, seller_id: user.id });
      setListings((current) => current.filter((item) => item.id !== listing.id));
      setMyListings((current) => current.filter((item) => item.id !== listing.id));
      showToast(response.message);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setPanelLoading(false);
    }
  }

  const filteredListings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return listings
      .filter((listing) => (gameFilter === 'all' ? true : listing.game_name === gameFilter))
      .filter((listing) => {
        if (!normalizedSearch) {
          return true;
        }

        return [
          listing.title,
          listing.description,
          listing.seller,
          listing.game_name,
          listing.category,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => {
        if (sortBy === 'price-asc') {
          return left.price - right.price;
        }
        if (sortBy === 'price-desc') {
          return right.price - left.price;
        }
        return new Date(right.created_at ?? 0) - new Date(left.created_at ?? 0);
      });
  }, [gameFilter, listings, search, sortBy]);

  const featuredStats = [
    { label: 'Aktif ilan', value: listings.filter((item) => item.status === 'active').length },
    { label: 'Hazır e-pin', value: epins.length },
    { label: 'Güvenli akış', value: 'Hash + CRUD' },
  ];

  return (
    <div className="app-shell">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header className="topbar">
        <div className="brand">
          <div className="brand-badge">
            <Gamepad2 size={24} />
          </div>
          <div>
            <strong>Oyuncu Kantinim</strong>
            <span>Modern ilan ve mağaza yönetimi</span>
          </div>
        </div>

        <div className="topbar-actions">
          {user ? (
            <>
              <button type="button" className="ghost-button" onClick={() => setListingModal({})}>
                <Plus size={16} />
                Yeni ilan
              </button>
              <button type="button" className="ghost-button" onClick={() => setProfileOpen(true)}>
                <User size={16} />
                {user.avatar} {user.username}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  applyUser(null);
                  setMyListings([]);
                  showToast('Oturum kapatıldı.');
                }}
              >
                <LogOut size={16} />
                Çıkış
              </button>
            </>
          ) : (
            <>
              <button type="button" className="ghost-button" onClick={() => setAuthMode('login')}>
                Giriş Yap
              </button>
              <button type="button" className="primary-button" onClick={() => setAuthMode('register')}>
                Hesap Aç
              </button>
            </>
          )}
        </div>
      </header>

      <main className="content-grid">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">
              <ShieldCheck size={16} /> Güvenlik ve düzenleme turu başladı
            </span>
            <h1>Dağınık beta yapısını gerçek bir pazar paneline çevirdim.</h1>
            <p>
              Backend artık tekrar eden `case` bloklarından arındı, giriş akışı hash destekli hale geldi ve ilanlar için
              ekle-düzenle-sil akışı tek sözleşmede toplandı.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={() => setListingModal(user ? {} : null)}>
                <Plus size={16} />
                {user ? 'İlan yayınla' : 'Önce giriş yap'}
              </button>
              <button type="button" className="ghost-button" onClick={() => setAuthMode(user ? null : 'login')}>
                <Sparkles size={16} />
                {user ? 'Hazırsın' : 'Oturum aç'}
              </button>
            </div>
          </div>

          <div className="stats-grid">
            {featuredStats.map((item) => (
              <article key={item.label} className="stat-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Pazar filtreleri</h2>
              <p>Arama, oyun bazlı filtre ve sıralama tek yerde.</p>
            </div>
            <div className="panel-icon">
              <Filter size={18} />
            </div>
          </div>
          <div className="filter-grid">
            <label className="search-field">
              <Search size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="İlan, satıcı, oyun ara" />
            </label>
            <label>
              Oyun
              <select value={gameFilter} onChange={(event) => setGameFilter(event.target.value)}>
                <option value="all">Tüm oyunlar</option>
                {GAMES.map((game) => (
                  <option key={game.id} value={game.name}>
                    {game.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Durum
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="active">Yalnızca aktif</option>
                <option value="all">Tümü</option>
                <option value="draft">Taslak</option>
                <option value="sold">Satıldı</option>
              </select>
            </label>
            <label>
              Sıralama
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Oyuncu pazarı</h2>
              <p>{filteredListings.length} ilan gösteriliyor.</p>
            </div>
          </div>
          {loading ? <div className="empty-state">Veriler yükleniyor...</div> : null}
          {!loading && filteredListings.length === 0 ? <div className="empty-state">Filtrene uyan ilan bulunamadı.</div> : null}
          <div className="listing-grid">
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>E-pin vitrini</h2>
              <p>API üzerinden gelen ürünleri sade panelde gösteriyorum.</p>
            </div>
            <div className="panel-icon">
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="epin-grid">
            {epins.map((epin) => (
              <article key={epin.id} className="epin-card">
                <strong>{epin.image_emoji}</strong>
                <div>
                  <h3>{epin.title}</h3>
                  <p>{epin.game_name}</p>
                </div>
                <span>{formatMoney(epin.price)}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Benim ilanlarım</h2>
              <p>Giriş yapınca düzenleme ve silme akışı açılır.</p>
            </div>
            <div className="panel-icon">
              <BadgeTurkishLira size={18} />
            </div>
          </div>
          {!user ? <div className="empty-state">Bu alanı kullanmak için giriş yapmalısın.</div> : null}
          {user && myListings.length === 0 ? <div className="empty-state">Henüz sana ait ilan yok.</div> : null}
          <div className="listing-grid">
            {myListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                editable
                onEdit={(item) => setListingModal(item)}
                onDelete={handleDeleteListing}
              />
            ))}
          </div>
        </section>
      </main>

      {authMode ? <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSubmit={handleAuthSubmit} loading={panelLoading} /> : null}
      {profileOpen && user ? (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)} onSubmit={handleProfileSubmit} loading={panelLoading} />
      ) : null}
      {listingModal && user ? (
        <ListingFormModal
          listing={listingModal.id ? listingModal : null}
          user={user}
          onClose={() => setListingModal(null)}
          onSubmit={handleListingSubmit}
          loading={panelLoading}
        />
      ) : null}
    </div>
  );
}

export default App;
