import { authFetch } from "../api/apiClient";

export const createBackup = async () => {
  try {
    const res = await authFetch("/api/backup/create");
    return { ok: true, data: res };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

export const getBackups = async () => {
  try {
    const res = await authFetch("/api/backup/list");
    return { ok: true, data: res };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

export const restoreBackup = async (file) => {
  try {
    const res = await authFetch("/api/backup/restore", {
      method: "POST",
      body: JSON.stringify({ file }),
    });
    return { ok: true, data: res };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};