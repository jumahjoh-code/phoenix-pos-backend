import { API } from "config";
import { addToQueue } from "./offlineQueue";

// =========================
// 🔐 TOKEN HELPERS
// =========================
const getAccessToken = () => localStorage.getItem("access_token");
const getRefreshToken = () => localStorage.getItem("refresh_token");

const setAccessToken = (token) => {
  localStorage.setItem("access_token", token);
};

const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  window.location.href = "/";
};

// =========================
// 🔄 REFRESH TOKEN
// =========================
let isRefreshing = false;

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    logout();
    return null;
  }

  if (isRefreshing) return null;

  isRefreshing = true;

  try {
    const res = await fetch(
      `${API}/auth/refresh?refresh_token=${refreshToken}`,
      { method: "POST" }
    );

    const data = await res.json();

    if (!res.ok) throw new Error("Refresh failed");

    setAccessToken(data.access_token);
    return data.access_token;

  } catch (err) {
    console.error("REFRESH ERROR:", err.message);
    logout();
    return null;

  } finally {
    isRefreshing = false;
  }
};

// =========================
// 🔥 CORE REQUEST HANDLER
// =========================
async function request(endpoint, options = {}, retry = true) {
  try {
    let token = getAccessToken();

    const makeRequest = async (tokenOverride) => {
      return fetch(`${API}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...(tokenOverride && { Authorization: `Bearer ${tokenOverride}` }),
        },
        ...options,
      });
    };

    let res = await makeRequest(token);

    let data = {};
    try {
      data = await res.json();
    } catch {}

    // =========================
    // 🔁 AUTO REFRESH (SAFE)
    // =========================
    if (res.status === 401 && retry) {
      const newToken = await refreshAccessToken();

      if (!newToken) return;

      res = await makeRequest(newToken);

      try {
        data = await res.json();
      } catch {}
    }

    if (!res.ok) {
      throw new Error(data.detail || "Request failed");
    }

    return data;

  } catch (err) {
    console.error("API ERROR:", err.message);

    // =========================
    // 📴 OFFLINE QUEUE (IMPROVED)
    // =========================
    if (!navigator.onLine && options.method === "POST") {
      console.warn("📴 Offline — saving request");

      let payload = {};
      try {
        payload = JSON.parse(options.body || "{}");
      } catch {}

      // 🔒 Prevent duplicate spam (basic)
      const queueItem = {
        endpoint,
        payload,
        timestamp: Date.now()
      };

      addToQueue(queueItem);

      return { offline: true };
    }

    throw err;
  }
}

// =========================
// 🧠 GENERIC METHODS
// =========================
export const api = {
  get: (url) => request(url),

  post: (url, body) =>
    request(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (url, body) =>
    request(url, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (url) =>
    request(url, {
      method: "DELETE",
    }),
};

// =========================
// 📦 PRODUCTS
// =========================
export const getProducts = () => api.get("/products/");

// =========================
// 💰 SALES
// =========================
export const createSale = (payload) =>
  api.post("/sales/", payload);

// =========================
// 💵 CASH PAYMENT
// =========================
export const payCash = (payload) =>
  api.post("/payments/cash", payload);

// =========================
// 📱 M-PESA
// =========================
export const mpesaCheckout = (payload) =>
  api.post("/payments/mpesa", payload);

// =========================
// 💰 CASH CONTROL
// =========================
export const recordCash = (payload) =>
  api.post("/ledger/cash", payload);

export const getCashData = () =>
  api.get("/ledger/cash");