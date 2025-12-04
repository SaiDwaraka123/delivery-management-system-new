// frontend/src/auth.js

export function saveUser(user) {
  localStorage.setItem('dms_user', JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem('dms_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem('dms_user');
}
