const API_URL = 'https://api.oyuncukantinim.com.tr/api.php';

async function request(action, options = {}) {
  const { method = 'GET', query = {}, body } = options;
  const search = new URLSearchParams({ action, ...query });
  const response = await fetch(`${API_URL}?${search.toString()}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({
    status: 'error',
    message: 'Sunucudan geçerli JSON dönmedi.',
  }));

  if (!response.ok || data.status !== 'success') {
    throw new Error(data.message || 'API isteği başarısız oldu.');
  }

  return data;
}

export function getListings(query = {}) {
  return request('get_listings', { query });
}

export function getMyListings(userId) {
  return request('get_my_listings', { query: { user_id: userId } });
}

export function getEpins() {
  return request('get_epins');
}

export function loginUser(payload) {
  return request('login', { method: 'POST', body: payload });
}

export function registerUser(payload) {
  return request('register', { method: 'POST', body: payload });
}

export function updateProfile(payload) {
  return request('update_profile', { method: 'POST', body: payload });
}

export function addListing(payload) {
  return request('add_listing', { method: 'POST', body: payload });
}

export function updateListing(payload) {
  return request('update_listing', { method: 'POST', body: payload });
}

export function deleteListing(payload) {
  return request('delete_listing', { method: 'POST', body: payload });
}
