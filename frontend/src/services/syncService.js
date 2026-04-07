// =========================
// 🔄 SYNC SERVICE (CORE)
// =========================

import { getQueue, getQueueCount, removeById } from "./offlineQueue";

// =========================
// 📡 INTERNAL STATE
// =========================
let listeners = [];
let isSyncing = false;

let syncState = {
  status: navigator.onLine ? "online" : "offline",
  pending: getQueueCount(),
};

// =========================
// 🔔 SUBSCRIBE
// =========================
export const subscribeToSync = (callback) => {
  listeners.push(callback);

  callback(syncState);

  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
};

// =========================
// 📢 NOTIFY
// =========================
const notify = (newState) => {
  syncState = {
    ...syncState,
    ...newState,
  };

  listeners.forEach((cb) => cb(syncState));
};

// =========================
// 📊 UPDATE PENDING
// =========================
export const updatePendingCount = () => {
  notify({ pending: getQueueCount() });
};

// =========================
// 🔐 INJECT TOKEN
// =========================
const injectAuth = (options = {}) => {
  const token = localStorage.getItem("access_token");

  return {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

// =========================
// 🔄 MAIN SYNC FUNCTION
// =========================
export const syncQueue = async () => {
  if (isSyncing) return;
  if (!navigator.onLine) return;

  const queue = getQueue();

  if (!queue.length) {
    notify({ status: "online", pending: 0 });
    return;
  }

  isSyncing = true;

  notify({
    status: "syncing",
    pending: queue.length,
  });

  try {
    for (const item of queue) {
      try {
        const res = await fetch(item.url, injectAuth(item.options));

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        // ✅ remove by ID (safer than shift)
        removeById(item.id);

        notify({
          status: "syncing",
          pending: getQueueCount(),
        });

      } catch (err) {
        console.error("❌ Sync failed for item:", item, err);

        // retry logic
        const retries = (item.retries || 0) + 1;

        if (retries >= 5) {
          console.error("❌ Dropping item after max retries:", item.id);
          removeById(item.id);
        } else {
          item.retries = retries;
        }

        notify({
          status: "error",
          pending: getQueueCount(),
        });

        isSyncing = false;
        return; // stop on first failure (important)
      }
    }

    notify({
      status: "online",
      pending: 0,
    });

  } catch (error) {
    console.error("❌ Sync fatal error:", error);

    notify({
      status: "error",
      pending: getQueueCount(),
    });
  }

  isSyncing = false;
};

// =========================
// 🌐 NETWORK HANDLERS
// =========================
export const handleOnline = () => {
  notify({ status: "online" });
  syncQueue();
};

export const handleOffline = () => {
  notify({ status: "offline" });
};

// =========================
// 🔁 AUTO RETRY LOOP
// =========================
setInterval(() => {
  if (navigator.onLine) {
    syncQueue();
  }
}, 15000);

// =========================
// 🚀 INIT
// =========================
updatePendingCount();