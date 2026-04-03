import { API } from "config";

const STORAGE_KEY = "offline_sales_queue";

function getQueue() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveQueue(queue) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export async function syncOfflineSales() {
  let queue = getQueue();

  if (!queue.length) return;

  console.log("🔄 Syncing offline sales:", queue.length);

  for (let i = 0; i < queue.length; i++) {
    const sale = queue[i];

    // 🔥 SKIP if already synced or in progress
    if (sale.synced || sale.syncing) continue;

    try {
      // 🔥 MARK AS SYNCING
      sale.syncing = true;
      saveQueue(queue);

      const res = await fetch(`${API}/sales/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(sale)
      });

      if (!res.ok) {
        console.warn("❌ Failed to sync:", sale.offline_id);

        // reset syncing so it can retry later
        sale.syncing = false;
        saveQueue(queue);
        continue;
      }

      console.log("✅ Synced:", sale.offline_id);

      // 🔥 MARK AS SYNCED
      sale.synced = true;
      sale.syncing = false;

      saveQueue(queue);

    } catch (err) {
      console.log("⚠️ Still offline...");
      break; // stop trying if network fails
    }
  }

  // 🔥 CLEAN UP (remove synced)
  queue = getQueue().filter(s => !s.synced);
  saveQueue(queue);
}