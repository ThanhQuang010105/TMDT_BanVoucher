// ============================================================
// API Helper - Kết nối với Backend NestJS tại localhost:3001
// ============================================================
const API_BASE = 'http://localhost:3001';

// --- Token Management ---
const Auth = {
  getToken: () => localStorage.getItem('access_token'),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  setSession: (token, user) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
  isLoggedIn: () => !!localStorage.getItem('access_token'),
  requireAuth: () => {
    if (!localStorage.getItem('access_token')) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },
};

// --- Core Fetch Wrapper ---
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = Array.isArray(data.message)
      ? data.message.join(', ')
      : (data.message || 'Có lỗi xảy ra');
    throw new Error(msg);
  }
  return data;
}

// --- UI Toast Notification ---
function showToast(message, type = 'success') {
  const existingToast = document.getElementById('toast-notification');
  if (existingToast) existingToast.remove();

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };
  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.className = `fixed top-5 right-5 z-[200] px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all ${colors[type] || colors.success}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
}

// --- Format currency ---
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

// --- Format date ---
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}
