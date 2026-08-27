const BASE_URL = "/api";

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Sérialise un objet de paramètres en query string, en ignorant les valeurs vides
// (évite des paramètres du type "region=&date=" qui polluent la clé de cache et
// l'URL sans rien filtrer côté serveur).
function toQueryString(params = {}) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") usp.set(key, String(value));
  }
  return usp.toString();
}

// Pattern double-submit cookie (voir server/src/common/guards/csrf.guard.ts) : le serveur
// pose un cookie csrf_token lisible en JS ; on le renvoie dans un en-tête sur chaque
// requête mutante. On le récupère au premier besoin s'il n'existe pas encore.
async function ensureCsrfToken() {
  const existing = readCookie("csrf_token");
  if (existing) return existing;

  const res = await fetch(`${BASE_URL}/csrf-token`, { credentials: "include" });
  const body = await res.json();
  return body.csrfToken ?? readCookie("csrf_token");
}

async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { "Content-Type": "application/json", ...options.headers };

  if (method !== "GET") {
    headers["X-CSRF-Token"] = await ensureCsrfToken();
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include", // cookies httpOnly de session + csrf_token
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Erreur API (${res.status})`);
  }

  return res.status === 204 ? null : res.json();
}

export const api = {
  me: () => request("/auth/me"),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  resendVerification: (email) =>
    request("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  updateMyAccount: (data) => request("/users/me", { method: "PATCH", body: JSON.stringify(data) }),

  searchTechnicians: (params) => request(`/technicians?${toQueryString(params)}`),
  getTechnician: (id) => request(`/technicians/${id}`),
  getMyTechnicianProfile: () => request("/technicians/profile"),
  updateMyProfile: (data) =>
    request("/technicians/profile", { method: "PATCH", body: JSON.stringify(data) }),

  myAvailabilities: () => request("/technicians/me/availabilities"),
  createAvailability: (data) =>
    request("/technicians/me/availabilities", { method: "POST", body: JSON.stringify(data) }),
  deleteAvailability: (id) =>
    request(`/technicians/me/availabilities/${id}`, { method: "DELETE" }),

  createBooking: (data) => request("/bookings", { method: "POST", body: JSON.stringify(data) }),
  myBookings: (params) => request(`/bookings/me?${toQueryString(params)}`),
  technicianBookings: (params) => request(`/technicians/me/bookings?${toQueryString(params)}`),
  cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: "PATCH" }),

  regions: () => request("/regions"),

  adminTechnicians: (params) => request(`/admin/technicians?${toQueryString(params)}`),
  adminSetTechnicianStatus: (id, status) =>
    request(`/admin/technicians/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
