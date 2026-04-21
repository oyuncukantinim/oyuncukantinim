const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

function getAdminToken() {
  return localStorage.getItem('admin_token');
}

async function adminRequest(action, { method = 'GET', body = null, query = {} } = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(query).forEach(([k, v]) => v !== undefined && v !== '' && url.searchParams.set(k, v));

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAdminToken()}`,
    },
  };
  if (body && method !== 'GET') options.body = JSON.stringify(body);

  const res = await fetch(url.toString(), options);
  let json;
  try {
    json = await res.json();
  } catch {
    const text = await res.text().catch(() => '');
    throw new Error('Sunucu geçersiz yanıt döndürdü: ' + (text.slice(0, 200) || '(boş)'));
  }
  if (json.status !== 'success') throw new Error(json.message || 'Hata');
  return json;
}

async function adminUploadRequest(action, file) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAdminToken()}`,
    },
    body: formData,
  });

  let json;
  try {
    json = await res.json();
  } catch {
    const text = await res.text().catch(() => '');
    throw new Error('Sunucu gecersiz yanit dondurdu: ' + (text.slice(0, 200) || '(bos)'));
  }
  if (json.status !== 'success') throw new Error(json.message || 'Hata');
  return json;
}

// Auth
export const adminLogin = (email, password) =>
  adminRequest('admin_login', { method: 'POST', body: { email, password } });

// Dashboard
export const adminStats = () => adminRequest('admin_stats');

// Users
export const adminGetUsers = (params = {}) =>
  adminRequest('admin_get_users', { query: params });
export const adminGetUser = (id) =>
  adminRequest('admin_get_user', { query: { id } });
export const adminUpdateUser = (body) =>
  adminRequest('admin_update_user', { method: 'POST', body });

// Support
export const adminGetSupportTickets = (params = {}) =>
  adminRequest('admin_get_support_tickets', { query: params });
export const adminGetSupportTicket = (id) =>
  adminRequest('admin_get_support_ticket', { query: { id } });
export const adminReplySupportTicket = (body) =>
  adminRequest('admin_reply_support_ticket', { method: 'POST', body });
export const adminUpdateSupportTicket = (body) =>
  adminRequest('admin_update_support_ticket', { method: 'POST', body });
export const adminDeleteSupportTicket = (ticket_id) =>
  adminRequest('admin_delete_support_ticket', { method: 'POST', body: { ticket_id } });

// Listings
export const adminGetListings = (params = {}) =>
  adminRequest('admin_get_listings', { query: params });
export const adminUpdateListing = (body) =>
  adminRequest('admin_update_listing', { method: 'POST', body });
export const adminDeleteListing = (listing_id) =>
  adminRequest('admin_delete_listing', { method: 'POST', body: { listing_id } });
export const adminUploadListingImage = (file) =>
  adminUploadRequest('admin_upload_listing_image', file).then((json) => json.data?.url || '');
export const adminDeleteListingImage = (url) =>
  adminRequest('admin_delete_listing_image', { method: 'POST', body: { url } });
export const adminApplyListingDoping = (body) =>
  adminRequest('admin_apply_listing_doping', { method: 'POST', body });
export const adminClearListingDoping = (listing_id, doping_type = null) =>
  adminRequest('admin_clear_listing_doping', { method: 'POST', body: { listing_id, ...(doping_type ? { doping_type } : {}) } });
export const adminGetStocks = (listing_id) =>
  adminRequest('admin_get_stocks', { query: { listing_id } });
export const adminAddStocks = (body) =>
  adminRequest('admin_add_stocks', { method: 'POST', body });
export const adminUpdateStock = (stock_id, content) =>
  adminRequest('admin_update_stock', { method: 'POST', body: { stock_id, content } });
export const adminDeleteStock = (stock_id) =>
  adminRequest('admin_delete_stock', { method: 'POST', body: { stock_id } });

// Orders
export const adminGetOrders = (params = {}) =>
  adminRequest('admin_get_orders', { query: params });
export const adminUpdateOrder = (body) =>
  adminRequest('admin_update_order', { method: 'POST', body });

// Reviews
export const adminGetReviews = (params = {}) =>
  adminRequest('admin_get_reviews', { query: params });
export const adminDeleteReview = (review_id) =>
  adminRequest('admin_delete_review', { method: 'POST', body: { review_id } });

// Categories
export const adminGetCategories = () => adminRequest('admin_get_categories');
export const adminSaveCategory = (body) =>
  adminRequest('admin_save_category', { method: 'POST', body });
export const adminDeleteCategory = (category_id) =>
  adminRequest('admin_delete_category', { method: 'POST', body: { category_id } });

