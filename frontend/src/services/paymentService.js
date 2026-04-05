import { authFetch } from "../core/api/apiClient";

// =========================
// 💰 PROCESS CASH PAYMENT
// =========================
export const processCashPayment = async (saleId, amount) => {
  try {
    const payload = {
      sale_id: saleId,
      amount: Number(amount),
    };

    console.log("PAYMENT PAYLOAD:", payload);

    const res = await authFetch("/payments/cash", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    console.log("PAYMENT RESPONSE:", data);

    // ✅ HANDLE FAILURE PROPERLY
    if (!res.ok || !data.success) {
      throw new Error(data.detail || "Payment failed");
    }

    return data;
  } catch (error) {
    console.error("❌ PAYMENT ERROR:", error);
    return null;
  }
};