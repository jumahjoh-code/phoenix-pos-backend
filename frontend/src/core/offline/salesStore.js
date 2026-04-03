const STORAGE_KEY = "offline_sales_queue";

// =========================
// 📥 GET ALL SALES
// =========================
export const getOfflineSales = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

// =========================
// ➕ ADD SALE
// =========================
export const addOfflineSale = (sale) => {

  const sales = getOfflineSales();

  sales.push({
    ...sale,
    local_id: Date.now(),   // unique local ID
    synced: false
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
};

// =========================
// ✅ MARK AS SYNCED
// =========================
export const markSaleSynced = (local_id) => {

  const sales = getOfflineSales().map(s =>
    s.local_id === local_id ? { ...s, synced: true } : s
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
};

// =========================
// 🧹 CLEAR SYNCED SALES
// =========================
export const clearSyncedSales = () => {

  const sales = getOfflineSales().filter(s => !s.synced);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
};
