// src/core/services/paymentService.js

import { authFetch } from "../api/apiClient";

// =========================
// 💵 CASH PAYMENT
// =========================
export const payCash = async (saleId, amount) => {

  const res = await authFetch("/payments/cash", {
    method: "POST",
    body: JSON.stringify({
      sale_id: saleId,
      amount: Number(amount)
    })
  });

  if (!res || !res.ok) {
    const err = await safeError(res);
    throw new Error(err);
  }

  return res.json();
};

// =========================
// 📄 GET PAYMENTS FOR SALE
// =========================
export const getSalePayments = async (saleId) => {

  const res = await authFetch(`/payments/sale/${saleId}`);

  if (!res || !res.ok) {
    const err = await safeError(res);
    throw new Error(err);
  }

  return res.json();
};

// =========================
// 💰 GET TOTAL PAID
// =========================
export const getSaleTotalPaid = async (saleId) => {

  const res = await authFetch(`/payments/total/${saleId}`);

  if (!res || !res.ok) {
    const err = await safeError(res);
    throw new Error(err);
  }

  return res.json();
};

// =========================
// ⚠️ SAFE ERROR PARSER
// =========================
const safeError = async (res) => {
  try {
    const data = await res.json();
    return data?.detail || "Payment request failed";
  } catch {
    return "Payment request failed";
  }
};
