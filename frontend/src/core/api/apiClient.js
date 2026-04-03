// src/core/api/apiClient.js

import { API } from "config";

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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token })
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
// 🌐 AUTH FETCH
// =========================
export const authFetch = async (endpoint, options = {}) => {

  let token = getToken();

  try {
    let res = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    // =========================
    // 🔄 HANDLE 401 (AUTO REFRESH)
    // =========================
    if (res.status === 401) {

      const newToken = await refreshAccessToken();

      if (!newToken) {
        logout();
        return null;
      }

      // 🔁 RETRY REQUEST
      res = await fetch(`${API}${endpoint}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`
        }
      });
    }

    return res;

  } catch (err) {
    console.warn("API request failed (likely offline):", endpoint);
    throw err;
  }
};
