// ============================================================
// API Helper - Kết nối với Backend NestJS tại localhost:3001
// ============================================================
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : 'https://da-tmdt-ban-voucher-backend.onrender.com'; // Thay thế bằng URL Backend của bạn trên Render khi deploy

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

const VOUCHER_IMAGE_FALLBACKS = {
  movie: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
  shopping: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
};

function getVoucherImage(voucher = {}, index = 0) {
  if (voucher.link_voucher_banner && /^https?:\/\//.test(voucher.link_voucher_banner)) {
    return voucher.link_voucher_banner;
  }

  const text = [
    voucher.ten_voucher,
    voucher.doi_tac?.ten_doanh_nghiep,
    voucher.danh_muc?.ten_taxon,
  ].filter(Boolean).join(' ').toLowerCase();

  if (text.includes('cgv') || text.includes('phim') || text.includes('cinema')) return VOUCHER_IMAGE_FALLBACKS.movie;
  if (text.includes('coffee') || text.includes('cafe') || text.includes('cà phê') || text.includes('starbucks') || text.includes('highlands')) return VOUCHER_IMAGE_FALLBACKS.coffee;
  if (text.includes('spa') || text.includes('massage')) return VOUCHER_IMAGE_FALLBACKS.spa;
  if (text.includes('ăn') || text.includes('food') || text.includes('restaurant') || text.includes('nhà hàng')) return VOUCHER_IMAGE_FALLBACKS.food;

  const fallbackList = Object.values(VOUCHER_IMAGE_FALLBACKS);
  return fallbackList[index % fallbackList.length];
}

function handleVoucherImageError(img, voucherName = '') {
  const text = String(voucherName).toLowerCase();
  img.onerror = null;
  img.src = getVoucherImage({ ten_voucher: text });
}
