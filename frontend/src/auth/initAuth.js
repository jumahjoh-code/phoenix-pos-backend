// src/auth/initAuth.js

import { getToken, getUser, logout, isTokenExpired } from "./auth";
import { API } from "config";

export const initAuth = async () => {

  const token = getToken();
  const user = getUser();

  // 🚫 No session at all
  if (!token || !user) {
    return null;
  }

  // ⛔ Token expired → logout
  if (isTokenExpired()) {
    logout();
    return null;
  }

  // 🌐 If ONLINE → validate with backend
  if (navigator.onLine) {
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        logout();
        return null;
      }

      const freshUser = await res.json();

      // 🔄 Sync latest user data
      localStorage.setItem("user", JSON.stringify(freshUser));

      return freshUser;

    } catch (err) {
      console.warn("Auth validation failed, falling back to offline:", err);

      // 📴 fallback to offline mode
      return user;
    }
  }

  // 📴 OFFLINE → trust local session
  return user;
};
