// src/core/api/apiClient.js

import { getToken, logout } from "../../auth/auth";
import { API } from "config";

// =========================
// 🌐 AUTH FETCH (CORE)
// =========================
export const authFetch = async (endpoint, options = {}) => {

  const token = getToken();

  try {
    const res = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    // 🔐 Auto logout on unauthorized
    if (res.status === 401) {
      logout();
      return null;
    }

    return res;

  } catch (err) {
    console.warn("API request failed (likely offline):", endpoint);
    throw err; // let caller decide (important for offline logic)
  }
};
