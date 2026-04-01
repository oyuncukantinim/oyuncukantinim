const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

// /listing/minecraft-hesabi-123 formatında slug üretir
export function listingSlug(title, id) {
  const slug = title
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
    .replace(/Ö/g, 'o').replace(/Ç/g, 'c')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `/listing/${slug}-${id}`;
}

// Slug'dan id'yi çıkarır: "minecraft-hesabi-123" → "123"
export function idFromSlug(slug) {
  return slug.split('-').pop();
}

function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export function getStoredUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user) {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function request(action, options = {}) {
  const { method = 'GET', query = {}, body, auth = false } = options;
  const search = new URLSearchParams({ action, ...query });

  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}?${search.toString()}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({
    status: 'error',
    message: 'Sunucudan gecerli JSON donmedi.',
  }));

  if (!response.ok || data.status !== 'success') {
    throw new Error(data.message || 'API istegi basarisiz oldu.');
  }

  return data;
}

// --- AUTH ---
export function loginUser(payload) {
  return request('login', { method: 'POST', body: payload });
}

export function registerUser(payload) {
  return request('register', { method: 'POST', body: payload });
}

export function getMe() {
  return request('me', { auth: true });
}

// --- PROFILE ---
export function updateProfile(payload) {
  return request('update_profile', { method: 'POST', body: payload, auth: true });
}

// --- PUBLIC CONFIG ---
export function getPublicSettings() {
  return request('get_public_settings');
}

// --- LISTINGS ---
export function getListings(query = {}) {
  return request('get_listings', { query });
}

export function getListing(id) {
  return request('get_listing', { query: { id } });
}

export function getMyListings() {
  return request('get_my_listings', { auth: true });
}

export function getMyListing(id) {
  return request('get_my_listing', { query: { id }, auth: true });
}

export function addListing(payload) {
  return request('add_listing', { method: 'POST', body: payload, auth: true });
}

export function updateListing(payload) {
  return request('update_listing', { method: 'POST', body: payload, auth: true });
}

export function deleteListing(payload) {
  return request('delete_listing', { method: 'POST', body: payload, auth: true });
}

export function appendListingStocks(payload) {
  return request('append_listing_stocks', { method: 'POST', body: payload, auth: true });
}

export function deleteListingStock(stock_id) {
  return request('delete_listing_stock', { method: 'POST', body: { stock_id }, auth: true });
}

// --- EPINS ---
export function getEpins() {
  return request('get_epins');
}

// --- ORDERS ---
export function createOrder(items) {
  return request('create_order', { method: 'POST', body: { items }, auth: true });
}

export function getOrders() {
  return request('get_orders', { auth: true });
}

// --- BALANCE ---
export function addBalance(amount) {
  return request('add_balance', { method: 'POST', body: { amount }, auth: true });
}

// --- MESSAGES ---
export function sendMessage(payload) {
  return request('send_message', { method: 'POST', body: payload, auth: true });
}

export function getMessages(withUser) {
  return request('get_messages', { query: { with_user: withUser }, auth: true });
}

export function getConversations() {
  return request('get_conversations', { auth: true });
}

export function getUnreadCount() {
  return request('unread_count', { auth: true });
}

// --- NOTIFICATIONS ---
export function getNotifications() {
  return request('get_notifications', { auth: true });
}

export function markNotificationsRead() {
  return request('mark_notifications_read', { method: 'POST', auth: true });
}

export function getUnreadNotificationsCount() {
  return request('unread_notifications_count', { auth: true });
}

// --- SELLER PROFILE ---
export function getSellerProfile(username) {
  return request('get_seller_profile', { query: { username } });
}

export function getSellerListings(sellerId) {
  return request('get_seller_listings', { query: { seller_id: sellerId } });
}

export function getSellerReviews(sellerId) {
  return request('get_seller_reviews', { query: { seller_id: sellerId } });
}

export function addReview(payload) {
  return request('add_review', { method: 'POST', body: payload, auth: true });
}

export function followSeller(sellerId) {
  return request('follow_seller', { method: 'POST', body: { seller_id: sellerId }, auth: true });
}

export function unfollowSeller(sellerId) {
  return request('unfollow_seller', { method: 'POST', body: { seller_id: sellerId }, auth: true });
}
