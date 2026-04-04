// =========================
// 🌐 NETWORK SERVICE
// =========================

import { handleOnline, handleOffline, updatePendingCount } from "./syncService";

// =========================
// 📡 INTERNAL STATE
// =========================
let lastOnlineTrigger = 0;
const ONLINE_DEBOUNCE = 3000; // 3 seconds

// =========================
// 🚀 INITIAL STATE CHECK
// =========================
const initNetworkState = () => {
  if (navigator.onLine) {
    handleOnline();
  } else {
    handleOffline();
  }

  updatePendingCount();
};

// =========================
// 🌐 SAFE ONLINE HANDLER
// =========================
const safeHandleOnline = () => {
  const now = Date.now();

  // prevent rapid repeated triggers
  if (now - lastOnlineTrigger < ONLINE_DEBOUNCE) {
    return;
  }

  lastOnlineTrigger = now;

  console.log("🌐 Back Online (debounced)");
  handleOnline();
};

// =========================
// 📡 EVENT LISTENERS
// =========================
const registerNetworkListeners = () => {
  window.addEventListener("online", safeHandleOnline);

  window.addEventListener("offline", () => {
    console.log("📴 Went Offline");
    handleOffline();
  });
};

// =========================
// 🔁 VISIBILITY CHANGE (SMART SYNC)
// =========================
const registerVisibilityListener = () => {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      console.log("👀 App visible → checking sync");
      safeHandleOnline();
    }
  });
};

// =========================
// 🧠 INIT (RUN ON IMPORT)
// =========================
initNetworkState();
registerNetworkListeners();
registerVisibilityListener();