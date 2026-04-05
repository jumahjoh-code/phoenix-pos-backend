import { authFetch } from "../core/api/apiClient";

// ==========================
// COMPLETE SALE (NEW CORE)
// ==========================
export const completeSale = async (saleData) => {
  try {
    console.log("🧾 COMPLETE SALE PAYLOAD:", saleData);

    const res = await authFetch("/sales/complete", {
      method: "POST",
      body: JSON.stringify(saleData),
    });

    const data = await res.json();

    console.log("✅ COMPLETE SALE RESPONSE:", data);

    return data;
  } catch (error) {
    console.error("❌ COMPLETE SALE ERROR:", error);
    throw error;
  }
};