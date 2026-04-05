import api from "../core/api"; // adjust if your path differs

// ==========================
// COMPLETE SALE (NEW CORE)
// ==========================
export const completeSale = async (saleData) => {
  try {
    console.log("🧾 COMPLETE SALE PAYLOAD:", saleData);

    const response = await api.post("/sales/complete", saleData);

    console.log("✅ COMPLETE SALE RESPONSE:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ COMPLETE SALE ERROR:", error.response?.data || error.message);
    throw error;
  }
};