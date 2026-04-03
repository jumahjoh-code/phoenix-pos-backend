// src/core/services/authService.js

import { API } from "config";

export const loginUser = async (username, password) => {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Login failed");
  }

  return data;
};
