import { invalidatePublicCache } from './api';

const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';
const HOME_DATA_ACTION = 'get_home_page_data';

const PUBLIC_CACHE_INVALIDATION = {
  admin_update_listing: ['get_listings', 'get_listing', 'get_seller_listings', HOME_DATA_ACTION],
  admin_delete_listing: ['get_listings', 'get_listing', 'get_seller_listings', HOME_DATA_ACTION],
  admin_delete_listing_image: ['get_listings', 'get_listing', 'get_seller_listings', HOME_DATA_ACTION],
  admin_apply_listing_doping: ['get_listings', 'get_listing', 'get_seller_listings', HOME_DATA_ACTION],
  admin_clear_listing_doping: ['get_listings', 'get_listing', 'get_seller_listings', HOME_DATA_ACTION],
  admin_add_stocks: ['get_listings', 'get_listing', 'get_seller_listings', HOME_DATA_ACTION],
  admin_update_stock: ['get_listings', 'get_listing', 'get_seller_listings', HOME_DATA_ACTION],
  admin_delete_stock: ['get_listings', 'get_listing', 'get_seller_listings', HOME_DATA_ACTION],
  admin_update_user: ['get_listings', 'get_listing', 'get_seller_listings', 'get_seller_reviews', HOME_DATA_ACTION],
  admin_delete_user_media: ['get_listings', 'get_listing', 'get_seller_listings', 'get_seller_reviews', HOME_DATA_ACTION],
  admin_upload_user_media: ['get_listings', 'get_listing', 'get_seller_listings', 'get_seller_reviews', HOME_DATA_ACTION],

  admin_save_product: ['get_products', 'get_product', HOME_DATA_ACTION],
  admin_delete_product: ['get_products', 'get_product', HOME_DATA_ACTION],
  admin_update_product_order: ['get_products', 'get_product', HOME_DATA_ACTION],

  admin_save_category: ['get_categories_tree', 'get_category_attributes', 'get_listings', 'get_listing', 'get_products', 'get_product', 'get_popular_games', HOME_DATA_ACTION],
  admin_delete_category: ['get_categories_tree', 'get_category_attributes', 'get_listings', 'get_listing', 'get_products', 'get_product', 'get_popular_games', HOME_DATA_ACTION],
  admin_reorder_categories: ['get_categories_tree', 'get_popular_games', HOME_DATA_ACTION],
  admin_save_category_attribute: ['get_category_attributes'],
  admin_delete_category_attribute: ['get_category_attributes'],
  admin_save_category_type: ['get_categories_tree'],
  admin_delete_category_type: ['get_categories_tree'],

  admin_save_settings: ['get_site_settings', HOME_DATA_ACTION],
  admin_save_page: ['get_contract_pages', 'get_pages', 'get_page'],
  admin_delete_page: ['get_contract_pages', 'get_pages', 'get_page'],
  admin_upload_page_image: [],
  admin_delete_page_image: ['get_page'],
  admin_save_popular_games: ['get_popular_games', 'get_categories_tree', HOME_DATA_ACTION],
  admin_save_hero_slides: ['get_hero_slides'],
  admin_save_hero_backgrounds: ['get_hero_backgrounds'],
  admin_delete_uploaded_image: ['get_site_settings', 'get_hero_slides', 'get_hero_backgrounds', 'get_categories_tree', 'get_products', 'get_product', HOME_DATA_ACTION],
  admin_save_store_badge: ['get_listing'],
  admin_delete_store_badge: ['get_listing'],
  admin_reorder_store_badges: ['get_listing'],
};

function invalidateAfterAdminAction(action, extraActions = []) {
  const actions = [
    ...(PUBLIC_CACHE_INVALIDATION[action] || []),
    ...(Array.isArray(extraActions) ? extraActions : []),
  ];
  invalidatePublicCache([...new Set(actions)]);
}

async function adminRequest(action, { method = 'GET', body = null, query = {}, cache = 'default', invalidateActions = [] } = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(query).forEach(([k, v]) => v !== undefined && v !== '' && url.searchParams.set(k, v));

  const options = {
    method,
    cache,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
  if (method !== 'GET') invalidateAfterAdminAction(action, invalidateActions);
  return json;
}

async function adminUploadRequest(action, file, fields = {}, invalidateActions = []) {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);

  const formData = new FormData();
  formData.append('image', file);
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });

  const res = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'include',
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
  invalidateAfterAdminAction(action, invalidateActions);
  return json;
}

// Auth
export const adminLogin = (email, password) =>
  adminRequest('admin_login', { method: 'POST', body: { email, password } });
export const adminMe = () => adminRequest('admin_me');
export const adminLogout = () => adminRequest('admin_logout', { method: 'POST' });

// Dashboard
export const adminStats = () => adminRequest('admin_stats');

// Users
export const adminGetUsers = (params = {}) =>
  adminRequest('admin_get_users', { query: params });
export const adminGetUser = (id) =>
  adminRequest('admin_get_user', { query: { id } });
