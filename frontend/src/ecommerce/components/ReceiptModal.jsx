// =========================
// 🌍 API CONFIG (PRODUCTION READY)
// =========================

const API =
  process.env.REACT_APP_API_URL ||
  "https://phoenix-pos-backend-3.onrender.com/api";

// 🔍 DEBUG (only in development)
if (process.env.NODE_ENV === "development") {
  console.log("🌍 API:", API);
}

export { API };