const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';
const PUBLIC_CACHE_PREFIX = 'ok_public_api_v2:';
const memoryCache = new Map();
const pendingRequests = new Map();

function buildSearch(action, query = {}) {
  const search = new URLSearchParams();
  search.set('action', action);
  Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      search.set(key, String(value));
    });
  return search;
}

function readCached(cacheKey, ttl) {
  if (!ttl || ttl <= 0) return null;

  const now = Date.now();
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry) {
    if (now - memoryEntry.ts < ttl) return memoryEntry.data;
    memoryCache.delete(cacheKey);
  }

  try {
    const raw = typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(`${PUBLIC_CACHE_PREFIX}${cacheKey}`)
      : null;
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.ts !== 'number') return null;
    if (now - entry.ts >= ttl) {
      sessionStorage.removeItem(`${PUBLIC_CACHE_PREFIX}${cacheKey}`);
      return null;
    }
    memoryCache.set(cacheKey, { ts: entry.ts, data: entry.data });
    return entry.data;
  } catch {
    return null;
  }
}

function writeCached(cacheKey, data) {
  const entry = { ts: Date.now(), data };
  memoryCache.set(cacheKey, entry);
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`${PUBLIC_CACHE_PREFIX}${cacheKey}`, JSON.stringify(entry));
    }
  } catch {
    // Storage can be full or disabled. Memory cache still covers this tab.
  }
}

export function invalidatePublicCache(actions = []) {
  if (!Array.isArray(actions) || actions.length === 0) return;
  const prefixes = actions.map((action) => `action=${action}`);

  for (const key of Array.from(memoryCache.keys())) {
    if (prefixes.some((prefix) => key.includes(prefix))) memoryCache.delete(key);
  }

  for (const key of Array.from(pendingRequests.keys())) {
    if (prefixes.some((prefix) => key.includes(prefix))) pendingRequests.delete(key);
  }

  try {
    if (typeof sessionStorage === 'undefined') return;
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (!key || !key.startsWith(PUBLIC_CACHE_PREFIX)) continue;
      if (prefixes.some((prefix) => key.includes(prefix))) sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors.
  }
}

