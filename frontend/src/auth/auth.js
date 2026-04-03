// src/auth/auth.js

// =========================
// 👤 GET USER
// =========================
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

// =========================
// 🔑 GET TOKEN
// =========================
export const getToken = () => {
  return localStorage.getItem("access_token");
};

// =========================
// 🎭 ROLE HELPERS
// =========================
export const getRole = () => {
  const user = getUser();
  return user?.role || null;
};

export const isAdmin = () => getRole() === "admin";
export const isCashier = () => getRole() === "cashier";

// =========================
// 🔐 TOKEN EXPIRY CHECK (🔥 FIX)
// =========================
export const isTokenExpired = () => {
  const token = getToken();

  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    const expiry = payload.exp * 1000; // seconds → ms

    return Date.now() > expiry;

  } catch {
    return true;
  }
};

// =========================
// 🔐 AUTH STATUS
// =========================
export const isAuthenticated = () => {
  const token = getToken();

  if (!token) return false;

  return !isTokenExpired(); // ✅ smarter check
};

// =========================
// 🚪 LOGOUT
// =========================
export const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token"); // 🔥 important

  window.location.href = "/login";
};
