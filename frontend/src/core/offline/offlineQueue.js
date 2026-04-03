const STORAGE_KEY = "offline_sales_queue";

// =========================
// 🔥 GENERATE UNIQUE ID
// =========================
function generateOfflineId() {
  return `OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// =========================
// ADD SALE TO QUEUE
// =========================
export function queueSale(payload) {
  const queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  const newSale = {
    ...payload,
    offline_id: generateOfflineId(),
    synced: false,
    syncing: false,
    created_at: new Date().toISOString()
  };

  queue.push(newSale);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));

  return newSale; // 🔥 IMPORTANT (for receipt)
}


// =========================
// GET ALL SALES
// =========================
export function getQueuedSales() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}


// =========================
// MARK AS SYNCING
// =========================
export function markAsSyncing(offline_id) {
  const queue = getQueuedSales().map(s =>
    s.offline_id === offline_id
      ? { ...s, syncing: true }
      : s
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}


// =========================
// MARK AS SYNCED
// =========================
export function markAsSynced(offline_id) {
  const queue = getQueuedSales().map(s =>
    s.offline_id === offline_id
      ? { ...s, synced: true, syncing: false }
      : s
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}


// =========================
// REMOVE AFTER SYNC (OPTIONAL CLEANUP)
// =========================
export function removeQueuedSale(offline_id) {
  const queue = getQueuedSales().filter(s => s.offline_id !== offline_id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}