function makeSlug(title) {
  return String(title || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function productPath(product) {
  const id = product?.id ?? product?.product_id;
  const rawPath = String(product?.product_path || '').trim();
  const rawSlug = id ? rawPath.replace(new RegExp(`-${id}$`), '') : rawPath;
  const slug = makeSlug(rawSlug || product?.slug || product?.title || 'product') || 'product';
  return `/product/${slug}-${id}`;
}

// /listing/minecraft-hesabi-123 formatında slug üretir
export function listingSlug(title, id) {
  const slug = makeSlug(title) || 'listing';
  return `/listing/${slug}-${id}`;
}

export function productSlug(title, id) {
  const slug = makeSlug(title) || 'product';
  return `/product/${slug}-${id}`;
}

// Slug'dan id'yi çıkarır: "minecraft-hesabi-123" -> "123"
export function idFromSlug(slug) {
  return slug.split('-').pop();
}

async function request(action, options = {}) {
  // Use the browser's standard HTTP cache by default — honors Cache-Control
  // from the PHP API. Fast cache hits (0 ms) for unchanged data, revalidation
  // when the server says so. If the server doesn't send proper headers, the
  // right fix is on the PHP side (send Cache-Control: no-cache or an ETag),
  // not forcing every request to wait for the network.
  const {
    method = 'GET',
    query = {},
    body,
    auth = false,
    cache,
    ttl = 0,
    invalidateActions = [],
  } = options;
  const search = buildSearch(action, query);
  const cacheKey = search.toString();
  const shouldUsePublicCache = method === 'GET' && !auth && ttl > 0;

  if (shouldUsePublicCache) {
    const cached = readCached(cacheKey, ttl);
    if (cached) return cached;
    const pending = pendingRequests.get(cacheKey);
    if (pending) return pending;
  }

  const headers = { 'Content-Type': 'application/json' };
  const requestCache = cache ?? (auth || method !== 'GET' ? 'no-store' : 'default');

  const doRequest = async () => {
    const fetchOptions = {
      method,
      cache: requestCache,
      credentials: 'include',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };
    const response = await fetch(`${API_URL}?${search.toString()}`, fetchOptions);

    const data = await response.json().catch(() => ({
      status: 'error',
      message: 'Sunucudan gecerli JSON donmedi.',
    }));

    if (!response.ok || data.status !== 'success') {
      throw new Error(data.message || 'API istegi basarisiz oldu.');
    }

    if (shouldUsePublicCache) writeCached(cacheKey, data);
    if (invalidateActions.length > 0) invalidatePublicCache(invalidateActions);
    return data;
  };

  if (!shouldUsePublicCache) {
    return doRequest();
  }

  const requestPromise = doRequest().finally(() => {
    pendingRequests.delete(cacheKey);
  });
  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

// --- AUTH ---
export function loginUser(payload) {
  return request('login', { method: 'POST', body: payload });
}

export function requestPasswordReset(payload) {
  return request('request_password_reset', { method: 'POST', body: payload });
}

export function resetPassword(payload) {
  return request('reset_password', { method: 'POST', body: payload });
}

export function registerUser(payload) {
  return request('register', { method: 'POST', body: payload });
}

export function verifyRegistrationCode(payload) {
  return request('verify_registration_code', { method: 'POST', body: payload });
}

export function getMe() {
  return request('me', { auth: true });
}

export function logout() {
  return request('logout', { method: 'POST' });
}

export function getSiteSettings() {
  return request('get_site_settings', { ttl: 60 * 1000 });
}

export function getHeroSlides() {
  return request('get_hero_slides', { ttl: 60 * 1000 });
}

export function getHeroBackgrounds() {
  return request('get_hero_backgrounds', { ttl: 60 * 1000 });
}

export function getContractPages() {
  return request('get_contract_pages', { query: { _t: Date.now() }, cache: 'no-store' });
}

export function getPages() {
  return request('get_pages', { query: { _t: Date.now() }, cache: 'no-store' });
}

export function getPage(slug) {
  return request('get_page', { query: { slug, _t: Date.now() }, cache: 'no-store' });
}

// --- PROFILE ---
export function updateProfile(payload) {
  return request('update_profile', { method: 'POST', body: payload, auth: true });
}

export function getIdentityOverview() {
  return request('get_identity_overview', { auth: true });
}

export async function submitIdentityVerification({ fullName, identityNumber, birthDate, identityImage, selfieImage, userNote = '' }) {
  const formData = new FormData();
  formData.append('full_name', fullName);
  formData.append('identity_number', identityNumber);
  formData.append('birth_date', birthDate);
  formData.append('identity_image', identityImage);
  formData.append('selfie_image', selfieImage);
  formData.append('user_note', userNote);

  const response = await fetch(`${API_URL}?action=submit_identity_verification`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await response.json().catch(() => ({
    status: 'error',
    message: 'Sunucudan gecerli JSON donmedi.',
  }));

  if (!response.ok || data.status !== 'success') {
    throw new Error(data.message || 'Kimlik doğrulama başvurusu gönderilemedi.');
  }

  return data;
}

async function uploadProfileMedia(file, type) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}?action=${type === 'avatar' ? 'upload_profile_avatar' : 'upload_profile_banner'}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await response.json().catch(() => ({
    status: 'error',
    message: 'Sunucudan gecerli JSON donmedi.',
  }));

  if (!response.ok || data.status !== 'success') {
    throw new Error(data.message || 'Profil gorseli yuklenemedi.');
  }

  return data.data?.url || '';
}

export function uploadProfileAvatar(file) {
  return uploadProfileMedia(file, 'avatar');
}

export function uploadProfileBanner(file) {
  return uploadProfileMedia(file, 'banner');
}

export function deleteProfileMedia(url, type) {
  return request('delete_profile_media', {
    method: 'POST',
    body: { url, type },
    auth: true,
  });
}

export function sendProfileEmailVerification(payload) {
  return request('send_profile_email_verification', { method: 'POST', body: payload, auth: true });
}

export function verifyProfileEmailCode(payload) {
  return request('verify_profile_email_code', { method: 'POST', body: payload, auth: true });
}

export function getStoreApplicationOverview() {
  return request('get_store_application_overview', { auth: true });
}

export function submitStoreApplication(userNote = '') {
  return request('submit_store_application', {
    method: 'POST',
    body: { user_note: userNote },
    auth: true,
  });
}

// --- LISTINGS ---
export function getListings(query = {}) {
  return request('get_listings', { query, ttl: 60 * 1000 });
}

export function getProducts(query = {}) {
  return request('get_products', { query, ttl: 60 * 1000 });
}

export function getHomePageData() {
  return request('get_home_page_data', { ttl: 60 * 1000 });
}

export function getCategories() {
  return request('get_categories_tree', { ttl: 60 * 1000 });
}

export function getPopularGames() {
  return request('get_popular_games', { ttl: 60 * 1000 });
}

export function getCategoryAttributes(categoryId) {
  return request('get_category_attributes', {
    query: { category_id: categoryId },
    ttl: 60 * 1000,
  });
}

export function getListing(id) {
  return request('get_listing', { query: { id }, ttl: 60 * 1000 });
}

export function getProduct(id) {
  return request('get_product', { query: { id }, ttl: 60 * 1000 });
}

export function getMyListings() {
  return request('get_my_listings', { auth: true });
}

export function getProductOrderLogs(orderItemId) {
  return request('get_product_order_logs', {
    auth: true,
    query: { order_item_id: orderItemId },
  });
}

export function addListing(payload) {
  return request('add_listing', {
    method: 'POST',
    body: payload,
    auth: true,
    invalidateActions: ['get_listings', 'get_listing', 'get_my_listings'],
  });
}

export function updateListing(payload) {
  return request('update_listing', {
    method: 'POST',
    body: payload,
    auth: true,
    invalidateActions: ['get_listings', 'get_listing', 'get_my_listings', 'get_seller_listings'],
  });
}

export async function uploadListingImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}?action=upload_listing_image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await response.json().catch(() => ({
    status: 'error',
    message: 'Sunucudan gecerli JSON donmedi.',
  }));

  if (!response.ok || data.status !== 'success') {
    throw new Error(data.message || 'Gorsel yukleme basarisiz oldu.');
  }

  return data.data?.url || '';
}

