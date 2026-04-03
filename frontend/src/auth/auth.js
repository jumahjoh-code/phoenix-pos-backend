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
// 🔐 AUTH STATUS
// =========================
export const isAuthenticated = () => {
  return !!getToken();
};

// =========================
// 🚪 LOGOUT
// =========================
export const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("access_token");

  // redirect cleanly
  window.location.href = "/login";
};
