import { API } from "config"; // adjust path if needed

export async function fetchProducts() {
  const res = await fetch(`${API}/products/`);

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}
