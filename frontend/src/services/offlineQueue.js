// =========================
// 🧠 STORAGE KEY
// =========================
const QUEUE_KEY = "offline_queue";

// =========================
// 📦 GET QUEUE
// =========================
const getQueue = () => {
  const data = localStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
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
  queue.push(item);
  saveQueue(queue);
};

// =========================
// 🔄 PROCESS QUEUE
// =========================
export const processQueue = async (api) => {
  const queue = getQueue();

  if (!queue.length) return;

  const remaining = [];

  for (const item of queue) {
    try {
      await api.post(item.endpoint, item.payload);
    } catch (err) {
      console.error("Queue retry failed:", err.message);
      remaining.push(item); // keep if still failing
    }
  }

  saveQueue(remaining);
};