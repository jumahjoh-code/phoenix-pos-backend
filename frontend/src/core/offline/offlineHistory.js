const STORAGE_KEY = "offline_sales_queue";

export function getOfflineHistory() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}