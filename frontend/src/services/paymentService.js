import api from "../core/api/apiClient";

// =========================
// 💰 PROCESS CASH PAYMENT
// =========================
export const processCashPayment = async (saleId, amount) => {
  try {
    const payload = {
      sale_id: saleId,          // ✅ REQUIRED (must come from successful sale)
      amount: Number(amount),  // ✅ ensure number
      method: "cash",
    };

    console.log("PAYMENT PAYLOAD:", payload);

    const response = await api.post("/api/payments/cash", payload);

    console.log("PAYMENT RESPONSE:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ PAYMENT ERROR:", error.response?.data || error.message);
    return null;
  }
};