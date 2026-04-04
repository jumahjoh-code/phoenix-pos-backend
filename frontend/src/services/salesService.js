import api from "../core/api/apiClient";

// =========================
// 🧾 COMPLETE SALE
// =========================
export const completeSale = async (cartItems, total) => {
  try {
    const payload = {
      items: cartItems.map((item) => ({
        product_id: item.id,        // ✅ must be snake_case
        quantity: Number(item.quantity),
        price: Number(item.price),
      })),
      total_amount: Number(total),
    };

    console.log("SALE PAYLOAD:", payload);

    const response = await api.post("/api/sales/", payload);

    console.log("SALE RESPONSE:", response.data);

    return response.data;
  } catch (error) {
    console.error("❌ SALE ERROR:", error.response?.data || error.message);
    return null;
  }
};