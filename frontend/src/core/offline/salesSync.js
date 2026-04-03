import { getOfflineSales, markSaleSynced, clearSyncedSales } from "./salesStore";
import { authFetch } from "../api/apiClient";

export const syncOfflineSales = async () => {

  const sales = getOfflineSales().filter(s => !s.synced);

  if (!sales.length) return;

  for (const sale of sales) {
    try {
      const res = await authFetch("/sales", {
        method: "POST",
        body: JSON.stringify(sale)
      });

      if (res && res.ok) {
        markSaleSynced(sale.local_id);
      }

    } catch (err) {
      console.warn("Sync failed for sale:", sale.local_id);
      return; // stop syncing if network fails
    }
  }

  clearSyncedSales();
};
