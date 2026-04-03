import { buildSalePayload } from "../payloads/salePayload";
import { API } from "../../../config"; // ✅ FIXED PATH

export async function createSale(cart, user = { id: 1 }) {
  const payload = buildSalePayload(cart, user);

  console.log("🚀 FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(`${API}/sales/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    console.log("🔍 RAW RESPONSE:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      throw new Error(
        typeof data?.detail === "string"
          ? data.detail
          : JSON.stringify(data, null, 2)
      );
    }

    return data;

  } catch (err) {
    console.error("❌ Sale error FULL:", err.message);
    throw err;
  }
}