import { API } from "config";

// =========================
// 🔥 CORE REQUEST HANDLER
// =========================
async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Request failed");
    }

    return data;

  } catch (err) {
    console.error("API ERROR:", err.message);
    throw err;
  }
}

// =========================
// 📦 PRODUCTS
// =========================
export const getProducts = () => request("/products/");

// =========================
// 💰 SALES
// =========================
export const createSale = (payload) =>
  request("/sales/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// =========================
// 💵 CASH PAYMENT
// =========================
export const payCash = (payload) =>
  request("/payments/cash", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// =========================
// 📱 M-PESA
// =========================
export const mpesaCheckout = (payload) =>
  request("/payments/mpesa", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// =========================
// 💰 CASH CONTROL
// =========================
export const recordCash = (payload) =>
  request("/ledger/cash", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getCashData = () =>
  request("/ledger/cash");
