import { authFetch } from "../core/api/apiClient";

// ==========================
// COMPLETE SALE (FINAL)
// ==========================
export const completeSale = async (saleData) => {
  console.log("🧾 COMPLETE SALE PAYLOAD:", saleData);

  const res = await authFetch("/sales/complete", {
    method: "POST",
    body: JSON.stringify(saleData),
  });

  // ❌ HANDLE ERROR
  if (!res.ok) {
    console.error("❌ COMPLETE SALE ERROR:", res.error);
    return {
      ok: false,
      error: res.error || "Sale failed",
      status: res.status,
    };
  }

  console.log("✅ COMPLETE SALE RESPONSE:", res.data);

  // ✅ RETURN STANDARDIZED RESPONSE
  return {
    ok: true,
    data: res.data,
    status: res.status,
  };
};