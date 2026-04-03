// src/core/services/productService.js

import { authFetch } from "../api/apiClient";

export const getProducts = () => authFetch("/products/");

export const createProduct = (data) =>
  authFetch("/products/", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const updateProduct = (id, data) =>
  authFetch(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const deleteProduct = (id) =>
  authFetch(`/products/${id}`, {
    method: "DELETE"
  });
