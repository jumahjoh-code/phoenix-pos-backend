import { API } from "config";
import { addToQueue } from "../../services/offlineQueue";
import { updatePendingCount } from "../../services/syncService";

// =========================
// 🔐 TOKEN HELPERS
// =========================
export const getToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

export const logout = () => {
  localStorage.clear();
  window.location.reload();
};

// =========================
// 🔄 REFRESH TOKEN
// =========================
const refreshAccessToken = async () => {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return null;

  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);

    return data.access_token;
  } catch (err) {
    console.error("Refresh failed:", err);
    return null;
  }
};

// =========================
// 📦 QUEUE HELPER
// =========================
const queueRequest = (endpoint, options) => {
  addToQueue({
    url: `${API}${endpoint}`,
    options: {
      ...options,
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    },
  });

  updatePendingCount();
};

// =========================
// 🌐 AUTH FETCH (FINAL)
// =========================
export const authFetch = async (endpoint, options = {}) => {
  let token = getToken();

  try {
    let res = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    // 🔄 HANDLE 401 (AUTO REFRESH)
    if (res.status === 401) {
      const newToken = await refreshAccessToken();

      if (!newToken) {
        logout();
        return {
          ok: false,
          error: "Session expired",
          status: 401,
        };
      }

      res = await fetch(`${API}${endpoint}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
        },
      });
    }

    // ✅ SAFE PARSE
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    // ❌ HANDLE API ERRORS
    if (!res.ok) {
      return {
        ok: false,
        error: data?.detail || "Request failed",
        status: res.status,
      };
    }

    // ✅ SUCCESS
    return {
      ok: true,
      data,
      status: res.status,
    };
  } catch (err) {
    console.warn("⚠️ API failed → queued:", endpoint);

    // 📥 OFFLINE FALLBACK
    queueRequest(endpoint, options);

    return {
      ok: true,
      offline: true,
      data: {
        message: "Saved offline. Will sync automatically.",
      },
    };
  }
};