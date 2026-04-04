// =========================
// 🧠 STORAGE KEY
// =========================
const QUEUE_KEY = "offline_queue";

// =========================
// 📦 GET QUEUE
// =========================
export const getQueue = () => {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Failed to parse queue:", err);
    return [];
  }
};

// =========================
// 📊 GET QUEUE COUNT ✅ (FIX)
// =========================
export const getQueueCount = () => {
  return getQueue().length;
};

// =========================
// 💾 SAVE QUEUE
// =========================
const saveQueue = (queue) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

// =========================
// ➕ ADD TO QUEUE
// =========================
export const addToQueue = (item) => {
  const queue = getQueue();

  queue.push({
    ...item,
    timestamp: Date.now(), // useful for debugging / ordering
  });

  saveQueue(queue);
};

// =========================
// ❌ REMOVE FIRST ITEM
// =========================
export const removeFirstItem = () => {
  const queue = getQueue();
  queue.shift();
  saveQueue(queue);
};

// =========================
// 🧹 CLEAR QUEUE
// =========================
export const clearQueue = () => {
  localStorage.removeItem(QUEUE_KEY);
};

// =========================
// 🔄 PROCESS QUEUE (OPTIONAL LEGACY)
// =========================
// NOTE: Your system mainly uses syncService,
// but keeping this for flexibility/testing
export const processQueue = async () => {
  const queue = getQueue();

  if (!queue.length) return;

  const remaining = [];

  for (const item of queue) {
    try {
      await fetch(item.url, item.options);
    } catch (err) {
      console.error("Queue retry failed:", err);
      remaining.push(item); // keep failed ones
    }
  }

  saveQueue(remaining);
};