export function getStoredAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('admin_user') || '{}');
  } catch {
    return {};
  }
}

export function setStoredAdminUser(user) {
  if (!user) {
    localStorage.removeItem('admin_user');
    return;
  }
  localStorage.setItem('admin_user', JSON.stringify(user));
}

export function hasAdminPermission(permission) {
  const user = getStoredAdminUser();
  const perms = Array.isArray(user?.permissions) ? user.permissions : [];
  return perms.includes('*') || perms.includes(permission);
}

export function getCriticalActions() {
  const user = getStoredAdminUser();
  return user?.critical_actions || {};
}
