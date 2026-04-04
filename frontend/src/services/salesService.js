import { authFetch } from "../core/api/apiClient";

// =========================
// 🧾 COMPLETE SALE
// =========================
export const completeSale = async (cartItems, total) => {
  try {
    const payload = {
      items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: Number(item.quantity),
        price: Number(item.price),
      })),
      total_amount: Number(total),
    };

    console.log("SALE PAYLOAD:", payload);

    const res = await authFetch("/api/sales/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    console.log("SALE RESPONSE:", data);

    return data;
  } catch (error) {
    console.error("❌ SALE ERROR:", error);
    return null;
  }
};