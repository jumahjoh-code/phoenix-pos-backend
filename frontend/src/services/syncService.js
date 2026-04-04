// =========================
// 🔄 SYNC SERVICE (CORE)
// =========================

import { getQueue, getQueueCount } from "./offlineQueue";

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

  // send current state immediately
  callback(syncState);

  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
};

// =========================
// 📢 NOTIFY ALL LISTENERS
// =========================
const notify = (newState) => {
  syncState = {
    ...syncState,
    ...newState,
  };

  listeners.forEach((cb) => cb(syncState));
};

// =========================
// 📊 UPDATE PENDING COUNT
// =========================
export const updatePendingCount = () => {
  notify({
    pending: getQueueCount(),
  });
};

// =========================
// 🔄 MAIN SYNC FUNCTION
// =========================
export const syncQueue = async () => {
  if (isSyncing) return;

  let queue = getQueue();
  if (!queue.length) {
    notify({ status: "online", pending: 0 });
    return;
  }

  isSyncing = true;
  notify({ status: "syncing", pending: queue.length });

  try {
    while (queue.length > 0) {
      const item = queue[0];

      try {
        const res = await fetch(item.url, item.options);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        // ✅ remove ONLY the processed item
        queue.shift();
        localStorage.setItem("offline_queue", JSON.stringify(queue));

        notify({
          status: "syncing",
          pending: queue.length,
        });

      } catch (err) {
        console.error("❌ Failed item:", item, err);

        // stop sync — keep remaining items
        notify({
          status: "error",
          pending: queue.length,
        });

        isSyncing = false;
        return;
      }
    }

    notify({
      status: "online",
      pending: 0,
    });

  } catch (error) {
    console.error("❌ Sync failed:", error);

    notify({
      status: "error",
      pending: getQueueCount(),
    });
  }

  isSyncing = false;
};

// =========================
// 🌐 NETWORK STATE HANDLERS
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
// 🚀 INITIAL LOAD
// =========================
updatePendingCount();