// Category Attributes
export const adminGetCategoryAttributes = (category_id) =>
  adminRequest('admin_get_category_attributes', { query: { category_id } });
export const adminSaveCategoryAttribute = (body) =>
  adminRequest('admin_save_category_attribute', { method: 'POST', body });
export const adminDeleteCategoryAttribute = (attribute_id) =>
  adminRequest('admin_delete_category_attribute', { method: 'POST', body: { attribute_id } });

// Settings
export const adminGetSettings = () => adminRequest('admin_get_settings');
export const adminSaveSettings = (body) =>
  adminRequest('admin_save_settings', { method: 'POST', body });

// Broadcast
export const adminBroadcast = (body) =>
  adminRequest('admin_broadcast', { method: 'POST', body });

// Conversations
export const adminGetConversations = (params = {}) =>
  adminRequest('admin_get_conversations', { query: params });
export const adminGetChat = (uid1, uid2) =>
  adminRequest('admin_get_chat', { query: { uid1, uid2 } });
export const adminSendChat = (uid1, uid2, message) =>
  adminRequest('admin_send_chat', { method: 'POST', body: { uid1, uid2, message } });

// Order Logs
export const adminGetOrderLogs = (order_id) =>
  adminRequest('admin_get_order_logs', { query: { order_id } });

// Financial Transactions
export const adminGetAllTransactions = (params = {}) =>
  adminRequest('admin_get_all_transactions', { query: params });
export const adminGetUserTransactions = (user_id) =>
  adminRequest('admin_get_user_transactions', { query: { user_id } });

// Payment Management
export const adminGetPaymentManagement = (params = {}) =>
  adminRequest('admin_get_payment_management', { query: params });
export const adminUpdatePaymentAccount = (body) =>
  adminRequest('admin_update_payment_account', { method: 'POST', body });
export const adminDeletePaymentAccount = (account_id) =>
  adminRequest('admin_delete_payment_account', { method: 'POST', body: { account_id } });
export const adminUpdateWithdrawal = (body) =>
  adminRequest('admin_update_withdrawal', { method: 'POST', body });

// Admin Logs
export const adminGetLogs = (params = {}) =>
  adminRequest('admin_get_logs', { query: params });
export const adminDeleteLog = (log_id) =>
  adminRequest('admin_delete_log', { method: 'POST', body: { log_id } });

// Store Verification / Badges
export const adminGetStoreManagement = (params = {}) =>
  adminRequest('admin_get_store_management', { query: { ...params, viewer_token: getAdminToken() } });
export const adminSaveStoreBadge = (body) =>
  adminRequest('admin_save_store_badge', { method: 'POST', body });
export const adminDeleteStoreBadge = (badge_id) =>
  adminRequest('admin_delete_store_badge', { method: 'POST', body: { badge_id } });
export const adminUpdateStoreApplication = (body) =>
  adminRequest('admin_update_store_application', { method: 'POST', body });

// Suspicious Accounts
export const adminGetSuspicious = () => adminRequest('admin_get_suspicious');

// IP Blacklist
export const adminGetIpBlacklist = () => adminRequest('admin_get_ip_blacklist');
export const adminAddIpBlacklist = (body) =>
  adminRequest('admin_add_ip_blacklist', { method: 'POST', body });
export const adminRemoveIpBlacklist = (id) =>
  adminRequest('admin_remove_ip_blacklist', { method: 'POST', body: { id } });

// Categories Reorder
export const adminReorderCategories = (orders) =>
  adminRequest('admin_reorder_categories', { method: 'POST', body: { orders } });

// Category Types
export const adminGetCategoryTypes = () => adminRequest('admin_get_category_types');
export const adminSaveCategoryType = (body) =>
  adminRequest('admin_save_category_type', { method: 'POST', body });
export const adminDeleteCategoryType = (type_id) =>
  adminRequest('admin_delete_category_type', { method: 'POST', body: { type_id } });

// Popular Games
export const adminGetPopularGames = () =>
  adminRequest('admin_get_popular_games');
export const adminSavePopularGames = (games) =>
  adminRequest('admin_save_popular_games', { method: 'POST', body: { games } });
export const adminDeleteUploadedImage = (url) =>
  adminRequest('admin_delete_uploaded_image', { method: 'POST', body: { url } });

// Image Upload
export async function adminUploadImage(file, folder = 'misc', options = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', 'admin_upload_image');
  url.searchParams.set('folder', folder);
  if (options.preserveOriginal) {
    url.searchParams.set('preserve_original', '1');
  }

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAdminToken()}` },
    body: formData,
  });
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.message || 'Yükleme hatası');
  return json.data.url;
}
