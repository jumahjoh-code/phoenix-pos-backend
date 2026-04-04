import { authFetch } from "../core/api/apiClient";

// =========================
// 💰 PROCESS CASH PAYMENT
// =========================
export const processCashPayment = async (saleId, amount) => {
  try {
    const payload = {
      sale_id: saleId,
      amount: Number(amount),
      method: "cash",
    };

    console.log("PAYMENT PAYLOAD:", payload);

    const res = await authFetch("/api/payments/cash", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    console.log("PAYMENT RESPONSE:", data);

    return data;
  } catch (error) {
    console.error("❌ PAYMENT ERROR:", error);
    return null;
  }
};