export const adminUpdateUser = (body) =>
  adminRequest('admin_update_user', { method: 'POST', body });
export const adminDeleteUserMedia = (user_id, type) =>
  adminRequest('admin_delete_user_media', { method: 'POST', body: { user_id, type } });
export const adminUploadUserMedia = (user_id, type, file) =>
  adminUploadRequest('admin_upload_user_media', file, { user_id, type }).then((json) => json.data?.url || '');
export const adminUpdateIdentityVerification = (body) =>
  adminRequest('admin_update_identity_verification', { method: 'POST', body });
export const adminGetIdentityVerificationImageBase64 = (id, type) =>
  adminRequest('admin_get_identity_verification_image_base64', { query: { id, type } });

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
export const adminGetProductOrders = (params = {}) =>
  adminRequest('admin_get_product_orders', { query: params });
export const adminGetProductOrderLogs = (order_item_id) =>
  adminRequest('admin_get_product_order_logs', { query: { order_item_id } });
export const adminUpdateProductOrder = (body) =>
  adminRequest('admin_update_product_order', { method: 'POST', body });

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

// Products
export const adminGetProducts = (params = {}) =>
  adminRequest('admin_get_products', { query: params });
export const adminSaveProduct = (body) =>
  adminRequest('admin_save_product', { method: 'POST', body });
export const adminDeleteProduct = (product_id) =>
  adminRequest('admin_delete_product', { method: 'POST', body: { product_id } });

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

// Pages
export const adminGetPages = (params = {}) =>
  adminRequest('admin_get_pages', { query: { ...params, _t: Date.now() }, cache: 'no-store' });
export const adminGetPage = (id) =>
  adminRequest('admin_get_page', { query: { id, _t: Date.now() }, cache: 'no-store' });
export const adminSavePage = (body) =>
  adminRequest('admin_save_page', { method: 'POST', body, invalidateActions: ['get_contract_pages', 'get_pages', 'get_page'] });
export const adminDeletePage = (id) =>
  adminRequest('admin_delete_page', { method: 'POST', body: { id }, invalidateActions: ['get_contract_pages', 'get_pages', 'get_page'] });
export const adminDeletePageImage = (url, pageId = 0) =>
  adminRequest('admin_delete_page_image', { method: 'POST', body: { url, page_id: pageId }, invalidateActions: ['get_page'] });
export const adminUploadPageImage = (file) =>
  adminUploadRequest('admin_upload_page_image', file, {}, ['get_page']).then((json) => json.data?.url || '');

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
export const adminGetBalanceCoupons = (params = {}) =>
  adminRequest('admin_get_balance_coupons', { query: params });
export const adminCreateBalanceCoupon = (body) =>
  adminRequest('admin_create_balance_coupon', { method: 'POST', body });
export const adminCancelBalanceCoupon = (coupon_id) =>
  adminRequest('admin_cancel_balance_coupon', { method: 'POST', body: { coupon_id } });

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
export const adminDeleteLogs = (log_ids) =>
  adminRequest('admin_delete_logs', { method: 'POST', body: { log_ids } });

// XP Management
export const adminGetXpSettings = () =>
  adminRequest('admin_get_xp_settings');
export const adminSaveXpSettings = (body) =>
  adminRequest('admin_save_xp_settings', { method: 'POST', body });

// Store Verification / Badges
export const adminGetStoreManagement = (params = {}) =>
  adminRequest('admin_get_store_management', { query: params });
export const adminSaveStoreBadge = (body) =>
  adminRequest('admin_save_store_badge', { method: 'POST', body });
export const adminDeleteStoreBadge = (badge_id) =>
  adminRequest('admin_delete_store_badge', { method: 'POST', body: { badge_id } });
export const adminReorderStoreBadges = (badge_ids) =>
  adminRequest('admin_reorder_store_badges', { method: 'POST', body: { badge_ids } });
export const adminUpdateStoreApplication = (body) =>
  adminRequest('admin_update_store_application', { method: 'POST', body });
export const adminSaveStoreCriteriaSettings = (body) =>
  adminRequest('admin_save_store_criteria_settings', { method: 'POST', body });
export const adminGetStoreVerificationImageBase64 = (id, type) =>
  adminRequest('admin_get_store_verification_image_base64', { query: { id, type } });

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

// Hero Slider
export const adminGetHeroSlides = () =>
  adminRequest('admin_get_hero_slides', { query: { _t: Date.now() }, cache: 'no-store' });
export const adminSaveHeroSlides = (slides) =>
  adminRequest('admin_save_hero_slides', { method: 'POST', body: { slides } });
export const adminGetHeroBackgrounds = () =>
  adminRequest('admin_get_hero_backgrounds', { query: { _t: Date.now() }, cache: 'no-store' });
export const adminSaveHeroBackgrounds = (backgrounds) =>
  adminRequest('admin_save_hero_backgrounds', { method: 'POST', body: { backgrounds } });
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
  if (options.variant) {
    url.searchParams.set('variant', options.variant);
  }

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.message || 'Yükleme hatası');
  return json.data.url;
}
