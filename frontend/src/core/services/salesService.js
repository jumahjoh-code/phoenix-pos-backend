// src/core/services/salesService.js

import { authFetch } from "../api/apiClient";

export const getSales = () => authFetch("/sales/");

export const getTodaySummary = () =>
  authFetch("/sales/summary/today");

// 🔥 FIXED (NO MORE 422)
export const getCashierPerformance = () =>
  authFetch("/sales/reports/cashier-performance?range=today");

export const recordSale = (data) =>
  authFetch("/sales/", {
    method: "POST",
    body: JSON.stringify(data)
  });
