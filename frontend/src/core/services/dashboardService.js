// src/core/services/dashboardService.js

import { authFetch } from "../api/apiClient";

export const getDashboardSummary = () =>
  authFetch("/ai/dashboard");

export const getRecentSales = () =>
  authFetch("/ai/recent-sales");

export const getLowStock = () =>
  authFetch("/ai/low-stock");
