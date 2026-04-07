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
// 📊 GET QUEUE COUNT
// =========================
export const getQueueCount = () => getQueue().length;

// =========================
// 💾 SAVE QUEUE
// =========================
const saveQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to save queue:", err);
  }
};

// =========================
// ➕ ADD TO QUEUE (ENHANCED)
// =========================
export const addToQueue = (item) => {
  const queue = getQueue();

  const enrichedItem = {
    id: `${Date.now()}-${Math.random()}`, // unique ID
    url: item.url,
    options: item.options,
    retries: 0,
    timestamp: Date.now(),
  };

  queue.push(enrichedItem);

  saveQueue(queue);
};

// =========================
// ❌ REMOVE FIRST ITEM
// =========================
export const removeFirstItem = () => {
  const queue = getQueue();

  if (!queue.length) return;

  queue.shift();
  saveQueue(queue);
};

// =========================
// ❌ REMOVE BY ID (NEW)
// =========================
export const removeById = (id) => {
  const queue = getQueue();
  const updated = queue.filter((item) => item.id !== id);
  saveQueue(updated);
};

// =========================
// 🧹 CLEAR QUEUE
// =========================
export const clearQueue = () => {
  localStorage.removeItem(QUEUE_KEY);
};

// =========================
// 🔄 PROCESS QUEUE (IMPROVED)
// =========================
export const processQueue = async () => {
  const queue = getQueue();

  if (!queue.length) return;

  const remaining = [];

  for (const item of queue) {
    try {
      const res = await fetch(item.url, item.options);

      if (!res.ok) {
        throw new Error("Request failed");
      }

      console.log("✅ Synced:", item.url);

    } catch (err) {
      console.warn("⚠️ Queue retry failed:", item.url);

      // Retry logic
      const retries = (item.retries || 0) + 1;

      if (retries < 5) {
        remaining.push({
          ...item,
          retries,
        });
      } else {
        console.error("❌ Dropped after max retries:", item.url);
      }
    }
  }

  saveQueue(remaining);
};