import { buildSalePayload } from "../payloads/salePayload";
import { API } from "../../../config";

// =========================
// 🧾 CREATE SALE (FINAL)
// =========================
export async function createSale(cart, user = { id: 1 }) {
  try {
    // =========================
    // 🔍 VALIDATION
    // =========================
    if (!cart || cart.length === 0) {
      throw new Error("Cart is empty");
    }

    // =========================
    // 📦 BUILD PAYLOAD
    // =========================
    const payload = buildSalePayload(cart, user);

    console.log("🚀 FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

    // =========================
    // 📡 API REQUEST
    // =========================
    const res = await fetch(`${API}/sales/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // =========================
    // 🧠 SAFE RESPONSE PARSE
    // =========================
    let data;

    try {
      data = await res.json();
    } catch (parseError) {
      console.error("❌ RESPONSE PARSE ERROR:", parseError);
      throw new Error("Invalid server response");
    }

    console.log("🔍 RAW RESPONSE:", JSON.stringify(data, null, 2));

    // =========================
    // ❌ ERROR HANDLING
    // =========================
    if (!res.ok) {
      const message =
        typeof data?.detail === "string"
          ? data.detail
          : data?.message ||
            JSON.stringify(data, null, 2);

      throw new Error(message);
    }

    // =========================
    // ✅ RESPONSE VALIDATION
    // =========================
    if (!data || !(data.id || data.sale_id)) {
      console.error("❌ INVALID SALE RESPONSE:", data);
      throw new Error("Sale created but no ID returned");
    }

    // =========================
    // ✅ SUCCESS
    // =========================
    return data;

  } catch (err) {
    console.error("❌ SALE ERROR FULL:", err.message);
    throw err;
  }
}