export function deleteListingImage(url) {
  return request('delete_listing_image', {
    method: 'POST',
    body: { url },
    auth: true,
  });
}

export function deleteListing(payload) {
  return request('delete_listing', {
    method: 'POST',
    body: payload,
    auth: true,
    invalidateActions: ['get_listings', 'get_listing', 'get_my_listings', 'get_seller_listings'],
  });
}

export function applyListingDoping(payload) {
  return request('apply_listing_doping', {
    method: 'POST',
    body: payload,
    auth: true,
    invalidateActions: ['get_listings', 'get_listing', 'get_my_listings'],
  });
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

export function getBalanceCoupons() {
  return request('get_balance_coupons', { auth: true });
}

export function createBalanceCoupon(payload) {
  return request('create_balance_coupon', { method: 'POST', body: payload, auth: true });
}

export function redeemBalanceCoupon(code) {
  return request('redeem_balance_coupon', { method: 'POST', body: { code }, auth: true });
}

export function cancelBalanceCoupon(couponId) {
  return request('cancel_balance_coupon', { method: 'POST', body: { coupon_id: couponId }, auth: true });
}

export function getPaymentOverview(query = {}) {
  return request('get_payment_overview', { query, auth: true });
}

export function addPaymentAccount(payload) {
  return request('add_payment_account', { method: 'POST', body: payload, auth: true });
}

export function deletePaymentAccount(accountId) {
  return request('delete_payment_account', {
    method: 'POST',
    body: { account_id: accountId },
    auth: true,
  });
}

export function createWithdrawalRequest(payload) {
  return request('create_withdrawal_request', { method: 'POST', body: payload, auth: true });
}

export function cancelWithdrawalRequest(withdrawalId) {
  return request('cancel_withdrawal_request', {
    method: 'POST',
    body: { withdrawal_id: withdrawalId },
    auth: true,
  });
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

export function deleteNotification(id) {
  return request('delete_notification', { method: 'POST', body: { id }, auth: true });
}

export function clearNotifications() {
  return request('clear_notifications', { method: 'POST', auth: true });
}

export function getUnreadNotificationsCount() {
  return request('unread_notifications_count', { auth: true });
}

// --- SUPPORT ---
export function getSupportMeta() {
  return request('get_support_meta', { auth: true });
}

export function createSupportTicket(payload) {
  return request('create_support_ticket', { method: 'POST', body: payload, auth: true });
}

export function getMySupportTickets() {
  return request('get_my_support_tickets', { auth: true });
}

export function getSupportTicket(id) {
  return request('get_support_ticket', { query: { id }, auth: true });
}

export function replySupportTicket(payload) {
  return request('reply_support_ticket', { method: 'POST', body: payload, auth: true });
}

export function closeSupportTicket(ticketId) {
  return request('close_support_ticket', { method: 'POST', body: { ticket_id: ticketId }, auth: true });
}

// --- SELLER PROFILE ---
export function getSellerProfile(username) {
  return request('get_seller_profile', { query: { username }, auth: true });
}

export function getSellerListings(sellerId) {
  return request('get_seller_listings', { query: { seller_id: sellerId }, ttl: 20 * 1000 });
}

export function getSellerReviews(sellerId, params = {}) {
  return request('get_seller_reviews', { query: { seller_id: sellerId, ...params }, ttl: 20 * 1000 });
}

export function getSellerFollowers(sellerId) {
  return request('get_seller_followers', { query: { seller_id: sellerId }, ttl: 20 * 1000 });
}

export function getSellerFollowing(sellerId) {
  return request('get_seller_following', { query: { seller_id: sellerId }, ttl: 20 * 1000 });
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

// --- FAVORITES ---
export function toggleFavorite(listingId) {
  return request('toggle_favorite', { method: 'POST', body: { listing_id: listingId }, auth: true });
}

export function checkFavorite(listingId) {
  return request('check_favorite', { query: { listing_id: listingId }, auth: true });
}

export function getFavorites() {
  return request('get_favorites', { auth: true });
}

export function getListingPriceHistory(listingId) {
  return request('get_listing_price_history', { query: { listing_id: listingId } });
}

// --- FINANCIAL TRANSACTIONS ---
export function getMyTransactions(type = 'all', query = {}) {
  return request('get_my_transactions', { query: { type, ...query }, auth: true });
}

// --- SHARED ORDERS (for messages) ---
export function getSharedOrders(otherUserId) {
  return request('get_shared_orders', { query: { other_user_id: otherUserId }, auth: true });
}
