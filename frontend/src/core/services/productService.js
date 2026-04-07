import { authFetch } from "../api/apiClient";

// =========================
// 📦 GET PRODUCTS
// =========================
export const getProducts = async () => {
  const res = await authFetch("/products/");

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || "Failed to fetch products",
      status: res.status,
    };
  }

  return {
    ok: true,
    data: res.data || [],
    status: res.status,
  };
};

// =========================
// ➕ CREATE PRODUCT
// =========================
export const createProduct = async (data) => {
  const res = await authFetch("/products/", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || "Failed to create product",
      status: res.status,
    };
  }

  return {
    ok: true,
    data: res.data,
    status: res.status,
  };
};

// =========================
// ✏️ UPDATE PRODUCT
// =========================
export const updateProduct = async (id, data) => {
  const res = await authFetch(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || "Failed to update product",
      status: res.status,
    };
  }

  return {
    ok: true,
    data: res.data,
    status: res.status,
  };
};

// =========================
// ❌ DELETE PRODUCT
// =========================
export const deleteProduct = async (id) => {
  const res = await authFetch(`/products/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    return {
      ok: false,
      error: res.error || "Failed to delete product",
      status: res.status,
    };
  }

  return {
    ok: true,
    data: res.data,
    status: res.status,
  };
};