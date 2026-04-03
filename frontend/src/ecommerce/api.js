import { API, getAuthHeaders } from "config";

// =========================
// 📦 FETCH PRODUCTS
// =========================
export async function fetchProducts() {
  const res = await fetch(`${API}/products/`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

// =========================
// 🧾 CREATE ORDER
// =========================
export async function createOrder(order) {
  const res = await fetch(`${API}/sales/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(order),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to create order");
  }

  return res.json();
}
