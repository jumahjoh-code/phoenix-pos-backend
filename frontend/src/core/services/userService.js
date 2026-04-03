// src/core/services/userService.js

import { authFetch } from "../api/apiClient";

export const getUsers = () => authFetch("/users/");

export const createUser = (data) =>
  authFetch("/users/", {
    method: "POST",
    body: JSON.stringify(data)
  });

export const updateUser = (id, data) =>
  authFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });

export const deleteUser = (id) =>
  authFetch(`/users/${id}`, {
    method: "DELETE"
  });
